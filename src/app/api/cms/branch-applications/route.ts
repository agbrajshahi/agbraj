import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { branchApplications } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "cms.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rows = await db.select().from(branchApplications).orderBy(desc(branchApplications.id));
    return NextResponse.json({ items: rows, total: rows.length });
  } catch { return NextResponse.json({ error: "Failed to load applications" }, { status: 500 }); }
}
