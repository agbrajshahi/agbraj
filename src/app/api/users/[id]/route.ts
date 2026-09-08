import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, hashPassword, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { users, roles, branches, activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser, "users.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const targetUserId = parseInt(id);

    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        roleId: users.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        branchId: users.branchId,
        branchName: branches.name,
        photoUrl: users.photoUrl,
        status: users.status,
        customPermissions: users.customPermissions,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!userRows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // User activity logs
    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, targetUserId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(15);

    return NextResponse.json({
      user: userRows[0],
      activity: logs,
    });
  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser, "users.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const targetUserId = parseInt(id);
    const data = await req.json();

    const updateFields: any = {
      name: data.name,
      email: data.email?.trim().toLowerCase(),
      phone: data.phone,
      photoUrl: data.photoUrl,
      status: data.status,
      roleId: data.roleId ? parseInt(data.roleId) : undefined,
      branchId: data.branchId ? parseInt(data.branchId) : null,
      customPermissions: data.customPermissions,
      updatedAt: new Date(),
    };

    if (data.newPassword && data.newPassword.length >= 8) {
      updateFields.passwordHash = await hashPassword(data.newPassword);
    }

    const [updated] = await db.update(users).set(updateFields).where(eq(users.id, targetUserId)).returning();

    await logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "UPDATE",
      entity: "USER",
      entityId: targetUserId,
      details: `Updated user profile/permissions for ${updated.name}`,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser, "users.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const targetUserId = parseInt(id);

    // Prevent deleting oneself
    if (currentUser.id === targetUserId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const [deleted] = await db.delete(users).where(eq(users.id, targetUserId)).returning();

    await logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "DELETE",
      entity: "USER",
      entityId: targetUserId,
      details: `Deleted user ${deleted?.name || targetUserId}`,
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
