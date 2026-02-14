import nodemailer from "nodemailer";

/**
 * Email service for sending transactional emails.
 * Uses SMTP configuration from environment variables.
 * Falls back to console logging if SMTP is not configured.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "القاسم العقارية";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@alqasem.com";

  if (!transporter) {
    // Log the email for development/testing when SMTP is not configured
    console.log("[Email] SMTP not configured. Email would be sent:");
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body: ${options.text || "(HTML only)"}`);
    // Still return true so the flow continues (token is generated)
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

/**
 * Send a password reset email with a reset link.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  origin: string,
  userName?: string
): Promise<boolean> {
  const resetUrl = `${origin}/admin/reset-password?token=${resetToken}`;
  const displayName = userName || "المستخدم";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f0e8; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { width: 64px; height: 64px; background: linear-gradient(135deg, #c8a45e 0%, #d4b36e 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .logo svg { width: 32px; height: 32px; fill: #0f1b33; }
    h1 { color: #0f1b33; font-size: 24px; margin: 0 0 8px; }
    .subtitle { color: #6b7280; font-size: 14px; }
    .content { color: #374151; line-height: 1.8; font-size: 15px; }
    .btn { display: inline-block; background: #c8a45e; color: #0f1b33 !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; margin: 24px 0; }
    .btn:hover { background: #d4b36e; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 24px; }
    .footer { text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px; }
    .url-fallback { word-break: break-all; font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; margin-top: 16px; direction: ltr; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>إعادة تعيين كلمة المرور</h1>
        <p class="subtitle">القاسم العقارية - لوحة التحكم</p>
      </div>
      <div class="content">
        <p>مرحباً ${displayName}،</p>
        <p>تم طلب إعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
        </div>
        <div class="url-fallback">
          إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br>
          ${resetUrl}
        </div>
        <div class="warning">
          ⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.
        </div>
      </div>
    </div>
    <div class="footer">
      <p>شركة القاسم العقارية &copy; ${new Date().getFullYear()}</p>
      <p>هذه رسالة تلقائية، يرجى عدم الرد عليها.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
مرحباً ${displayName}،

تم طلب إعادة تعيين كلمة المرور لحسابك في لوحة تحكم القاسم العقارية.

لإعادة تعيين كلمة المرور، افتح هذا الرابط:
${resetUrl}

هذا الرابط صالح لمدة ساعة واحدة فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.

شركة القاسم العقارية
  `.trim();

  return sendEmail({
    to: email,
    subject: "إعادة تعيين كلمة المرور - القاسم العقارية",
    html,
    text,
  });
}
