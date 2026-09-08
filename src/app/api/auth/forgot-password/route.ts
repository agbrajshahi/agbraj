import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();
    const userRecords = await db.select().from(users).where(eq(users.email, trimmed)).limit(1);

    if (userRecords.length === 0) {
      // For security, don't disclose whether email exists
      return NextResponse.json({
        success: true,
        message: "If that email is registered, password reset instructions have been generated.",
      });
    }

    const user = userRecords[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    // In Phase 1, we provide simulated token return for sandbox testing / verification
    return NextResponse.json({
      success: true,
      message: "Reset link generated successfully.",
      resetToken, // Provided in development for direct verification
      resetUrl: `/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
