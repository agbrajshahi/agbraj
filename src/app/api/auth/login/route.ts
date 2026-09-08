import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession, logActivity } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        status: users.status,
        roleId: users.roleId,
        branchId: users.branchId,
        roleName: roles.name,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, trimmedEmail))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = userRows[0];

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Your account is deactivated or suspended. Please contact administration." }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Update lastLoginAt
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Create session cookie
    await createSession(user.id);

    // Activity Log
    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      details: `Successful login via web portal for role ${user.roleName}`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
