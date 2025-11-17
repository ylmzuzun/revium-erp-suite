import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditRawMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: any;
  onSuccess: () => void;
}

export const EditRawMaterialDialog = ({
  open,
  onOpenChange,
  material,
  onSuccess,
}: EditRawMaterialDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "other",
    stock: "0",
    min_stock: "0",
    max_stock: "",
    unit: "Adet",
    cost: "0",
    supplier: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || "",
        sku: material.sku || "",
        category: material.category || "other",
        stock: material.stock?.toString() || "0",
        min_stock: material.min_stock?.toString() || "0",
        max_stock: material.max_stock?.toString() || "",
        unit: material.unit || "Adet",
        cost: material.cost?.toString() || "0",
        supplier: material.supplier || "",
        description: material.description || "",
        location: material.location || "",
      });
    }
  }, [material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("raw_materials")
        .update({
          name: formData.name,
          sku: formData.sku,
          category: formData.category as any,
          unit: formData.unit,
          supplier: formData.supplier || null,
          description: formData.description || null,
          location: formData.location || null,
          stock: parseFloat(formData.stock),
          min_stock: parseFloat(formData.min_stock),
          max_stock: formData.max_stock ? parseFloat(formData.max_stock) : null,
          cost: parseFloat(formData.cost),
        })
        .eq("id", material.id);

      if (error) throw error;

      toast.success("Hammadde başarıyla güncellendi");
      onSuccess();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hammadde Düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hammadde Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chemical">Kimyasal</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="plastic">Plastik</SelectItem>
                  <SelectItem value="electronic">Elektronik</SelectItem>
                  <SelectItem value="packaging">Ambalaj</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Birim *</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Mevcut Stok *</Label>
              <Input
                id="stock"
                type="number"
                step="0.01"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Minimum Stok *</Label>
              <Input
                id="min_stock"
                type="number"
                step="0.01"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_stock">Maksimum Stok</Label>
              <Input
                id="max_stock"
                type="number"
                step="0.01"
                value={formData.max_stock}
                onChange={(e) => setFormData({ ...formData, max_stock: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Birim Maliyet (₺) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Tedarikçi</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Depo Konumu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
