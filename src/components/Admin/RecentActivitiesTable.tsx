import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  user_id: string | null;
  profiles?: {
    full_name: string;
  };
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Oluşturma",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
};

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
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

export const RecentActivitiesTable = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          table_name,
          created_at,
          user_id,
          profiles:user_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching logs:", error);
      } else {
        setLogs(data as any);
      }
      setLoading(false);
    };

    fetchLogs();

    // Realtime subscription
    const channel = supabase
      .channel("admin_dashboard_logs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: newLog } = await supabase
              .from("audit_logs")
              .select(`
                id,
                action,
                table_name,
                created_at,
                user_id,
                profiles:user_id (full_name)
              `)
              .eq("id", payload.new.id)
              .single();

            if (newLog) {
              setLogs((prev) => [newLog as any, ...prev.slice(0, 9)]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Aktiviteler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Henüz aktivite bulunmuyor
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={ACTION_COLORS[log.action]}>
                    {ACTION_LABELS[log.action]}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {TABLE_LABELS[log.table_name] || log.table_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.profiles?.full_name || "Sistem"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
