/**
 * CoBNB Market Intelligence — In-App Notification System
 * 
 * Provides admin alerts for:
 * - New user logins (first-time and regular)
 * - Suspicious activity (multiple failed login attempts)
 * - Scrape job completions/failures
 * - System events (scheduler start/stop, data exports)
 * 
 * Uses the built-in notifyOwner helper for push notifications
 * and stores notifications in-memory for the dashboard bell icon.
 */

import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { auditLog, users } from "../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// ─── In-App Notification Store ───
export interface AppNotification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  category: "login" | "security" | "scrape" | "system" | "user";
  timestamp: Date;
  read: boolean;
  userId?: number; // target user (null = all admins)
  metadata?: Record<string, any>;
}

// In-memory store for notifications (persists during server lifetime)
let notifications: AppNotification[] = [];
let notificationIdCounter = 1;

function generateId(): string {
  return `notif_${Date.now()}_${notificationIdCounter++}`;
}

/** Add a notification to the in-app store */
export function addNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">): AppNotification {
  const notification: AppNotification = {
    ...notif,
    id: generateId(),
    timestamp: new Date(),
    read: false,
  };
  notifications.unshift(notification); // newest first
  // Keep max 200 notifications in memory
  if (notifications.length > 200) {
    notifications = notifications.slice(0, 200);
  }
  return notification;
}

/** Get notifications for a user (admins see all, others see system-wide) */
export function getNotifications(userId: number, role: string, limit = 50): AppNotification[] {
  if (role === "admin") {
    return notifications.slice(0, limit);
  }
  // Non-admins only see their own or system-wide notifications
  return notifications
    .filter(n => !n.userId || n.userId === userId)
    .slice(0, limit);
}

/** Get unread count */
export function getUnreadCount(userId: number, role: string): number {
  if (role === "admin") {
    return notifications.filter(n => !n.read).length;
  }
  return notifications.filter(n => !n.read && (!n.userId || n.userId === userId)).length;
}

/** Mark notification as read */
export function markAsRead(notificationId: string): boolean {
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

/** Mark all notifications as read for a user */
export function markAllAsRead(userId: number, role: string): number {
  let count = 0;
  notifications.forEach(n => {
    if (!n.read) {
      if (role === "admin" || !n.userId || n.userId === userId) {
        n.read = true;
        count++;
      }
    }
  });
  return count;
}

/** Clear all read notifications */
export function clearReadNotifications(): number {
  const before = notifications.length;
  notifications = notifications.filter(n => !n.read);
  return before - notifications.length;
}

// ─── Notification Triggers ───

/** Notify on new user login */
export async function notifyNewLogin(user: { id: number; username?: string | null; displayName?: string | null; role: string }, ip: string, isFirstLogin: boolean) {
  const displayName = user.displayName || user.username || "Unknown";
  
  if (isFirstLogin) {
    addNotification({
      type: "info",
      title: "New User First Login",
      message: `${displayName} (${user.role}) logged in for the first time from IP ${ip}`,
      category: "login",
      metadata: { userId: user.id, ip, isFirstLogin: true },
    });

    // Also push to owner via built-in notification
    try {
      await notifyOwner({
        title: "🔑 New User Login — CoBNB Market Intelligence",
        content: `User "${displayName}" (role: ${user.role}) logged in for the first time from IP: ${ip}. Time: ${new Date().toISOString()}`,
      });
    } catch (e) {
      console.warn("[Notifications] Failed to push owner notification:", e);
    }
  } else {
    addNotification({
      type: "info",
      title: "User Login",
      message: `${displayName} logged in from IP ${ip}`,
      category: "login",
      metadata: { userId: user.id, ip },
    });
  }
}

/** Notify on suspicious login activity (multiple failed attempts) */
export async function notifySuspiciousActivity(username: string, attemptCount: number, ip: string) {
  addNotification({
    type: "warning",
    title: "Suspicious Login Activity",
    message: `${attemptCount} failed login attempts for username "${username}" from IP ${ip}`,
    category: "security",
    metadata: { username, attemptCount, ip },
  });

  // Push to owner for security alerts
  try {
    await notifyOwner({
      title: "⚠️ Security Alert — CoBNB Market Intelligence",
      content: `Suspicious login activity detected: ${attemptCount} failed attempts for username "${username}" from IP: ${ip}. The account has been temporarily locked. Time: ${new Date().toISOString()}`,
    });
  } catch (e) {
    console.warn("[Notifications] Failed to push security alert:", e);
  }
}

/** Notify on scrape job completion */
export function notifyScrapeComplete(jobResult: {
  totalListings: number;
  totalErrors: number;
  duration: number;
  otaSources?: string[];
}) {
  const hasErrors = jobResult.totalErrors > 0;
  addNotification({
    type: hasErrors ? "warning" : "success",
    title: hasErrors ? "Scrape Job Completed with Errors" : "Scrape Job Completed",
    message: `Found ${jobResult.totalListings} listings in ${Math.round(jobResult.duration / 1000)}s. ${hasErrors ? `${jobResult.totalErrors} errors occurred.` : "No errors."}`,
    category: "scrape",
    metadata: jobResult,
  });
}

/** Notify on scrape job failure */
export function notifyScrapeFailure(error: string) {
  addNotification({
    type: "error",
    title: "Scrape Job Failed",
    message: `Scrape job failed: ${error}`,
    category: "scrape",
    metadata: { error },
  });
}

/** Notify on scheduler state change */
export function notifySchedulerChange(action: "start" | "stop", frequency?: string, userName?: string) {
  addNotification({
    type: "info",
    title: action === "start" ? "Scheduler Started" : "Scheduler Stopped",
    message: action === "start"
      ? `Auto-refresh scheduler started with ${frequency} frequency by ${userName || "system"}`
      : `Auto-refresh scheduler stopped by ${userName || "system"}`,
    category: "system",
    metadata: { action, frequency },
  });
}

/** Notify on data export */
export function notifyExport(format: "csv" | "excel", userName: string) {
  addNotification({
    type: "info",
    title: `Data Exported (${format.toUpperCase()})`,
    message: `${userName} exported market data in ${format.toUpperCase()} format`,
    category: "system",
    metadata: { format, userName },
  });
}

/** Notify on user management action */
export function notifyUserAction(action: string, targetUser: string, adminName: string) {
  addNotification({
    type: "info",
    title: `User ${action}`,
    message: `${adminName} ${action} user "${targetUser}"`,
    category: "user",
    metadata: { action, targetUser, adminName },
  });
}

/** Get recent suspicious activity count (from audit log) */
export async function getRecentSecurityAlerts(hours = 24): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const [result] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(auditLog)
      .where(and(
        eq(auditLog.action, "login_failed"),
        gte(auditLog.createdAt, cutoff),
      ));
    return result?.count || 0;
  } catch {
    return 0;
  }
}
