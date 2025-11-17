import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Package, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalesReportDialog } from "@/components/Reports/SalesReportDialog";
import { ProductionReportDialog } from "@/components/Reports/ProductionReportDialog";
import { CustomerReportDialog } from "@/components/Reports/CustomerReportDialog";
import { FinancialReportDialog } from "@/components/Reports/FinancialReportDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Reports = () => {
  const { user } = useAuth();
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSavedReports();
    }
  }, [user]);

  const fetchSavedReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setSavedReports(data || []);
    } catch (error: any) {
      console.error("Raporlar yüklenirken hata:", error);
    }
  };

  const downloadReport = async (report: any) => {
    setDownloading(report.id);
    try {
      const { data, error } = await supabase.storage
        .from("reports")
        .download(report.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Rapor indirildi");
    } catch (error: any) {
      toast.error("İndirme hatası: " + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sales: "Satış",
      production: "Üretim",
      customer: "Müşteri",
      financial: "Mali"
    };
    return labels[type] || type;
  };

  const reportTypes = [
    {
      icon: TrendingUp,
      title: "Satış Raporu",
      description: "Günlük, haftalık ve aylık satış analizleri",
      color: "primary",
      onClick: () => setSalesDialogOpen(true)
    },
    {
      icon: Package,
      title: "Üretim Raporu",
      description: "Üretim süreçleri ve tamamlanma oranları",
      color: "success",
      onClick: () => setProductionDialogOpen(true)
    },
    {
      icon: Users,
      title: "Müşteri Raporu",
      description: "Müşteri analizleri ve davranış raporları",
      color: "info",
      onClick: () => setCustomerDialogOpen(true)
    },
    {
      icon: FileText,
      title: "Mali Rapor",
      description: "Gelir-gider ve kar-zarar analizi",
      color: "warning",
      onClick: () => setFinancialDialogOpen(true)
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Raporlar</h1>
          <p className="text-muted-foreground mt-1">İş analizleri ve raporlama</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {reportTypes.map((report, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={report.onClick}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{report.description}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    report.onClick();
                  }}
                >
                  Rapor Oluştur
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <SalesReportDialog open={salesDialogOpen} onOpenChange={(open) => { setSalesDialogOpen(open); if (!open) fetchSavedReports(); }} />
        <ProductionReportDialog open={productionDialogOpen} onOpenChange={(open) => { setProductionDialogOpen(open); if (!open) fetchSavedReports(); }} />
        <CustomerReportDialog open={customerDialogOpen} onOpenChange={(open) => { setCustomerDialogOpen(open); if (!open) fetchSavedReports(); }} />
        <FinancialReportDialog open={financialDialogOpen} onOpenChange={(open) => { setFinancialDialogOpen(open); if (!open) fetchSavedReports(); }} />

        <Card>
          <CardHeader>
            <CardTitle>Son Oluşturulan Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            {savedReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Henüz rapor oluşturulmamış</p>
            ) : (
              <div className="space-y-3">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {getReportTypeLabel(report.report_type)} • {new Date(report.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => downloadReport(report)}
                      disabled={downloading === report.id}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloading === report.id ? "İndiriliyor..." : "İndir"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;
