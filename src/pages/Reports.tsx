import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const reportTypes = [
    {
      icon: TrendingUp,
      title: "Satış Raporu",
      description: "Günlük, haftalık ve aylık satış analizleri",
      color: "primary"
    },
    {
      icon: Package,
      title: "Stok Raporu",
      description: "Mevcut stok durumu ve hareketleri",
      color: "success"
    },
    {
      icon: Users,
      title: "Müşteri Raporu",
      description: "Müşteri analizleri ve davranış raporları",
      color: "info"
    },
    {
      icon: FileText,
      title: "Mali Rapor",
      description: "Gelir-gider ve kar-zarar analizi",
      color: "warning"
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
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
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
                <Button variant="outline" className="w-full">Rapor Oluştur</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Son Oluşturulan Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Ocak Ayı Satış Raporu", date: "15 Ocak 2024", type: "Satış" },
                { name: "Stok Durum Raporu", date: "14 Ocak 2024", type: "Stok" },
                { name: "Müşteri Analiz Raporu", date: "12 Ocak 2024", type: "Müşteri" },
              ].map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.type} • {report.date}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">İndir</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;
