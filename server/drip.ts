import { getDb } from "./db";
import { sendEmail } from "./email";
import { dripEmails, financingRequests, settings } from "../drizzle/schema";
import { eq, and, lte, sql } from "drizzle-orm";

/**
 * Schedule drip emails for a new financing request.
 * Reads drip config from settings and creates pending email records.
 */
export async function scheduleDripEmails(financingRequestId: number, customerEmail: string, customerName: string, requestData: {
  requestNumber: string;
  propertyPrice: number;
  loanAmount: number;
  monthlyPayment: number;
  rate: string;
  termYears: number;
}) {
  const db = await getDb();
  if (!db) return;

  // Fetch drip settings
  const allSettings = await db.select().from(settings).where(eq(settings.groupName, "drip"));
  const cfg: Record<string, string> = {};
  for (const s of allSettings) {
    cfg[s.key] = s.value || "";
  }

  if (cfg.drip_enabled !== "true") return;
  if (!customerEmail) return;

  const now = new Date();
  const emailsToCreate: Array<{
    financingRequestId: number;
    emailType: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    scheduledAt: Date;
  }> = [];

  const replacePlaceholders = (template: string) => {
    return template
      .replace(/\{name\}/g, customerName)
      .replace(/\{ref\}/g, requestData.requestNumber)
      .replace(/\{price\}/g, requestData.propertyPrice.toLocaleString())
      .replace(/\{loan\}/g, requestData.loanAmount.toLocaleString())
      .replace(/\{monthly\}/g, requestData.monthlyPayment.toLocaleString())
      .replace(/\{rate\}/g, requestData.rate)
      .replace(/\{term\}/g, String(requestData.termYears));
  };

  for (const day of ["day1", "day3", "day7"]) {
    const enabled = cfg[`drip_${day}_enabled`];
    if (enabled !== "true") continue;

    const delayHours = parseInt(cfg[`drip_${day}_delay_hours`] || "24");
    const subjectAr = cfg[`drip_${day}_subject_ar`] || "";
    const subjectEn = cfg[`drip_${day}_subject_en`] || "";
    const bodyAr = cfg[`drip_${day}_body_ar`] || "";
    const bodyEn = cfg[`drip_${day}_body_en`] || "";

    const scheduledAt = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

    const subject = replacePlaceholders(`${subjectAr}\n${subjectEn}`);
    const body = replacePlaceholders(`${bodyAr}\n\n---\n\n${bodyEn}`);

    emailsToCreate.push({
      financingRequestId,
      emailType: day,
      recipientEmail: customerEmail,
      recipientName: customerName,
      subject,
      body,
      scheduledAt,
    });
  }

  if (emailsToCreate.length > 0) {
    await db.insert(dripEmails).values(emailsToCreate);
  }

  return emailsToCreate.length;
}

/**
 * Process pending drip emails that are due.
 * Called periodically by the server (every 5 minutes).
 */
export async function processPendingDripEmails() {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const now = new Date();
  const pendingEmails = await db.select()
    .from(dripEmails)
    .where(
      and(
        eq(dripEmails.status, "pending"),
        lte(dripEmails.scheduledAt, now)
      )
    )
    .limit(10);

  let sent = 0;
  let failed = 0;

  for (const email of pendingEmails) {
    try {
      const htmlBody = (email.body || "").replace(/\n/g, "<br>");
      const success = await sendEmail({
        to: email.recipientEmail,
        subject: email.subject || "Al-Qasim Real Estate",
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0f1b33, #1a2d52); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="color: #c9a96e; margin: 0;">القاسم العقارية</h2>
              <p style="color: #94a3b8; margin: 5px 0 0;">Al-Qasim Real Estate</p>
            </div>
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              ${htmlBody}
            </div>
            <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
              <p>القاسم العقارية | Al-Qasim Real Estate</p>
              <p>الرياض، المملكة العربية السعودية</p>
            </div>
          </div>
        `,
        text: email.body || "",
      });

      if (success) {
        await db.update(dripEmails)
          .set({ status: "sent", sentAt: now })
          .where(eq(dripEmails.id, email.id));
        sent++;
      } else {
        await db.update(dripEmails)
          .set({ status: "failed", errorMessage: "Email send returned false" })
          .where(eq(dripEmails.id, email.id));
        failed++;
      }
    } catch (err: any) {
      await db.update(dripEmails)
        .set({ status: "failed", errorMessage: err.message?.slice(0, 500) })
        .where(eq(dripEmails.id, email.id));
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Cancel all pending drip emails for a financing request.
 */
export async function cancelDripEmails(financingRequestId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(dripEmails)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(dripEmails.financingRequestId, financingRequestId),
        eq(dripEmails.status, "pending")
      )
    );
}

// Start the drip email processor interval (every 5 minutes)
let dripInterval: ReturnType<typeof setInterval> | null = null;

export function startDripProcessor() {
  if (dripInterval) return;
  // Process every 5 minutes
  dripInterval = setInterval(async () => {
    try {
      const result = await processPendingDripEmails();
      if (result.sent > 0 || result.failed > 0) {
        console.log(`[Drip] Processed: ${result.sent} sent, ${result.failed} failed`);
      }
    } catch (err) {
      console.error("[Drip] Processor error:", err);
    }
  }, 5 * 60 * 1000);

  // Also run immediately on startup
  setTimeout(() => processPendingDripEmails().catch(console.error), 10000);
}

export function stopDripProcessor() {
  if (dripInterval) {
    clearInterval(dripInterval);
    dripInterval = null;
  }
}
