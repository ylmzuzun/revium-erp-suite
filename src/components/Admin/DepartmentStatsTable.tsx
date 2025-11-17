import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentStat {
  id: string;
  name: string;
  process_count: number;
  active_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

export const DepartmentStatsTable = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["department-stats"],
    queryFn: async () => {
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select("id, name");

      if (deptError) throw deptError;

      const statsPromises = departments.map(async (dept) => {
        const { data: processes } = await supabase
          .from("production_processes")
          .select("id")
          .eq("assigned_department", dept.id);

        const processIds = processes?.map((p) => p.id) || [];

        let activeTasks = 0;
        let completedTasks = 0;

        if (processIds.length > 0) {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("status")
            .in("production_process_id", processIds);

          if (tasks) {
            activeTasks = tasks.filter((t) => t.status !== "completed").length;
            completedTasks = tasks.filter((t) => t.status === "completed").length;
          }
        }

        const total = activeTasks + completedTasks;
        const completionRate = total > 0 ? (completedTasks / total) * 100 : 0;

        return {
          id: dept.id,
          name: dept.name,
          process_count: processes?.length || 0,
          active_tasks: activeTasks,
          completed_tasks: completedTasks,
          completion_rate: completionRate,
        } as DepartmentStat;
      });

      return await Promise.all(statsPromises);
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Departman İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departman İstatistikleri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats && stats.length > 0 ? (
            stats.map((stat) => (
              <div
                key={stat.id}
                className="p-4 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{stat.name}</h4>
                  <span className="text-sm text-muted-foreground">
                    {stat.completion_rate.toFixed(0)}%
                  </span>
                </div>
                <Progress value={stat.completion_rate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Süreç: {stat.process_count}</span>
                  <span>Aktif: {stat.active_tasks}</span>
                  <span>Tamamlanan: {stat.completed_tasks}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Henüz departman bulunmuyor
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
