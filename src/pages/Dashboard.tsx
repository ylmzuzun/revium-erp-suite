import { MainLayout } from "@/components/Layout/MainLayout";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, TrendingUp } from "lucide-react";

const Dashboard = () => {
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
            value="1,234"
            icon={Users}
            trend={{ value: "+12% bu ay", positive: true }}
            variant="primary"
          />
          <StatCard
            title="Aktif Siparişler"
            value="89"
            icon={ShoppingCart}
            trend={{ value: "+5% bu hafta", positive: true }}
            variant="success"
          />
          <StatCard
            title="Ürün Stok"
            value="456"
            icon={Package}
            trend={{ value: "-3% bu ay", positive: false }}
          />
          <StatCard
            title="Aylık Ciro"
            value="₺845K"
            icon={TrendingUp}
            trend={{ value: "+18% bu ay", positive: true }}
            variant="warning"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Son Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">Sipariş #{1000 + i}</p>
                      <p className="text-sm text-muted-foreground">Müşteri {i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₺{(Math.random() * 5000 + 1000).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Bugün</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Düşük Stoklu Ürünler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Ürün A", stock: 5, min: 10 },
                  { name: "Ürün B", stock: 8, min: 15 },
                  { name: "Ürün C", stock: 3, min: 10 },
                  { name: "Ürün D", stock: 12, min: 20 },
                  { name: "Ürün E", stock: 7, min: 15 },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Min: {product.min} adet</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        {product.stock} adet
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
