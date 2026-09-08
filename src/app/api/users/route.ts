import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, hashPassword, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { users, roles, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "users.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allUsers = await db
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
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(branches, eq(users.branchId, branches.id))
      .orderBy(desc(users.id));

    return NextResponse.json({ users: allUsers, total: allUsers.length });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "users.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.email || !data.password || !data.roleId) {
      return NextResponse.json({ error: "Name, email, password, and role are required" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, data.email.trim().toLowerCase())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        phone: data.phone || null,
        passwordHash,
        roleId: parseInt(data.roleId),
        branchId: data.branchId ? parseInt(data.branchId) : null,
        status: data.status || "ACTIVE",
        photoUrl: data.photoUrl || null,
        customPermissions: data.customPermissions || null,
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "USER",
      entityId: newUser.id,
      details: `Created new user ${newUser.name} (${newUser.email}) with role ID ${newUser.roleId}`,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
