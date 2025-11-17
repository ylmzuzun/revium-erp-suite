import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export const ProductRecipeDialog = ({
  open,
  onOpenChange,
  product,
}: ProductRecipeDialogProps) => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRecipes();
      fetchMaterials();
    }
  }, [open, product]);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("product_recipes")
        .select(`
          *,
          raw_materials(id, name, unit, stock, cost)
        `)
        .eq("product_id", product.id);

      if (error) throw error;
      setRecipes(data || []);
    } catch (error: any) {
      console.error("Reçete yüklenirken hata:", error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error("Hammaddeler yüklenirken hata:", error);
    }
  };

  const addMaterial = async () => {
    if (!selectedMaterial || !newQuantity) {
      toast.error("Lütfen hammadde ve miktar seçin");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("product_recipes").insert({
        product_id: product.id,
        raw_material_id: selectedMaterial,
        quantity_per_unit: parseFloat(newQuantity),
      });

      if (error) throw error;

      toast.success("Hammadde eklendi");
      fetchRecipes();
      setSelectedMaterial("");
      setNewQuantity("");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeMaterial = async (recipeId: string) => {
    if (!confirm("Bu hammaddeyi reçeteden çıkarmak istediğinizden emin misiniz?"))
      return;

    try {
      const { error } = await supabase
        .from("product_recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;

      toast.success("Hammadde çıkarıldı");
      fetchRecipes();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    }
  };

  const updateQuantity = async (recipeId: string, newQty: string) => {
    if (!newQty || parseFloat(newQty) <= 0) return;

    try {
      const { error } = await supabase
        .from("product_recipes")
        .update({ quantity_per_unit: parseFloat(newQty) })
        .eq("id", recipeId);

      if (error) throw error;

      toast.success("Miktar güncellendi");
      fetchRecipes();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    }
  };

  const calculateTotalCost = () => {
    return recipes.reduce((sum, recipe) => {
      const material = recipe.raw_materials as any;
      return sum + (material?.cost || 0) * recipe.quantity_per_unit;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name} - Reçete Yönetimi</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mevcut Reçete */}
          <div>
            <h4 className="font-medium mb-3">Hammadde Listesi</h4>
            {recipes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Henüz hammadde eklenmemiş
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hammadde</TableHead>
                      <TableHead>Miktar (Birim üretim için)</TableHead>
                      <TableHead>Mevcut Stok</TableHead>
                      <TableHead>Birim Maliyet</TableHead>
                      <TableHead>Toplam Maliyet</TableHead>
                      <TableHead className="w-[80px]">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((recipe) => {
                      const material = recipe.raw_materials as any;
                      return (
                        <TableRow key={recipe.id}>
                          <TableCell className="font-medium">
                            {material?.name || "Silinmiş"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={recipe.quantity_per_unit}
                                onChange={(e) =>
                                  updateQuantity(recipe.id, e.target.value)
                                }
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">
                                {material?.unit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {material?.stock} {material?.unit}
                          </TableCell>
                          <TableCell>₺{material?.cost || 0}</TableCell>
                          <TableCell>
                            ₺{((material?.cost || 0) * recipe.quantity_per_unit).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(recipe.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-3 pt-3 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Toplam Hammadde Maliyeti (Birim)
                    </p>
                    <p className="text-2xl font-bold">
                      ₺{calculateTotalCost().toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Yeni Hammadde Ekle */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Yeni Hammadde Ekle</h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Hammadde</Label>
                <Select
                  value={selectedMaterial}
                  onValueChange={setSelectedMaterial}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hammadde seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.stock} {m.unit} - ₺{m.cost}/{m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label>Miktar</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Miktar"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addMaterial} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ekle
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
