import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Products = () => {
  const products = [
    { id: 1, name: "Ürün A", sku: "PRD-001", stock: 150, price: "₺299.99", status: "Stokta" },
    { id: 2, name: "Ürün B", sku: "PRD-002", stock: 5, price: "₺149.99", status: "Düşük Stok" },
    { id: 3, name: "Ürün C", sku: "PRD-003", stock: 0, price: "₺499.99", status: "Tükendi" },
    { id: 4, name: "Ürün D", sku: "PRD-004", stock: 75, price: "₺799.99", status: "Stokta" },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Stokta":
        return "default";
      case "Düşük Stok":
        return "secondary";
      case "Tükendi":
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
            <h1 className="text-3xl font-bold text-foreground">Ürünler</h1>
            <p className="text-muted-foreground mt-1">Stok ve ürün yönetimi</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Ürün
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Ürün ara..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getStatusVariant(product.status)}>
                          {product.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Stok: {product.stock} adet
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{product.price}</p>
                    <Button variant="outline" size="sm" className="mt-2">Düzenle</Button>
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

export default Products;
