import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { generateSalesReportPDF } from "@/services/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";

interface SalesReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SalesReportDialog = ({ open, onOpenChange }: SalesReportDialogProps) => {
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
      // Fetch orders data
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`*, order_items(quantity, total, products(name))`)
        .gte("order_date", startDate)
        .lte("order_date", endDate);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top products
      const productMap = new Map();
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const name = item.products?.name || "Unknown";
          if (!productMap.has(name)) {
            productMap.set(name, { name, quantity: 0, revenue: 0 });
          }
          const prod = productMap.get(name);
          prod.quantity += item.quantity;
          prod.revenue += item.total;
        });
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const data = { totalOrders, totalRevenue, avgOrderValue, topProducts };
      setReportData(data);

      // Generate and save PDF
      const pdfBlob = generateSalesReportPDF(data, startDate, endDate);
      const fileName = `sales-report-${Date.now()}.pdf`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob);

      if (uploadError) throw uploadError;

      // Save to database
      await supabase.from("reports").insert({
        title: `Satış Raporu ${startDate} - ${endDate}`,
        report_type: "sales",
        report_format: "pdf",
        start_date: startDate,
        end_date: endDate,
        file_path: filePath,
        file_size: pdfBlob.size,
        created_by: user?.id,
      });

      toast.success("Rapor başarıyla oluşturuldu");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Satış Raporu Oluştur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Başlangıç Tarihi</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bitiş Tarihi</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button onClick={generateReport} disabled={loading} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Oluşturuluyor..." : "Rapor Oluştur"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
