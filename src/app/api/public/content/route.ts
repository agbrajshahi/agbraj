import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsContents } from "@/db/schema";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows = await db.select().from(cmsContents);
  const map: Record<string, any> = {};
  rows.forEach((r) => (map[r.key] = r.content));
  return NextResponse.json({ content: map });
}
