import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";

export type NotificationEvent =
  | "ADMISSION" | "PAYMENT" | "DUE" | "ATTENDANCE" | "EXAM" | "RESULT"
  | "ASSIGNMENT" | "BRANCH_APPLICATION" | "CONTACT" | "SYSTEM";

const typeMap: Record<NotificationEvent, string> = {
  ADMISSION: "INFO", PAYMENT: "SUCCESS", DUE: "WARNING", ATTENDANCE: "WARNING", EXAM: "INFO",
  RESULT: "SUCCESS", ASSIGNMENT: "INFO", BRANCH_APPLICATION: "INFO", CONTACT: "INFO", SYSTEM: "ALERT",
};

/** Create in-app notifications for explicit user ids. */
export async function notifyUsers(userIds: number[], event: NotificationEvent, title: string, message: string, link?: string) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (!ids.length) return;
  await db.insert(notifications).values(ids.map((userId) => ({ userId, title, message, type: typeMap[event], link: link || null })));
}

/** Notify all users holding given role names (e.g. ADMIN, SUPER_ADMIN, ACCOUNTANT). */
export async function notifyRoles(roleNames: string[], event: NotificationEvent, title: string, message: string, link?: string) {
  const { roles } = await import("@/db/schema");
  const roleRows = await db.select().from(roles).where(inArray(roles.name, roleNames));
  if (!roleRows.length) return;
  const userRows = await db.select({ id: users.id }).from(users).where(inArray(users.roleId, roleRows.map((r) => r.id)));
  await notifyUsers(userRows.map((u) => u.id), event, title, message, link);
}

export async function markAllRead(userId: number) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
