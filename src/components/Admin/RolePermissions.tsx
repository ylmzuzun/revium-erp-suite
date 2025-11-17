import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface RolePermission {
  id: string;
  role: string;
  resource: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const RESOURCES = [
  { key: "tasks", label: "Görevler" },
  { key: "users", label: "Kullanıcılar" },
  { key: "departments", label: "Departmanlar" },
  { key: "production_orders", label: "Üretim Siparişleri" },
  { key: "production_processes", label: "Üretim Süreçleri" },
  { key: "audit_logs", label: "Audit Loglar" },
  { key: "role_permissions", label: "Rol İzinleri" },
];

const ROLES = [
  { key: "admin", label: "Admin", color: "bg-red-500" },
  { key: "manager", label: "Manager", color: "bg-blue-500" },
  { key: "operator", label: "Operator", color: "bg-green-500" },
  { key: "viewer", label: "Viewer", color: "bg-gray-500" },
];

export const RolePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role", { ascending: true })
        .order("resource", { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast.error("İzinler yüklenemedi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (
    permissionId: string,
    field: "can_create" | "can_read" | "can_update" | "can_delete",
    value: boolean
  ) => {
    setUpdating(permissionId);
    try {
      const { error } = await supabase
        .from("role_permissions")
        .update({ [field]: value })
        .eq("id", permissionId);

      if (error) {
        if (error.code === "42501") {
          toast.error("Bu işlem için yetkiniz yok.");
        } else {
          toast.error(`Güncelleme hatası: ${error.message}`);
        }
        return;
      }

      toast.success("İzin güncellendi");
      fetchPermissions();
    } catch (error: any) {
      toast.error("Beklenmeyen hata: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const getPermission = (role: string, resource: string) => {
    return permissions.find((p) => p.role === role && p.resource === resource);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rol Yetkileri</h2>
        <p className="text-muted-foreground">
          Her rol için kaynak bazlı erişim yetkilerini yönetin.
        </p>
      </div>

      <div className="space-y-4">
        {ROLES.map((role) => (
          <Card key={role.key}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className={role.color}>{role.label}</Badge>
                <CardTitle className="text-lg">{role.label} Yetkileri</CardTitle>
              </div>
              <CardDescription>
                {role.label} rolüne sahip kullanıcıların erişim yetkileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RESOURCES.map((resource) => {
                  const permission = getPermission(role.key, resource.key);
                  if (!permission) return null;

                  return (
                    <div
                      key={`${role.key}-${resource.key}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Label className="text-base font-medium">
                          {resource.label}
                        </Label>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${permission.id}-create`}
                            checked={permission.can_create}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.id, "can_create", checked)
                            }
                            disabled={updating === permission.id}
                          />
                          <Label
                            htmlFor={`${permission.id}-create`}
                            className="text-sm cursor-pointer"
                          >
                            Oluştur
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${permission.id}-read`}
                            checked={permission.can_read}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.id, "can_read", checked)
                            }
                            disabled={updating === permission.id}
                          />
                          <Label
                            htmlFor={`${permission.id}-read`}
                            className="text-sm cursor-pointer"
                          >
                            Oku
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${permission.id}-update`}
                            checked={permission.can_update}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.id, "can_update", checked)
                            }
                            disabled={updating === permission.id}
                          />
                          <Label
                            htmlFor={`${permission.id}-update`}
                            className="text-sm cursor-pointer"
                          >
                            Güncelle
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${permission.id}-delete`}
                            checked={permission.can_delete}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.id, "can_delete", checked)
                            }
                            disabled={updating === permission.id}
                          />
                          <Label
                            htmlFor={`${permission.id}-delete`}
                            className="text-sm cursor-pointer"
                          >
                            Sil
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
