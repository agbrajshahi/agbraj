import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { sendTemplatedEmail } from "@/lib/email/service";
import { notifyRoles } from "@/lib/notifications/notify";

const rate = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(); const arr = (rate.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now); rate.set(ip, arr); return arr.length > 5;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (limited(ip)) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    const d = await req.json();
    if (!d.name || !d.email || !d.message) return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    const [row] = await db.insert(contactMessages).values({ name: String(d.name).slice(0, 150), email: String(d.email).slice(0, 150), phone: d.phone ? String(d.phone).slice(0, 50) : null, subject: d.subject ? String(d.subject).slice(0, 200) : null, message: String(d.message).slice(0, 5000) }).returning();
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], "CONTACT", "New contact message", `${row.name}: ${row.subject || "General inquiry"}`, "/admin/contact-messages");
    await sendTemplatedEmail(row.email, "CONTACT_RECEIVED", { name: row.name });
    return NextResponse.json({ success: true, id: row.id });
  } catch (e: any) { return NextResponse.json({ error: "Failed to send message" }, { status: 500 }); }
}
