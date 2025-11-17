import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Users } from "lucide-react";
import { generateCustomerReportPDF } from "@/services/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface CustomerReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerReportDialog = ({ open, onOpenChange }: CustomerReportDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const SEGMENT_COLORS = ["hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--muted))"];

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Lütfen tarih aralığı seçin");
      return;
    }

    setLoading(true);
    try {
      const { data: allCustomers, error: customersError } = await supabase
        .from("customers")
        .select(`
          *,
          orders(id, total, order_date)
        `);

      if (customersError) throw customersError;

      const totalCustomers = allCustomers?.length || 0;
      const newCustomers = allCustomers?.filter(c => 
        c.created_at >= startDate && c.created_at <= endDate
      ).length || 0;

      // Aktif müşteriler (tarih aralığında sipariş verenler)
      const activeCustomers = allCustomers?.filter(c =>
        c.orders?.some((o: any) => o.order_date >= startDate && o.order_date <= endDate)
      ).length || 0;

      // En değerli müşteriler
      const customerStats = allCustomers?.map(c => {
        const ordersInRange = c.orders?.filter((o: any) => 
          o.order_date >= startDate && o.order_date <= endDate
        ) || [];
        const total = ordersInRange.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        return {
          name: c.name,
          orders: ordersInRange.length,
          total
        };
      }) || [];

      const topCustomers = customerStats
        .filter(c => c.orders > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Müşteri segmentasyonu
      const segments = {
        high: customerStats.filter(c => c.total > 50000).length,
        medium: customerStats.filter(c => c.total >= 10000 && c.total <= 50000).length,
        low: customerStats.filter(c => c.total < 10000 && c.total > 0).length
      };

      const data = {
        totalCustomers,
        activeCustomers,
        newCustomers,
        topCustomers,
        segments
      };

      setReportData(data);

      // PDF oluştur ve kaydet
      const pdfBlob = generateCustomerReportPDF(data, startDate, endDate);
      const fileName = `customer-report-${Date.now()}.pdf`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob);

      if (uploadError) throw uploadError;

      await supabase.from("reports").insert({
        title: `Müşteri Raporu ${startDate} - ${endDate}`,
        report_type: "customer",
        report_format: "pdf",
        start_date: startDate,
        end_date: endDate,
        file_path: filePath,
        file_size: pdfBlob.size,
        created_by: user?.id,
      });

      toast.success("Müşteri raporu başarıyla oluşturuldu");
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
            <Users className="h-5 w-5" />
            Müşteri Raporu Oluştur
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
                    <CardTitle className="text-sm">Toplam Müşteri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.totalCustomers}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Aktif Müşteri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.activeCustomers}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Yeni Müşteri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.newCustomers}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Müşteri Segmentasyonu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Yüksek Değerli (>₺50K)", value: reportData.segments.high },
                            { name: "Orta Değerli (₺10K-₺50K)", value: reportData.segments.medium },
                            { name: "Düşük Değerli (<₺10K)", value: reportData.segments.low }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {SEGMENT_COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">En Değerli Müşteriler (Top 5)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={reportData.topCustomers.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => `₺${Number(value).toFixed(2)}`} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
