import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, Users, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
  _count?: { profiles: number };
}

export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select(`
          *,
          profiles:manager_id (full_name)
        `)
        .order("name");

      if (error) throw error;

      // Her departman için kullanıcı sayısını al
      const depsWithCounts = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("department_id", dept.id);

          return { ...dept, _count: { profiles: count || 0 } };
        })
      );

      setDepartments(depsWithCounts);
    } catch (error: any) {
      toast.error("Departmanlar yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingDept) {
        // Güncelle
        const { error } = await supabase
          .from("departments")
          .update({
            name: formData.name,
            description: formData.description || null,
          })
          .eq("id", editingDept.id);

        if (error) throw error;
        toast.success("Departman güncellendi");
      } else {
        // Yeni oluştur
        const { error } = await supabase
          .from("departments")
          .insert({
            name: formData.name,
            description: formData.description || null,
          });

        if (error) throw error;
        toast.success("Departman oluşturuldu");
      }

      setOpen(false);
      setEditingDept(null);
      setFormData({ name: "", description: "" });
      fetchDepartments();
    } catch (error: any) {
      toast.error("İşlem sırasında hata: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) {
        // Foreign key hatası kontrolü
        if (error.code === "23503") {
          toast.error("Bu departmanda kayıtlı kullanıcılar var. Önce kullanıcıları başka departmana aktarın.");
        } else if (error.code === "42501") {
          toast.error("Bu işlem için yetkiniz yok.");
        } else {
          toast.error(`Silme hatası: ${error.message}`);
        }
        return;
      }

      toast.success("Departman başarıyla silindi");
      fetchDepartments();
    } catch (error: any) {
      toast.error("Beklenmeyen hata: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ name: "", description: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Departmanlar ({departments.length})</span>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Departman
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDept ? "Departman Düzenle" : "Yeni Departman"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Departman Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Örn: Üretim"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Departman açıklaması"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit">
                      {editingDept ? "Güncelle" : "Oluştur"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departman</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Kullanıcı Sayısı</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dept.description || "-"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{dept._count?.profiles || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.profiles?.full_name || "Atanmamış"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(dept)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === dept.id}
                          >
                            {deletingId === dept.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Departmanı Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{dept.name}" departmanını silmek üzeresiniz. Bu işlem geri alınamaz.
                              {dept._count?.profiles && dept._count.profiles > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                  Uyarı: Bu departmanda {dept._count.profiles} kullanıcı kayıtlı!
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(dept.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Henüz departman eklenmemiş
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};
