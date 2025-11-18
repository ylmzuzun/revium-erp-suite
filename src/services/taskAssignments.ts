// src/services/taskAssignments.ts
import { supabase } from "@/integrations/supabase/client";

export type TaskAssignmentStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed";

interface UpdateAssignmentStatusParams {
  taskId: string;
  status: TaskAssignmentStatus;
  notes?: string;
}

/**
 * Oturumdaki kullanıcının, verilen task için kendi assignment kaydını günceller.
 */
export async function updateMyTaskAssignmentStatus(
  params: UpdateAssignmentStatusParams
) {
  const { taskId, status, notes } = params;

  // Auth kontrolü
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Auth error:", userError);
    throw new Error("Oturum bilgisi alınamadı.");
  }

  if (!user) {
    throw new Error("Oturum bulunamadı.");
  }

  // Sadece oturumdaki kullanıcıya ait assignment güncelleniyor
  const { error } = await supabase
    .from("task_assignments")
    .update({
      status,
      notes: notes ?? null,
    })
    .eq("task_id", taskId)
    .eq("assigned_to", user.id);

  if (error) {
    console.error("updateMyTaskAssignmentStatus error:", error);
    throw new Error(error.message);
  }
}
