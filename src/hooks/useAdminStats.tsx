import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  production_orders: {
    total: number;
    active: number;
    planned: number;
    in_production: number;
    quality_check: number;
    completed: number;
    on_hold: number;
  };
  users: number;
  departments: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Fetch tasks stats
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("status");
      
      if (tasksError) throw tasksError;

      const taskStats = {
        total: tasksData.length,
        pending: tasksData.filter(t => t.status === "pending").length,
        in_progress: tasksData.filter(t => t.status === "in_progress").length,
        completed: tasksData.filter(t => t.status === "completed").length,
        cancelled: tasksData.filter(t => t.status === "cancelled").length,
      };

      // Fetch production orders stats
      const { data: ordersData, error: ordersError } = await supabase
        .from("production_orders")
        .select("status");
      
      if (ordersError) throw ordersError;

      const orderStats = {
        total: ordersData.length,
        active: ordersData.filter(o => 
          o.status === "planned" || o.status === "in_production"
        ).length,
        planned: ordersData.filter(o => o.status === "planned").length,
        in_production: ordersData.filter(o => o.status === "in_production").length,
        quality_check: ordersData.filter(o => o.status === "quality_check").length,
        completed: ordersData.filter(o => o.status === "completed").length,
        on_hold: ordersData.filter(o => o.status === "on_hold").length,
      };

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      if (usersError) throw usersError;

      // Fetch departments count
      const { count: deptCount, error: deptError } = await supabase
        .from("departments")
        .select("*", { count: "exact", head: true });
      
      if (deptError) throw deptError;

      return {
        tasks: taskStats,
        production_orders: orderStats,
        users: usersCount || 0,
        departments: deptCount || 0,
      } as AdminStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
