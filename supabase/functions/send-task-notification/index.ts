import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// İstersen şimdilik sabit kalsın, sonra secret'a geçiririz
const RESEND_API_KEY = "re_3BomGFXo_2iU1pozgiakT8RAfrpvZmn4b";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskNotificationRequest {
  recipientEmails: string[];
  taskTitle: string;
  taskDescription?: string;
  taskDueDate?: string;
  taskPriority: number;
  assignerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY missing");
    }

    const {
      recipientEmails,
      taskTitle,
      taskDescription,
      taskDueDate,
      taskPriority,
      assignerName,
    }: TaskNotificationRequest = await req.json();

    console.log("Task mail payload:", {
      recipientEmails,
      taskTitle,
      taskPriority,
      taskDueDate,
      assignerName,
    });

    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error("No recipient emails provided");
    }

    const priorityLabels: { [key: number]: string } = {
      1: "Düşük",
      2: "Normal",
      3: "Yüksek",
      4: "Acil",
      5: "Kritik",
    };

    const priorityLabel = priorityLabels[taskPriority] || "Normal";

    const dueDateText = taskDueDate
      ? `<p><strong>Bitiş Tarihi:</strong> ${new Date(taskDueDate).toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</p>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h2>🔔 Yeni Görev Atandı</h2>
          <p><strong>${assignerName}</strong> size yeni bir görev atadı.</p>
          <p><strong>Görev:</strong> ${taskTitle}</p>
          <p><strong>Öncelik:</strong> ${priorityLabel}</p>
          ${taskDescription ? `<p>${taskDescription}</p>` : ""}
          ${dueDateText}
          <p>Görevinizi görüntülemek için Revium ERP sistemine giriş yapın.</p>
        </body>
      </html>
    `;

    // 🔑 BURASI KRİTİK: verified domain ile gönderiyoruz
    const FROM_ADDRESS = "Revium ERP <noreply@tasks.revpad.net>";

    const emailPromises = recipientEmails.map(async (email) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [email],
          subject: `🔔 Yeni Görev Atandı: ${taskTitle}`,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Resend error for", email, err);
        throw new Error(`Resend API error: ${response.status} - ${err}`);
      }

      return response.json();
    });

    const results = await Promise.allSettled(emailPromises);

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log("Email send result:", { sent, failed });

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (err: any) {
    console.error("send-task-notification error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
