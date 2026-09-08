import { NextResponse } from "next/server";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { notifyRoles } from "@/lib/notifications/notify";

export async function POST(req: Request) {
  try {
    const d = await req.json();
    if (!d.name || !d.message) return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    const rating = Math.min(5, Math.max(1, parseInt(d.rating || "5")));
    await db.insert(testimonials).values({ name: d.name, role: d.role || null, message: d.message, rating, status: "PENDING" });
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], "SYSTEM", "Testimonial awaiting approval", `${d.name} submitted a testimonial.`, "/admin/testimonials");
    return NextResponse.json({ success: true, message: "Thank you! Your testimonial is pending approval." });
  } catch { return NextResponse.json({ error: "Failed to submit" }, { status: 500 }); }
}
