import { StatCard } from "@/components/Dashboard/StatCard";
import { useAdminStats } from "@/hooks/useAdminStats";
import { RecentActivitiesTable } from "./RecentActivitiesTable";
import { DepartmentStatsTable } from "./DepartmentStatsTable";
import { TaskStatusPieChart } from "./TaskStatusPieChart";
import { ProductionStatusBarChart } from "./ProductionStatusBarChart";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Package, Users, Building2 } from "lucide-react";

export const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Ana İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Görevler"
          value={stats.tasks.total}
          icon={CheckSquare}
          trend={{
            value: `${stats.tasks.in_progress} devam ediyor`,
            positive: true,
          }}
          variant="primary"
        />
        <StatCard
          title="Aktif Üretim"
          value={stats.production_orders.active}
          icon={Package}
          trend={{
            value: `${stats.production_orders.total} toplam`,
            positive: true,
          }}
          variant="warning"
        />
        <StatCard
          title="Kullanıcılar"
          value={stats.users}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Departmanlar"
          value={stats.departments}
          icon={Building2}
          variant="default"
        />
      </div>

      {/* Grafikler */}
      <div className="grid gap-4 md:grid-cols-2">
        <TaskStatusPieChart
          data={{
            pending: stats.tasks.pending,
            in_progress: stats.tasks.in_progress,
            completed: stats.tasks.completed,
            cancelled: stats.tasks.cancelled,
          }}
        />
        <ProductionStatusBarChart
          data={{
            planned: stats.production_orders.planned,
            in_production: stats.production_orders.in_production,
            quality_check: stats.production_orders.quality_check,
            completed: stats.production_orders.completed,
            on_hold: stats.production_orders.on_hold,
          }}
        />
      </div>

      {/* Alt Bölüm: Aktiviteler ve Departman Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivitiesTable />
        <DepartmentStatsTable />
      </div>
    </div>
  );
};
