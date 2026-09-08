import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.roleName !== "SUPER_ADMIN" && user.roleName !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");

    let query = db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(100);
    const logs = await query;

    let filtered = logs;
    if (action && action !== "ALL") {
      filtered = filtered.filter((l) => l.action === action);
    }
    if (entity && entity !== "ALL") {
      filtered = filtered.filter((l) => l.entity === entity);
    }

    return NextResponse.json({ logs: filtered, total: filtered.length });
  } catch (error) {
    console.error("Activity logs error:", error);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
