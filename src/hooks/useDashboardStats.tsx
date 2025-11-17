import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  customers: {
    total: number;
    trend: number;
  };
  orders: {
    total: number;
    active: number;
    trend: number;
  };
  products: {
    total_stock: number;
    low_stock_count: number;
    trend: number;
  };
  revenue: {
    current_month: number;
    trend: number;
  };
  recent_orders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    order_date: string;
  }>;
  low_stock_products: Array<{
    id: string;
    name: string;
    stock: number;
    min_stock: number;
  }>;
}

const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getStartOfMonth = (monthsAgo: number = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const getEndOfMonth = (monthsAgo: number = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const startOfThisMonth = getStartOfMonth(0);
      const startOfLastMonth = getStartOfMonth(1);
      const endOfLastMonth = getEndOfMonth(1);

      // 1. Müşteri istatistikleri
      const { count: totalCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      
      const { count: lastMonthCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .lt("created_at", startOfThisMonth);
      
      const customerTrend = calculateTrend(totalCustomers || 0, lastMonthCustomers || 0);

      // 2. Sipariş istatistikleri
      const { data: ordersThisMonth } = await supabase
        .from("orders")
        .select("id, status")
        .gte("order_date", startOfThisMonth);
      
      const { data: ordersLastMonth } = await supabase
        .from("orders")
        .select("id")
        .gte("order_date", startOfLastMonth)
        .lt("order_date", startOfThisMonth);
      
      const activeOrders = (ordersThisMonth || []).filter(o => 
        ["pending", "confirmed", "in_progress"].includes(o.status)
      ).length;
      
      const orderTrend = calculateTrend(
        ordersThisMonth?.length || 0, 
        ordersLastMonth?.length || 0
      );

      // 3. Ürün stok istatistikleri
      const { data: products } = await supabase
        .from("products")
        .select("stock, min_stock");
      
      const totalStock = (products || []).reduce((sum, p) => sum + (p.stock || 0), 0);
      const lowStockCount = (products || []).filter(p => p.stock < (p.min_stock || 0)).length;

      // 4. Ciro istatistikleri
      const { data: revenueThisMonth } = await supabase
        .from("orders")
        .select("total")
        .gte("order_date", startOfThisMonth);
      
      const { data: revenueLastMonth } = await supabase
        .from("orders")
        .select("total")
        .gte("order_date", startOfLastMonth)
        .lt("order_date", startOfThisMonth);
      
      const currentRevenue = (revenueThisMonth || []).reduce((sum, o) => sum + (o.total || 0), 0);
      const lastRevenue = (revenueLastMonth || []).reduce((sum, o) => sum + (o.total || 0), 0);
      const revenueTrend = calculateTrend(currentRevenue, lastRevenue);

      // 5. Son siparişler
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          order_date,
          total,
          customers(name)
        `)
        .order("order_date", { ascending: false })
        .limit(5);

      // 6. Düşük stoklu ürünler
      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("id, name, stock, min_stock")
        .order("stock", { ascending: true })
        .limit(5);
      
      const filteredLowStock = (lowStockProducts || []).filter(p => p.stock < (p.min_stock || 0));

      return {
        customers: {
          total: totalCustomers || 0,
          trend: customerTrend,
        },
        orders: {
          total: ordersThisMonth?.length || 0,
          active: activeOrders,
          trend: orderTrend,
        },
        products: {
          total_stock: totalStock,
          low_stock_count: lowStockCount,
          trend: 0,
        },
        revenue: {
          current_month: currentRevenue,
          trend: revenueTrend,
        },
        recent_orders: (recentOrders || []).map(o => ({
          id: o.id,
          order_number: o.order_number,
          customer_name: (o.customers as any)?.name || "Bilinmeyen",
          total: o.total || 0,
          order_date: o.order_date || "",
        })),
        low_stock_products: filteredLowStock.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          min_stock: p.min_stock || 0,
        })),
      } as DashboardStats;
    },
    refetchInterval: 60000,
  });
};
