import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, FileText, Download, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500",
  UPDATE: "bg-blue-500",
  DELETE: "bg-red-500",
};

const TABLE_LABELS: Record<string, string> = {
  tasks: "Görevler",
  user_roles: "Kullanıcı Rolleri",
  departments: "Departmanlar",
  production_orders: "Üretim Siparişleri",
  production_processes: "Üretim Süreçleri",
  profiles: "Profiller",
  notifications: "Bildirimler",
  shared_files: "Paylaşılan Dosyalar",
  task_assignments: "Görev Atamaları",
  role_permissions: "Rol Yetkileri",
};

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as AuditLog;
            if (newLog.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .eq("id", newLog.user_id)
                .single();
              if (profile) newLog.profiles = profile;
            }
            setLogs(prev => [newLog, ...prev].slice(0, 200));
            toast.info(`Yeni aktivite: ${newLog.action} - ${TABLE_LABELS[newLog.table_name] || newLog.table_name}`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (logsError) throw logsError;

      const userIds = [...new Set(logsData?.map(log => log.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      const enrichedLogs = logsData?.map(log => ({
        ...log,
        profiles: log.user_id ? profilesMap.get(log.user_id) : undefined
      })) || [];

      setLogs(enrichedLogs as AuditLog[]);
    } catch (error: any) {
      toast.error("Loglar yüklenemedi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) newSet.delete(logId);
      else newSet.add(logId);
      return newSet;
    });
  };

  const exportToCSV = () => {
    const headers = ["Tarih", "Kullanıcı", "İşlem", "Tablo", "Detaylar"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: tr }),
      log.profiles?.full_name || "Sistem",
      log.action,
      TABLE_LABELS[log.table_name] || log.table_name,
      log.action === "CREATE" ? "Yeni kayıt" : log.action === "UPDATE" ? "Güncelleme" : "Silme"
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
    toast.success("Log'lar CSV olarak indirildi");
  };

  const getChangedFields = (oldData: any, newData: any): string[] => {
    if (!oldData || !newData) return [];
    return Object.keys(newData).filter(key => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]));
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.old_data).toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.new_data).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    return matchesSearch && matchesAction && matchesTable;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logları</h2>
        <p className="text-muted-foreground">Sistemdeki tüm işlemlerin detaylı kaydı</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sistem Logları ({filteredLogs.length})
            </CardTitle>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV İndir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="İçerikte ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="CREATE">Oluşturma</SelectItem>
                <SelectItem value="UPDATE">Güncelleme</SelectItem>
                <SelectItem value="DELETE">Silme</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tablolar</SelectItem>
                {Object.entries(TABLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Tablo</TableHead>
                  <TableHead>Değişiklikler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Hiç log bulunamadı</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const changedFields = log.action === "UPDATE" ? getChangedFields(log.old_data, log.new_data) : [];
                    const isExpanded = expandedLogs.has(log.id);
                    
                    return (
                      <>
                        <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleLogExpansion(log.id)}>
                          <TableCell>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {format(new Date(log.created_at), "dd.MM.yy HH:mm", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{log.profiles?.full_name || "Sistem"}</div>
                              {log.profiles?.email && <div className="text-xs text-muted-foreground">{log.profiles.email}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={ACTION_COLORS[log.action]}>
                              {log.action === "CREATE" ? "Oluşturma" : log.action === "UPDATE" ? "Güncelleme" : "Silme"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{TABLE_LABELS[log.table_name] || log.table_name}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.action === "CREATE" && <span className="text-sm text-muted-foreground">Yeni kayıt</span>}
                            {log.action === "UPDATE" && changedFields.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {changedFields.slice(0, 3).map(field => (
                                  <Badge key={field} variant="secondary" className="text-xs">{field}</Badge>
                                ))}
                                {changedFields.length > 3 && <Badge variant="secondary" className="text-xs">+{changedFields.length - 3}</Badge>}
                              </div>
                            )}
                            {log.action === "DELETE" && <span className="text-sm text-muted-foreground">Kayıt silindi</span>}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30 p-0">
                              <div className="p-4 space-y-3">
                                {log.action === "UPDATE" && log.old_data && log.new_data && (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2 text-sm">Eski Değerler</h4>
                                      <div className="bg-background rounded p-3 text-xs space-y-1">
                                        {changedFields.map(field => (
                                          <div key={field} className="flex justify-between gap-2 border-b pb-1 last:border-0">
                                            <span className="font-medium text-muted-foreground">{field}:</span>
                                            <span className="text-red-600 line-through break-all">{JSON.stringify(log.old_data[field])}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2 text-sm">Yeni Değerler</h4>
                                      <div className="bg-background rounded p-3 text-xs space-y-1">
                                        {changedFields.map(field => (
                                          <div key={field} className="flex justify-between gap-2 border-b pb-1 last:border-0">
                                            <span className="font-medium text-muted-foreground">{field}:</span>
                                            <span className="text-green-600 font-semibold break-all">{JSON.stringify(log.new_data[field])}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {log.action === "CREATE" && log.new_data && (
                                  <div>
                                    <h4 className="font-semibold mb-2 text-sm">Oluşturulan Veri</h4>
                                    <pre className="bg-background rounded p-3 text-xs overflow-x-auto max-h-96">{JSON.stringify(log.new_data, null, 2)}</pre>
                                  </div>
                                )}
                                {log.action === "DELETE" && log.old_data && (
                                  <div>
                                    <h4 className="font-semibold mb-2 text-sm">Silinen Veri</h4>
                                    <pre className="bg-background rounded p-3 text-xs overflow-x-auto max-h-96">{JSON.stringify(log.old_data, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};