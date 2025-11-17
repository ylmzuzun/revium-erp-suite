import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY environment variable");
}

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
    const { 
      recipientEmails, 
      taskTitle, 
      taskDescription, 
      taskDueDate,
      taskPriority,
      assignerName 
    }: TaskNotificationRequest = await req.json();

    console.log("Sending task notification:", { recipientEmails, taskTitle });

    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error("No recipient emails provided");
    }

    const priorityLabels: { [key: number]: string } = {
      1: "Düşük",
      2: "Normal",
      3: "Yüksek",
      4: "Acil",
      5: "Kritik"
    };
    
    const priorityLabel = priorityLabels[taskPriority] || "Normal";
    const dueDateText = taskDueDate 
      ? `<p><strong>Bitiş Tarihi:</strong> ${new Date(taskDueDate).toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>`
      : '';

    // Her alıcıya e-posta gönder
    const emailPromises = recipientEmails.map(email => 
      resend.emails.send({
        from: "Revium ERP <onboarding@resend.dev>",
        to: [email],
        subject: `🔔 Yeni Görev Atandı: ${taskTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                            🔔 Yeni Görev Atandı
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                            <strong>${assignerName}</strong> size yeni bir görev atadı.
                          </p>
                          
                          <!-- Task Card -->
                          <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 24px; border-radius: 8px; margin: 24px 0;">
                            <h2 style="margin: 0 0 16px 0; color: #2d3748; font-size: 20px; font-weight: 600;">
                              ${taskTitle}
                            </h2>
                            ${taskDescription ? `
                              <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                ${taskDescription}
                              </p>
                            ` : ''}
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0;">
                                  <span style="display: inline-block; padding: 6px 12px; background-color: ${
                                    taskPriority >= 4 ? '#fed7d7' : 
                                    taskPriority >= 3 ? '#fef3c7' : 
                                    '#d1fae5'
                                  }; color: ${
                                    taskPriority >= 4 ? '#c53030' : 
                                    taskPriority >= 3 ? '#d97706' : 
                                    '#047857'
                                  }; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                    Öncelik: ${priorityLabel}
                                  </span>
                                </td>
                              </tr>
                              ${dueDateText ? `
                                <tr>
                                  <td style="padding: 12px 0; color: #4a5568; font-size: 15px;">
                                    ${dueDateText}
                                  </td>
                                </tr>
                              ` : ''}
                            </table>
                          </div>
                          
                          <p style="margin: 24px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                            Detayları görmek ve görevi kabul etmek için aşağıdaki butona tıklayın:
                          </p>
                          
                          <!-- CTA Button -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                            <tr>
                              <td align="center">
                                <a href="${Deno.env.get("VITE_SUPABASE_URL") || 'https://yourapp.com'}" 
                                   style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                                  Görevi Görüntüle →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px;">
                            Bu e-posta <strong>Revium ERP</strong> sistemi tarafından otomatik gönderilmiştir.
                          </p>
                          <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                            © 2025 Revium ERP. Tüm hakları saklıdır.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

    console.log(`Email results: ${successful} successful, ${failed} failed`);
    if (errors.length > 0) {
      console.error("Email errors:", errors);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successful,
        failed: failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-task-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
