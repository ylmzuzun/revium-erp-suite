import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, DollarSign } from "lucide-react";
import { generateFinancialReportPDF } from "@/services/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface FinancialReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FinancialReportDialog = ({ open, onOpenChange }: FinancialReportDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Lütfen tarih aralığı seçin");
      return;
    }

    setLoading(true);
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            quantity,
            unit_price,
            total,
            products(cost)
          )
        `)
        .gte("order_date", startDate)
        .lte("order_date", endDate);

      if (ordersError) throw ordersError;

      // Gelir hesaplama
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      
      // Gider hesaplama (ürün maliyeti × miktar)
      let totalCost = 0;
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const cost = item.products?.cost || 0;
          totalCost += cost * item.quantity;
        });
      });

      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Aylık gelir-gider trendi
      const monthlyData = new Map<string, { revenue: number; cost: number }>();
      orders?.forEach(order => {
        const month = new Date(order.order_date!).toISOString().slice(0, 7);
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { revenue: 0, cost: 0 });
        }
        const data = monthlyData.get(month)!;
        data.revenue += order.total;
        
        order.order_items?.forEach((item: any) => {
          const cost = item.products?.cost || 0;
          data.cost += cost * item.quantity;
        });
      });

      const monthlyTrend = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          cost: data.cost,
          profit: data.revenue - data.cost
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Ürün karlılığı
      const productProfitability = new Map();
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productName = item.products?.name || "Bilinmeyen";
          if (!productProfitability.has(productName)) {
            productProfitability.set(productName, { name: productName, revenue: 0, cost: 0 });
          }
          const prod = productProfitability.get(productName);
          prod.revenue += item.total;
          prod.cost += (item.products?.cost || 0) * item.quantity;
        });
      });

      const topProfitableProducts = Array.from(productProfitability.values())
        .map(p => ({ ...p, profit: p.revenue - p.cost }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10);

      const data = {
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        monthlyTrend,
        topProfitableProducts
      };

      setReportData(data);

      // PDF oluştur ve kaydet
      const pdfBlob = generateFinancialReportPDF(data, startDate, endDate);
      const fileName = `financial-report-${Date.now()}.pdf`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob);

      if (uploadError) throw uploadError;

      await supabase.from("reports").insert({
        title: `Mali Rapor ${startDate} - ${endDate}`,
        report_type: "financial",
        report_format: "pdf",
        start_date: startDate,
        end_date: endDate,
        file_path: filePath,
        file_size: pdfBlob.size,
        created_by: user?.id,
      });

      toast.success("Mali rapor başarıyla oluşturuldu");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Mali Rapor Oluştur
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
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Toplam Gelir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₺{reportData.totalRevenue.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Toplam Gider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₺{reportData.totalCost.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Brüt Kar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-success">₺{reportData.grossProfit.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Kar Marjı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reportData.profitMargin.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gelir-Gider-Kar Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₺${Number(value).toFixed(2)}`} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        name="Gelir"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cost" 
                        stackId="2"
                        stroke="hsl(var(--destructive))" 
                        fill="hsl(var(--destructive))" 
                        name="Gider"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stackId="3"
                        stroke="hsl(var(--success))" 
                        fill="hsl(var(--success))" 
                        name="Kar"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">En Karlı Ürünler (Top 5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.topProfitableProducts.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => `₺${Number(value).toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Gelir" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="cost" fill="hsl(var(--destructive))" name="Gider" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="profit" fill="hsl(var(--success))" name="Kar" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
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
