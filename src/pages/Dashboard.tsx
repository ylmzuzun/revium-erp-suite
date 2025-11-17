import { MainLayout } from "@/components/Layout/MainLayout";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Hoş geldiniz, işte bugünkü özet</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Toplam Müşteri"
            value={stats?.customers.total.toString() || "0"}
            icon={Users}
            trend={{
              value: `${stats?.customers.trend > 0 ? "+" : ""}${stats?.customers.trend.toFixed(1)}% bu ay`,
              positive: (stats?.customers.trend || 0) >= 0,
            }}
            variant="primary"
          />
          <StatCard
            title="Aktif Siparişler"
            value={stats?.orders.active.toString() || "0"}
            icon={ShoppingCart}
            trend={{
              value: `${stats?.orders.trend > 0 ? "+" : ""}${stats?.orders.trend.toFixed(1)}% bu ay`,
              positive: (stats?.orders.trend || 0) >= 0,
            }}
            variant="success"
          />
          <StatCard
            title="Ürün Stok"
            value={stats?.products.total_stock.toString() || "0"}
            icon={Package}
            trend={{
              value: stats?.products.low_stock_count > 0 
                ? `${stats?.products.low_stock_count} ürün düşük`
                : "Stoklar yeterli",
              positive: stats?.products.low_stock_count === 0,
            }}
          />
          <StatCard
            title="Aylık Ciro"
            value={`₺${(stats?.revenue.current_month || 0).toLocaleString('tr-TR')}`}
            icon={TrendingUp}
            trend={{
              value: `${stats?.revenue.trend > 0 ? "+" : ""}${stats?.revenue.trend.toFixed(1)}% bu ay`,
              positive: (stats?.revenue.trend || 0) >= 0,
            }}
            variant="warning"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Son Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.recent_orders || stats.recent_orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Henüz sipariş yok</p>
              ) : (
                <div className="space-y-4">
                  {stats.recent_orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₺{order.total.toLocaleString('tr-TR')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.order_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Düşük Stoklu Ürünler</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.low_stock_products || stats.low_stock_products.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Düşük stoklu ürün yok</p>
              ) : (
                <div className="space-y-4">
                  {stats.low_stock_products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Min: {product.min_stock} adet</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                          {product.stock} adet
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
