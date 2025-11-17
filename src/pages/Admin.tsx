import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Settings } from "lucide-react";
import { UserManagement } from "@/components/Admin/UserManagement";
import { DepartmentManagement } from "@/components/Admin/DepartmentManagement";
import { SystemSettings } from "@/components/Admin/SystemSettings";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");

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
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Kullanıcı Yönetimi</span>
              <span className="sm:hidden">Kullanıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Departman Yönetimi</span>
              <span className="sm:hidden">Departmanlar</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sistem Ayarları</span>
              <span className="sm:hidden">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <DepartmentManagement />
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
