import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { MaterialTransactionsDialog } from "./MaterialTransactionsDialog";

interface RawMaterialDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const RawMaterialDetailModal = ({
  open,
  onOpenChange,
  material,
  onEdit,
  onDelete,
}: RawMaterialDetailModalProps) => {
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Bu hammaddeyi silmek istediğinizden emin misiniz?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("raw_materials")
        .delete()
        .eq("id", material.id);

      if (error) throw error;

      toast.success("Hammadde başarıyla silindi");
      onDelete();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      chemical: "Kimyasal",
      metal: "Metal",
      plastic: "Plastik",
      electronic: "Elektronik",
      packaging: "Ambalaj",
      other: "Diğer"
    };
    return labels[category] || category;
  };

  const getStockStatus = (stock: number, min_stock: number) => {
    if (stock === 0) return { label: "Tükendi", variant: "destructive" as const };
    if (stock < min_stock) return { label: "Düşük", variant: "secondary" as const };
    return { label: "Normal", variant: "default" as const };
  };

  const stockStatus = getStockStatus(material.stock, material.min_stock);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{material.name}</DialogTitle>
              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">SKU</p>
                <p className="font-medium">{material.sku}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kategori</p>
                <p className="font-medium">{getCategoryLabel(material.category)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mevcut Stok</p>
                <p className="font-medium text-lg">
                  {material.stock} {material.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Minimum Stok</p>
                <p className="font-medium">
                  {material.min_stock} {material.unit}
                </p>
              </div>
              {material.max_stock && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Maksimum Stok</p>
                  <p className="font-medium">
                    {material.max_stock} {material.unit}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Birim Maliyet</p>
                <p className="font-medium">₺{material.cost}</p>
              </div>
              {material.supplier && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tedarikçi</p>
                  <p className="font-medium">{material.supplier}</p>
                </div>
              )}
              {material.location && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Depo Konumu</p>
                  <p className="font-medium">{material.location}</p>
                </div>
              )}
            </div>

            {material.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Açıklama</p>
                <p className="text-sm">{material.description}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTransactionsOpen(true)}
              >
                <History className="mr-2 h-4 w-4" />
                İşlem Geçmişi
              </Button>
              <Button variant="outline" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Siliniyor..." : "Sil"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MaterialTransactionsDialog
        open={transactionsOpen}
        onOpenChange={setTransactionsOpen}
        materialId={material.id}
        materialName={material.name}
      />
    </>
  );
};
