import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface AssignedUser {
  id: string;
  full_name: string;
  email: string;
  accepted_at: string | null;
  completed_at: string | null;
}

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTaskDetails();
    }
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      const { data: assignments, error: assignError } = await supabase
        .from("task_assignments")
        .select(`
          id,
          accepted_at,
          completed_at,
          assigned_to,
          profiles:assigned_to (
            id,
            full_name,
            email
          )
        `)
        .eq("task_id", id);

      if (assignError) throw assignError;

      const users = assignments?.map((a: any) => ({
        id: a.profiles.id,
        full_name: a.profiles.full_name,
        email: a.profiles.email,
        accepted_at: a.accepted_at,
        completed_at: a.completed_at,
      })) || [];

      setAssignedUsers(users);
    } catch (error: any) {
      toast.error("Görev detayları yüklenirken hata: " + error.message);
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case "in_progress":
        return <Clock className="h-6 w-6 text-warning" />;
      default:
        return <AlertCircle className="h-6 w-6 text-muted-foreground" />;
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  if (!task) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Görev Detayı</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                  </div>
                  <Badge variant={task.priority >= 3 ? "destructive" : "secondary"}>
                    Öncelik {task.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Durum</h3>
                  <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
                </div>

                {task.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Açıklama</h3>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Oluşturulma Tarihi
                    </h3>
                    <p className="text-muted-foreground">
                      {format(new Date(task.created_at), "dd MMMM yyyy HH:mm")}
                    </p>
                  </div>
                  {task.due_date && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Bitiş Tarihi
                      </h3>
                      <p className="text-muted-foreground">
                        {format(new Date(task.due_date), "dd MMMM yyyy HH:mm")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Görevdeki Kişiler ({assignedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignedUsers.map((assignedUser) => (
                    <div
                      key={assignedUser.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(assignedUser.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{assignedUser.full_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {assignedUser.email}
                        </div>
                        <div className="mt-1">
                          {assignedUser.completed_at && (
                            <Badge variant="default" className="bg-success text-xs">
                              Tamamlandı
                            </Badge>
                          )}
                          {assignedUser.accepted_at && !assignedUser.completed_at && (
                            <Badge variant="secondary" className="text-xs">
                              Kabul Edildi
                            </Badge>
                          )}
                          {!assignedUser.accepted_at && (
                            <Badge variant="outline" className="text-xs">
                              Bekliyor
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {assignedUsers.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground text-sm">
                      Henüz kimse atanmadı
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TaskDetail;
