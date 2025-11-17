import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        setIsAdmin(!!data);
      } catch (error: any) {
        console.error("Admin kontrolü hatası:", error);
        setIsAdmin(false);
        toast.error("Yetki kontrolü yapılamadı");
      } finally {
        setChecking(false);
      }
    };

    checkAdminRole();
  }, [user]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin === false) {
    toast.error("Bu sayfaya erişim yetkiniz yok");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
