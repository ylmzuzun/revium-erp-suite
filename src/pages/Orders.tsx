import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Orders = () => {
  const orders = [
    { id: 1001, customer: "Ahmet Yılmaz", date: "2024-01-15", total: "₺1,299.99", status: "Tamamlandı" },
    { id: 1002, customer: "Ayşe Demir", date: "2024-01-16", total: "₺2,450.00", status: "İşleniyor" },
    { id: 1003, customer: "Mehmet Kaya", date: "2024-01-16", total: "₺899.99", status: "Beklemede" },
    { id: 1004, customer: "Fatma Şahin", date: "2024-01-17", total: "₺3,750.00", status: "Tamamlandı" },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Tamamlandı":
        return "default";
      case "İşleniyor":
        return "secondary";
      case "Beklemede":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Siparişler</h1>
            <p className="text-muted-foreground mt-1">Sipariş takibi ve yönetimi</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Sipariş
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Sipariş ara..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">Sipariş #{order.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{order.customer}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-muted-foreground">{order.date}</span>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{order.total}</p>
                    <Button variant="outline" size="sm" className="mt-2">Detaylar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Orders;
