import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { UserMultiSelect } from "./UserMultiSelect";

interface CreateTaskDialogProps {
  onTaskCreated?: () => void;
}

export const CreateTaskDialog = ({ onTaskCreated }: CreateTaskDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "2",
    due_date: "",
    status: "pending",
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setLoading(true);
    try {
      // Session kontrolü ve yenileme
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      // Session'dan direkt user ID al
      const currentUserId = session.user.id;
      const currentUserEmail = session.user.email || "Sistem";

      // Görevi oluştur (trigger created_by'ı auth.uid() ile override edecek)
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: formData.title,
          description: formData.description || null,
          priority: parseInt(formData.priority),
          due_date: formData.due_date || null,
          status: formData.status as "pending" | "in_progress" | "completed" | "cancelled",
          created_by: currentUserId, // Trigger ensures this matches auth.uid()
        })
        .select()
        .single();

      if (taskError) {
        console.error("Task insert error:", taskError);
        throw new Error(taskError.message);
      }

      // Seçilen kullanıcılara görev ata
      if (selectedUsers.length > 0 && task) {
        const assignments = selectedUsers.map(userId => ({
          task_id: task.id,
          assigned_to: userId,
          assigned_by: currentUserId,
        }));

        const { error: assignError } = await supabase
          .from("task_assignments")
          .insert(assignments);

        if (assignError) throw assignError;

        // Her atanan kullanıcıya bildirim oluştur
        const notifications = selectedUsers.map(userId => ({
          user_id: userId,
          task_id: task.id,
          type: "task_assigned",
          title: "Yeni Görev Atandı",
          message: `"${task.title}" görevi size atandı.`,
        }));

        await supabase.from("notifications").insert(notifications);

        // E-posta gönderimi (eğer toggle açıksa)
        if (sendEmail) {
          try {
            // Atanan kullanıcıların email adreslerini al
            const { data: assignedProfiles } = await supabase
              .from("profiles")
              .select("email")
              .in("id", selectedUsers);

            if (assignedProfiles && assignedProfiles.length > 0) {
              console.log("Sending emails to:", assignedProfiles.map(p => p.email));
              
              // Edge function çağır
              const { error: emailError } = await supabase.functions.invoke(
                "send-task-notification",
                {
                  body: {
                    recipientEmails: assignedProfiles.map(p => p.email),
                    taskTitle: task.title,
                    taskDescription: task.description,
                    taskDueDate: task.due_date,
                    taskPriority: task.priority,
                    assignerName: currentUserEmail,
                  },
                }
              );

              if (emailError) {
                console.error("Email sending failed:", emailError);
                toast.warning("Görev oluşturuldu ancak e-posta gönderilemedi.");
              } else {
                console.log("Emails sent successfully");
              }
            }
          } catch (emailError: any) {
            console.error("Email error:", emailError);
            // E-posta hatası görev oluşturmayı engellemez
          }
        }
      }

      toast.success("Görev başarıyla oluşturuldu!");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "2",
        due_date: "",
        status: "pending",
      });
      setSelectedUsers([]);
      setSendEmail(true);
      onTaskCreated?.();
    } catch (error: any) {
      console.error("Full error:", error);
      toast.error("Görev oluşturulurken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Görev
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Görev Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Görev Başlığı *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Görev başlığı girin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Görev detayları"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Düşük (1)</SelectItem>
                  <SelectItem value="2">Normal (2)</SelectItem>
                  <SelectItem value="3">Yüksek (3)</SelectItem>
                  <SelectItem value="4">Acil (4)</SelectItem>
                  <SelectItem value="5">Kritik (5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Bitiş Tarihi</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Kullanıcı Ata</Label>
            <UserMultiSelect
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="send-email" className="text-base font-medium cursor-pointer">
                E-posta Bildirimi Gönder
              </Label>
              <p className="text-sm text-muted-foreground">
                Atanan kullanıcılara e-posta ile bildirim gönderilsin mi?
              </p>
            </div>
            <Switch
              id="send-email"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Görev Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
