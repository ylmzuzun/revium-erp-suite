import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Shield, User as UserIcon, Trash2 } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  created_at: string;
  departments?: { name: string } | null;
  user_roles?: { role: string }[];
}

interface Department {
  id: string;
  name: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Kullanıcıları getir
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Her kullanıcı için rollerini ve departman bilgisini al
      const usersWithDetails = await Promise.all(
        (usersData || []).map(async (user) => {
          // Rolü al
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

          // Departmanı al
          const { data: deptData } = await supabase
            .from("departments")
            .select("name")
            .eq("id", user.department_id)
            .maybeSingle();

          return {
            ...user,
            user_roles: roleData ? [{ role: roleData.role }] : [],
            departments: deptData,
          };
        })
      );

      setUsers(usersWithDetails);

      // Departmanları getir
      const { data: depsData, error: depsError } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (depsError) throw depsError;
      setDepartments(depsData || []);
    } catch (error: any) {
      toast.error("Veriler yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      // Önce mevcut rolü kontrol et
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", selectedUser.id)
        .maybeSingle();

      if (existingRole) {
        // Mevcut rolü sil
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.id);

        if (deleteError) {
          if (deleteError.code === "42501") {
            toast.error("Bu işlem için yetkiniz yok.");
          } else {
            toast.error("Eski rol silinemedi: " + deleteError.message);
          }
          return;
        }
      }

      // Yeni rolü ekle
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: selectedUser.id, role: newRole as "admin" | "manager" | "operator" | "viewer" });

      if (error) {
        if (error.code === "42501") {
          toast.error("Bu işlem için yetkiniz yok.");
        } else {
          toast.error("Rol oluşturulamadı: " + error.message);
        }
        return;
      }

      toast.success("Kullanıcı rolü başarıyla güncellendi");
      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole("");
      fetchData();
    } catch (error: any) {
      toast.error("Beklenmeyen hata: " + error.message);
    }
  };

  const handleDepartmentChange = async (userId: string, departmentId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ department_id: departmentId === "none" ? null : departmentId })
        .eq("id", userId);

      if (error) {
        if (error.code === "42501") {
          toast.error("Bu işlem için yetkiniz yok.");
        } else {
          toast.error("Departman güncellenemedi: " + error.message);
        }
        return;
      }

      toast.success("Kullanıcı departmanı başarıyla güncellendi");
      fetchData();
    } catch (error: any) {
      toast.error("Beklenmeyen hata: " + error.message);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = (user: User) => {
    return user.user_roles?.[0]?.role || "viewer";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "operator":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Admin",
      manager: "Manager",
      operator: "Operatör",
      viewer: "Görüntüleyici",
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <span>Kullanıcılar ({users.length})</span>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        {user.phone && (
                          <div className="text-sm text-muted-foreground">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.department_id || "none"}
                      onValueChange={(value) => handleDepartmentChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Atanmamış</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(getUserRole(user))}>
                      {getRoleLabel(getUserRole(user))}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(getUserRole(user));
                        setShowRoleDialog(true);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Rol Değiştir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Kullanıcı bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı Rolü Değiştir</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.full_name} için yeni rol seçin
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="operator">Operatör</SelectItem>
                <SelectItem value="viewer">Görüntüleyici</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
