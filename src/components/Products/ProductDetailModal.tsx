import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Tag, MapPin, TrendingDown, TrendingUp } from "lucide-react";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export const ProductDetailModal = ({ open, onOpenChange, product }: ProductDetailModalProps) => {
  if (!product) return null;

  const getStockStatus = () => {
    if (product.stock === 0) return { label: "Tükendi", variant: "destructive" as const };
    if (product.stock <= product.min_stock) return { label: "Düşük Stok", variant: "secondary" as const };
    return { label: "Stokta", variant: "default" as const };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ürün Detayları</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{product.name}</h3>
              <p className="text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <Badge variant={stockStatus.variant}>
              {stockStatus.label}
            </Badge>
          </div>

          {product.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Açıklama</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Stok</p>
                  <p className="text-sm text-muted-foreground">
                    {product.stock} {product.unit}
                  </p>
                </div>
              </div>

              {product.category && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Kategori</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                </div>
              )}

              {product.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Konum</p>
                    <p className="text-sm text-muted-foreground">{product.location}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {product.price && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Satış Fiyatı</p>
                    <p className="text-sm text-muted-foreground">
                      ₺{product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {product.cost && (
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Maliyet</p>
                    <p className="text-sm text-muted-foreground">
                      ₺{product.cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Stok Limitleri</p>
                <p className="text-sm text-muted-foreground">
                  Min: {product.min_stock} {product.unit}
                  {product.max_stock && ` / Max: ${product.max_stock} ${product.unit}`}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p>Oluşturma Tarihi</p>
              <p className="font-medium">
                {new Date(product.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div>
              <p>Son Güncelleme</p>
              <p className="font-medium">
                {new Date(product.updated_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
