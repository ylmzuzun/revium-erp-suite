import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  due_date: string | null;
  created_at: string;
}

interface TaskAssignment {
  id: string;
  task_id: string;
  assigned_to: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

const Tasks = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<(Task & { assignment: TaskAssignment })[]>([]);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      // Bana atanan görevler
      const { data: assignments, error: assignError } = await supabase
        .from("task_assignments")
        .select("*, tasks(*)")
        .eq("assigned_to", user?.id);

      if (assignError) throw assignError;

      const assignedTasks = assignments?.map((a: any) => ({
        ...a.tasks,
        assignment: {
          id: a.id,
          task_id: a.task_id,
          assigned_to: a.assigned_to,
          assigned_at: a.assigned_at,
          accepted_at: a.accepted_at,
          completed_at: a.completed_at,
        }
      })) || [];

      setMyTasks(assignedTasks);

      // Benim oluşturduğum görevler
      const { data: created, error: createdError } = await supabase
        .from("tasks")
        .select("*")
        .eq("created_by", user?.id);

      if (createdError) throw createdError;
      setCreatedTasks(created || []);
    } catch (error: any) {
      toast.error("Görevler yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Beklemede",
      in_progress: "Devam Ediyor",
      completed: "Tamamlandı",
      cancelled: "İptal",
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return "text-destructive";
    if (priority === 2) return "text-warning";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Görevler</h1>
            <p className="text-muted-foreground mt-1">Görev takibi ve yönetimi</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Görev
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bana Atanan Görevler ({myTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{getStatusLabel(task.status)}</Badge>
                          <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                            Öncelik: {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {myTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Henüz size atanmış görev yok
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oluşturduğum Görevler ({createdTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {createdTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{getStatusLabel(task.status)}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {createdTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Henüz görev oluşturmadınız
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Tasks;
