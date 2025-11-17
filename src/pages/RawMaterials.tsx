import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CreateRawMaterialDialog } from "@/components/RawMaterials/CreateRawMaterialDialog";
import { EditRawMaterialDialog } from "@/components/RawMaterials/EditRawMaterialDialog";
import { RawMaterialDetailModal } from "@/components/RawMaterials/RawMaterialDetailModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RawMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("raw_materials")
        .select("*")
        .order("name");

      const { data, error } = await query;
      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
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

  const filteredMaterials = materials.filter(m => {
    if (showLowStock && m.stock >= m.min_stock) return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hammadde Yönetimi</h1>
            <p className="text-muted-foreground mt-1">Hammadde stoklarını yönetin</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hammadde
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara (isim, SKU)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  <SelectItem value="chemical">Kimyasal</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="plastic">Plastik</SelectItem>
                  <SelectItem value="electronic">Elektronik</SelectItem>
                  <SelectItem value="packaging">Ambalaj</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showLowStock ? "default" : "outline"}
                onClick={() => setShowLowStock(!showLowStock)}
                className="w-full"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {showLowStock ? "Tüm Stoğu Göster" : "Sadece Düşük Stok"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center py-8 text-muted-foreground">Yükleniyor...</p>
          ) : filteredMaterials.length === 0 ? (
            <p className="col-span-full text-center py-8 text-muted-foreground">Hammadde bulunamadı</p>
          ) : (
            filteredMaterials.map((material) => {
              const stockStatus = getStockStatus(material.stock, material.min_stock);
              return (
                <Card
                  key={material.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedMaterial(material);
                    setDetailModalOpen(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{material.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{material.sku}</p>
                        </div>
                      </div>
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kategori:</span>
                        <span className="font-medium">{getCategoryLabel(material.category)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stok:</span>
                        <span className="font-medium">
                          {material.stock} {material.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min. Stok:</span>
                        <span className="font-medium">
                          {material.min_stock} {material.unit}
                        </span>
                      </div>
                      {material.supplier && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tedarikçi:</span>
                          <span className="font-medium">{material.supplier}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <CreateRawMaterialDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchMaterials}
        />

        {selectedMaterial && (
          <>
            <EditRawMaterialDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              material={selectedMaterial}
              onSuccess={() => {
                fetchMaterials();
                setEditDialogOpen(false);
              }}
            />
            <RawMaterialDetailModal
              open={detailModalOpen}
              onOpenChange={setDetailModalOpen}
              material={selectedMaterial}
              onEdit={() => {
                setDetailModalOpen(false);
                setEditDialogOpen(true);
              }}
              onDelete={() => {
                fetchMaterials();
                setDetailModalOpen(false);
              }}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default RawMaterials;
