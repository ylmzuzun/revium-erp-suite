import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Clock, AlertCircle, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface AssignedUser {
  id: string;
  full_name: string;
  email: string;
  status: string | null;
  rejection_reason: string | null;
  accepted_at: string | null;
  completed_at: string | null;
}

interface TaskDetailModalProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const TaskDetailModal = ({ taskId, open, onOpenChange, onUpdate }: TaskDetailModalProps) => {
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetails();
    }
  }, [open, taskId]);

  const fetchTaskDetails = async () => {
    try {
      // Görev detaylarını al
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      // Atanan kullanıcıları al
      const { data: assignments, error: assignError } = await supabase
        .from("task_assignments")
        .select(`
          id,
          status,
          rejection_reason,
          accepted_at,
          completed_at,
          assigned_to,
          profiles:assigned_to (
            id,
            full_name,
            email
          )
        `)
        .eq("task_id", taskId);

      if (assignError) throw assignError;

      const users = assignments?.map((a: any) => ({
        id: a.profiles.id,
        full_name: a.profiles.full_name,
        email: a.profiles.email,
        status: a.status,
        rejection_reason: a.rejection_reason,
        accepted_at: a.accepted_at,
        completed_at: a.completed_at,
      })) || [];

      setAssignedUsers(users);
    } catch (error: any) {
      toast.error("Görev detayları yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus as "pending" | "in_progress" | "completed" | "cancelled" })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Görev durumu güncellendi");
      setTask({ ...task, status: newStatus });
      onUpdate?.();

      // Görev tamamlandıysa bildirim oluştur
      if (newStatus === "completed") {
        const notifications = assignedUsers.map(u => ({
          user_id: u.id,
          task_id: taskId,
          type: "task_completed",
          title: "Görev Tamamlandı",
          message: `"${task.title}" görevi tamamlandı.`,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (error: any) {
      toast.error("Durum güncellenirken hata: " + error.message);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Durum ve Öncelik */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select value={task.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Öncelik</label>
              <div className="flex items-center h-10">
                <Badge
                  variant={task.priority >= 3 ? "destructive" : "secondary"}
                  className="text-base"
                >
                  Öncelik {task.priority}
                </Badge>
              </div>
            </div>
          </div>

          {/* Açıklama */}
          {task.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {task.description}
              </p>
            </div>
          )}

          {/* Tarihler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Oluşturulma:</span>
              <span>{format(new Date(task.created_at), "dd MMM yyyy HH:mm")}</span>
            </div>
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Bitiş:</span>
                <span>{format(new Date(task.due_date), "dd MMM yyyy HH:mm")}</span>
              </div>
            )}
          </div>

          {/* Atanan Kullanıcılar */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Görevdeki Kişiler ({assignedUsers.length})
            </label>
            <div className="space-y-2">
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
                  <div className="flex-1">
                    <div className="font-medium">{assignedUser.full_name}</div>
                    <div className="text-sm text-muted-foreground">{assignedUser.email}</div>
                    {assignedUser.status === 'rejected' && assignedUser.rejection_reason && (
                      <p className="text-sm text-destructive mt-1">
                        Red nedeni: {assignedUser.rejection_reason}
                      </p>
                    )}
                  </div>
                  {assignedUser.status === 'completed' && (
                    <Badge variant="default" className="bg-success">
                      Tamamlandı
                    </Badge>
                  )}
                  {assignedUser.status === 'accepted' && (
                    <Badge variant="secondary">Kabul Edildi</Badge>
                  )}
                  {assignedUser.status === 'rejected' && (
                    <Badge variant="destructive">Reddedildi</Badge>
                  )}
                  {assignedUser.status === 'pending' && (
                    <Badge variant="outline">Bekliyor</Badge>
                  )}
                </div>
              ))}
              {assignedUsers.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Henüz kimse atanmadı
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
