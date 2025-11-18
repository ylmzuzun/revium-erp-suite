import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// 🔥 Env bağımlılığı yok → sorunsuz
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

    const data: TaskNotificationRequest = await req.json();

    const { recipientEmails, taskTitle, taskDescription, taskDueDate, taskPriority, assignerName } = data;

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
      <html>
      <body>
        <h2>🔔 Yeni Görev Atandı</h2>
        <p><strong>${assignerName}</strong> size yeni bir görev atadı.</p>
        <p><strong>Görev:</strong> ${taskTitle}</p>
        <p><strong>Öncelik:</strong> ${priorityLabel}</p>
        ${taskDescription ? `<p>${taskDescription}</p>` : ""}
        ${dueDateText}
      </body>
      </html>
    `;

    const emailPromises = recipientEmails.map(async (email) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Revium ERP <noreply@mail.revpad.net>",
          to: [email],
          subject: `🔔 Yeni Görev Atandı: ${taskTitle}`,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${err}`);
      }
      return response.json();
    });

    const results = await Promise.allSettled(emailPromises);

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
