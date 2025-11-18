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
  accepted_at: string | null;
  declined_at: string | null;
  completed_at: string | null;
  status: string | null;
  rejection_reason: string | null;
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
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      const { data: assignments, error: assignError } = await supabase
        .from("task_assignments")
        .select(`
          id,
          accepted_at,
          declined_at,
          completed_at,
          status,
          rejection_reason,
          assigned_to,
          profiles:assigned_to (
            id,
            full_name,
            email
          )
        `)
        .eq("task_id", taskId);

      if (assignError) throw assignError;

      const users =
        assignments?.map((a: any) => ({
          id: a.profiles.id,
          full_name: a.profiles.full_name,
          email: a.profiles.email,
          accepted_at: a.accepted_at,
          declined_at: a.declined_at,
          completed_at: a.completed_at,
          status: a.status,
          rejection_reason: a.rejection_reason,
        })) || [];

      setAssignedUsers(users);
    } catch (error: any) {
      toast.error("Görev detayları yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentAction = async (
    userId: string,
    action: "accept" | "decline" | "complete"
  ) => {
    try {
      const updateData: any = {};

      if (action === "accept") {
        updateData.accepted_at = new Date().toISOString();
        updateData.declined_at = null;
      }

      if (action === "decline") {
        updateData.declined_at = new Date().toISOString();
        updateData.accepted_at = null;
      }

      if (action === "complete") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("task_assignments")
        .update(updateData)
        .eq("task_id", taskId)
        .eq("assigned_to", userId);

      if (error) throw error;

      toast.success("Güncellendi");
      fetchTaskDetails();
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: newStatus as "pending" | "in_progress" | "completed" | "cancelled",
        })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Görev durumu güncellendi");
      setTask({ ...task, status: newStatus });
      onUpdate?.();
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
      .map((n) => n[0])
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

          {task.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {task.description}
              </p>
            </div>
          )}

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

          {/* Assigned Users */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Görevdeki Kişiler ({assignedUsers.length})
            </label>

            <div className="space-y-2">
              {assignedUsers.map((assignedUser) => (
                <div
                  key={assignedUser.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(assignedUser.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{assignedUser.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignedUser.email}
                      </div>

                      <div className="flex gap-2 mt-1">
                        {assignedUser.status === 'rejected' && (
                          <Badge variant="destructive">Reddedildi</Badge>
                        )}
                        {assignedUser.status === 'accepted' && !assignedUser.completed_at && (
                          <Badge variant="secondary">Kabul Edildi</Badge>
                        )}
                        {assignedUser.status === 'completed' && (
                          <Badge className="bg-success">Tamamlandı</Badge>
                        )}
                      </div>
                      
                      {assignedUser.rejection_reason && (
                        <p className="text-sm text-destructive mt-1">
                          {assignedUser.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2">
                    {!assignedUser.accepted_at &&
                      !assignedUser.declined_at && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAssignmentAction(assignedUser.id, "accept")
                            }
                          >
                            Kabul Et
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleAssignmentAction(assignedUser.id, "decline")
                            }
                          >
                            Reddet
                          </Button>
                        </>
                      )}

                    {assignedUser.accepted_at &&
                      !assignedUser.completed_at && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            handleAssignmentAction(assignedUser.id, "complete")
                          }
                        >
                          Tamamladım
                        </Button>
                      )}
                  </div>
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
