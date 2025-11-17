import { useEffect, useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Clock, AlertCircle, Users, Search } from "lucide-react";
import { CreateTaskDialog } from "@/components/Tasks/CreateTaskDialog";
import { TaskDetailModal } from "@/components/Tasks/TaskDetailModal";

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

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

const Tasks = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<(Task & { assignment: TaskAssignment; assignedUsers?: Profile[] })[]>([]);
  const [createdTasks, setCreatedTasks] = useState<(Task & { assignedUsers?: Profile[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");

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

      const assignedTasksWithUsers = await Promise.all(
        (assignments || []).map(async (a: any) => {
          const { data: taskAssignments } = await supabase
            .from("task_assignments")
            .select("assigned_to, profiles:assigned_to(id, full_name, email)")
            .eq("task_id", a.tasks.id);

          const assignedUsers = taskAssignments?.map((ta: any) => ta.profiles) || [];

          return {
            ...a.tasks,
            assignment: {
              id: a.id,
              task_id: a.task_id,
              assigned_to: a.assigned_to,
              assigned_at: a.assigned_at,
              accepted_at: a.accepted_at,
              completed_at: a.completed_at,
            },
            assignedUsers,
          };
        })
      );

      setMyTasks(assignedTasksWithUsers);

      // Benim oluşturduğum görevler
      const { data: created, error: createdError } = await supabase
        .from("tasks")
        .select("*")
        .eq("created_by", user?.id);

      if (createdError) throw createdError;

      const createdTasksWithUsers = await Promise.all(
        (created || []).map(async (task) => {
          const { data: taskAssignments } = await supabase
            .from("task_assignments")
            .select("assigned_to, profiles:assigned_to(id, full_name, email)")
            .eq("task_id", task.id);

          const assignedUsers = taskAssignments?.map((ta: any) => ta.profiles) || [];

          return { ...task, assignedUsers };
        })
      );

      setCreatedTasks(createdTasksWithUsers);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filterTasks = (tasks: any[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const sortTasks = (tasks: any[]) => {
    return [...tasks].sort((a, b) => {
      if (sortBy === "priority") {
        return b.priority - a.priority;
      }
      if (sortBy === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const filteredAndSortedMyTasks = sortTasks(filterTasks(myTasks));
  const filteredAndSortedCreatedTasks = sortTasks(filterTasks(createdTasks));

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
          <CreateTaskDialog onTaskCreated={fetchTasks} />
        </div>

        {/* Filtreler ve Arama */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Görev ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Tarihe Göre</SelectItem>
                  <SelectItem value="priority">Önceliğe Göre</SelectItem>
                  <SelectItem value="due_date">Bitiş Tarihine Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bana Atanan Görevler ({myTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAndSortedMyTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">{getStatusLabel(task.status)}</Badge>
                          <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                            Öncelik: {task.priority}
                          </span>
                          {task.assignedUsers && task.assignedUsers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <div className="flex -space-x-2">
                                {task.assignedUsers.slice(0, 3).map((user) => (
                                  <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(user.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              {task.assignedUsers.length > 3 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  +{task.assignedUsers.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAndSortedMyTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" ? "Görev bulunamadı" : "Henüz size atanmış görev yok"}
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
                {filteredAndSortedCreatedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">{getStatusLabel(task.status)}</Badge>
                          {task.assignedUsers && task.assignedUsers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <div className="flex -space-x-2">
                                {task.assignedUsers.slice(0, 3).map((user) => (
                                  <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(user.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              {task.assignedUsers.length > 3 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  +{task.assignedUsers.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAndSortedCreatedTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" ? "Görev bulunamadı" : "Henüz görev oluşturmadınız"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Detail Modal */}
        {selectedTaskId && (
          <TaskDetailModal
            taskId={selectedTaskId}
            open={!!selectedTaskId}
            onOpenChange={(open) => !open && setSelectedTaskId(null)}
            onUpdate={fetchTasks}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Tasks;
