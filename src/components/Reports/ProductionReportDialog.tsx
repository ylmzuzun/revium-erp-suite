import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileBarChart } from "lucide-react";
import { generateProductionReportPDF } from "@/services/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ProductionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductionReportDialog = ({ open, onOpenChange }: ProductionReportDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const COLORS = {
    planned: "hsl(var(--primary))",
    in_production: "hsl(var(--warning))",
    quality_check: "hsl(var(--accent))",
    completed: "hsl(var(--success))",
    on_hold: "hsl(var(--muted))"
  };

  const STATUS_LABELS: Record<string, string> = {
    planned: "Planlandı",
    in_production: "Üretimde",
    quality_check: "Kalite Kontrol",
    completed: "Tamamlandı",
    on_hold: "Beklemede"
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Lütfen tarih aralığı seçin");
      return;
    }

    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("production_orders")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const completed = orders?.filter(o => o.status === "completed").length || 0;
      const completionRate = totalOrders > 0 ? (completed / totalOrders) * 100 : 0;

      // Durum dağılımı
      const statusDistribution = {
        planned: orders?.filter(o => o.status === "planned").length || 0,
        in_production: orders?.filter(o => o.status === "in_production").length || 0,
        quality_check: orders?.filter(o => o.status === "quality_check").length || 0,
        completed: orders?.filter(o => o.status === "completed").length || 0,
        on_hold: orders?.filter(o => o.status === "on_hold").length || 0
      };

      // Ürün bazlı üretim
      const productMap = new Map();
      orders?.forEach(order => {
        const name = order.product_name || "Bilinmeyen";
        if (!productMap.has(name)) {
          productMap.set(name, { name, quantity: 0, orders: 0 });
        }
        const prod = productMap.get(name);
        prod.quantity += order.quantity;
        prod.orders += 1;
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      const data = {
        totalOrders,
        completed,
        completionRate,
        statusDistribution,
        topProducts
      };

      setReportData(data);

      // PDF oluştur ve kaydet
      const pdfBlob = generateProductionReportPDF(data, startDate, endDate);
      const fileName = `production-report-${Date.now()}.pdf`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob);

      if (uploadError) throw uploadError;

      await supabase.from("reports").insert({
        title: `Üretim Raporu ${startDate} - ${endDate}`,
        report_type: "production",
        report_format: "pdf",
        start_date: startDate,
        end_date: endDate,
        file_path: filePath,
        file_size: pdfBlob.size,
        created_by: user?.id,
      });

      toast.success("Üretim raporu başarıyla oluşturuldu");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Üretim Raporu Oluştur
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {reportData && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Toplam Sipariş</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tamamlanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.completed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tamamlanma Oranı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.completionRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Durum Dağılımı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.statusDistribution).map(([key, value]) => ({
                            name: STATUS_LABELS[key],
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(reportData.statusDistribution).map((key, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[key as keyof typeof COLORS]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">En Çok Üretilen Ürünler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={reportData.topProducts.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <Button onClick={generateReport} disabled={loading} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Oluşturuluyor..." : reportData ? "Raporu İndir" : "Rapor Oluştur"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
