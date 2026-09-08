import { NextResponse } from "next/server";
import { getCurrentUser, destroySession, logActivity } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logActivity({
        userId: user.id,
        userName: user.name,
        action: "LOGOUT",
        entity: "USER",
        entityId: user.id,
        details: "User initiated logout",
      });
    }

    await destroySession();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
