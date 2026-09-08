import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { cmsContents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "cms.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rows = await db.select().from(cmsContents);
    return NextResponse.json({ items: rows });
  } catch { return NextResponse.json({ error: "Failed to load content" }, { status: 500 }); }
}

/** Upsert a content block by key: { key, section, title, content } */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "cms.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { key, section, title, content } = await req.json();
    if (!key || !section || content === undefined) return NextResponse.json({ error: "key, section, content required" }, { status: 400 });
    const existing = await db.select().from(cmsContents).where(eq(cmsContents.key, key)).limit(1);
    let row;
    if (existing.length) {
      [row] = await db.update(cmsContents).set({ section, title: title || null, content, updatedBy: user.id, updatedAt: new Date() }).where(eq(cmsContents.key, key)).returning();
    } else {
      [row] = await db.insert(cmsContents).values({ key, section, title: title || null, content, updatedBy: user.id }).returning();
    }
    await logActivity({ userId: user.id, userName: user.name, action: "UPDATE", entity: "CMS", entityId: key, details: `Updated CMS block "${key}"` });
    return NextResponse.json({ success: true, item: row });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Save failed" }, { status: 500 }); }
}
