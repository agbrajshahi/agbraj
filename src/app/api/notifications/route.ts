import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, or, isNull, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db
      .select()
      .from(notifications)
      .where(or(eq(notifications.userId, user.id), isNull(notifications.userId)))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const unreadCount = items.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: items,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    if (!data.title || !data.message) {
      return NextResponse.json({ error: "Title and message required" }, { status: 400 });
    }

    const [item] = await db
      .insert(notifications)
      .values({
        userId: data.userId ? parseInt(data.userId) : null,
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        link: data.link || null,
        isRead: false,
      })
      .returning();

    return NextResponse.json({ success: true, notification: item });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
