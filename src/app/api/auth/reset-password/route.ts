import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, logActivity } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const tokenRecord = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (tokenRecord.length === 0) {
      return NextResponse.json({ error: "Reset token is invalid or has expired." }, { status: 400 });
    }

    const record = tokenRecord[0];
    const newHash = await hashPassword(newPassword);

    // Update user password
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, record.userId));

    // Mark token as used
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, record.id));

    await logActivity({
      userId: record.userId,
      action: "PASSWORD_CHANGE",
      entity: "USER",
      entityId: record.userId,
      details: "Password reset completed via token",
    });

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
