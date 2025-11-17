import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductionOrder {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  unit: string;
  customer_name: string | null;
  status: string;
  due_date: string;
  priority: number;
}

const Production = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("production_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Siparişler yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_production":
        return "secondary";
      case "planned":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: "Planlanan",
      in_production: "Üretimde",
      quality_check: "Kalite Kontrol",
      completed: "Tamamlandı",
      on_hold: "Beklemede",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Üretim Siparişleri</h1>
            <p className="text-muted-foreground mt-1">Üretim süreçlerini yönetin</p>
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
                    <h3 className="font-semibold text-foreground">{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{order.product_name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-muted-foreground">
                        Miktar: {order.quantity} {order.unit}
                      </span>
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      {order.customer_name && (
                        <span className="text-sm text-muted-foreground">
                          Müşteri: {order.customer_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Termin: {new Date(order.due_date).toLocaleDateString("tr-TR")}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Detaylar
                    </Button>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz üretim siparişi bulunmuyor
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Production;
