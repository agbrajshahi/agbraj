import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, roles, sessions, activityLogs, rolePermissions, permissions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const SESSION_COOKIE_NAME = "abacusup_session";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  branchId: number | null;
  photoUrl: string | null;
  status: string;
  permissions: string[];
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString("hex");
  // 7 days expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return sessionId;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    try {
      await db.delete(sessions).where(eq(sessions.id, sessionToken));
    } catch {
      // Continue even if session not in db
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) return null;

    // Fetch active session with user and role
    const sessionRecords = await db
      .select({
        sessionId: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        userRoleId: users.roleId,
        userBranchId: users.branchId,
        userPhotoUrl: users.photoUrl,
        userStatus: users.status,
        customPermissions: users.customPermissions,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(sessions.id, sessionToken), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (!sessionRecords.length) return null;

    const row = sessionRecords[0];

    // If user is inactive or suspended
    if (row.userStatus !== "ACTIVE") return null;

    // Determine permissions
    let userPermissions: string[] = [];

    if (row.roleName === "SUPER_ADMIN") {
      userPermissions = ["*"];
    } else {
      // Fetch permissions for this role
      const rolePerms = await db
        .select({
          code: permissions.code,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, row.userRoleId));

      userPermissions = rolePerms.map((p) => p.code);

      // Merge custom permissions if any
      if (Array.isArray(row.customPermissions)) {
        userPermissions = Array.from(new Set([...userPermissions, ...(row.customPermissions as string[])]));
      }
    }

    return {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
      phone: row.userPhone,
      roleId: row.userRoleId,
      roleName: row.roleName,
      roleDisplayName: row.roleDisplayName,
      branchId: row.userBranchId,
      photoUrl: row.userPhotoUrl,
      status: row.userStatus,
      permissions: userPermissions,
    };
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}

export function hasPermission(user: SessionUser | null, permissionCode: string): boolean {
  if (!user) return false;
  if (user.roleName === "SUPER_ADMIN" || user.permissions.includes("*")) return true;
  return user.permissions.includes(permissionCode);
}

export async function logActivity(params: {
  userId?: number | null;
  userName?: string | null;
  action: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "PASSWORD_CHANGE" | "ROLE_CHANGE";
  entity: string;
  entityId?: string | number | null;
  details?: string | null;
  ipAddress?: string | null;
}) {
  try {
    await db.insert(activityLogs).values({
      userId: params.userId || null,
      userName: params.userName || "System",
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ? String(params.entityId) : null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
