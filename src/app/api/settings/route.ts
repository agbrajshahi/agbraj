import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allSettings = await db.select().from(settings);
    const settingsMap: Record<string, string> = {};
    for (const item of allSettings) {
      settingsMap[item.key] = item.value;
    }
    return NextResponse.json({ settings: settingsMap, raw: allSettings });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "settings.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { settings: updatedSettings } = await req.json();

    if (!updatedSettings || typeof updatedSettings !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(updatedSettings)) {
      const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      if (existing.length > 0) {
        await db.update(settings).set({ value: String(value), updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({
          key,
          value: String(value),
          category: "GENERAL",
          description: "Configured via admin panel",
        });
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "SETTINGS",
      entityId: "system",
      details: `Updated platform settings configuration`,
    });

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
