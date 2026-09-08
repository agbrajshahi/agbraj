import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markAllRead } from "@/lib/notifications/notify";
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllRead(user.id);
  return NextResponse.json({ success: true });
}
