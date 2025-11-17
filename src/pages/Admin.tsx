import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Settings, LayoutDashboard, FileText } from "lucide-react";
import { UserManagement } from "@/components/Admin/UserManagement";
import { DepartmentManagement } from "@/components/Admin/DepartmentManagement";
import { SystemSettings } from "@/components/Admin/SystemSettings";
import { RolePermissions } from "@/components/Admin/RolePermissions";
import { AuditLogs } from "@/components/Admin/AuditLogs";
import { AdminDashboard } from "@/components/Admin/AdminDashboard";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Paneli</h1>
          <p className="text-muted-foreground mt-1">
            Sistem yönetimi ve kullanıcı kontrolü
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Kullanıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Departmanlar</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Rol Yetkileri</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit Loglar</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <RolePermissions />
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SystemSettings />
          </TabsContent>
        </Tabs>
        </div>
      </MainLayout>
    );
  };
  
  export default Admin;
