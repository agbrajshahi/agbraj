import { NextResponse } from "next/server";
import { db } from "@/db";
import { branchApplications } from "@/db/schema";
import { desc } from "drizzle-orm";
import { sendTemplatedEmail } from "@/lib/email/service";
import { notifyRoles } from "@/lib/notifications/notify";

export async function POST(req: Request) {
  try {
    const d = await req.json();
    if (!d.applicantName || !d.phone || !d.email) return NextResponse.json({ error: "Name, phone and email are required" }, { status: 400 });
    const last = await db.select({ id: branchApplications.id }).from(branchApplications).orderBy(desc(branchApplications.id)).limit(1);
    const applicationCode = `BAP-2026-${String((last[0]?.id || 0) + 1).padStart(3, "0")}`;
    const [row] = await db.insert(branchApplications).values({
      applicationCode, applicantName: d.applicantName, organization: d.organization || null, phone: d.phone, email: d.email,
      address: d.address || null, city: d.city || null, experience: d.experience || null,
      expectedCapacity: d.expectedCapacity ? parseInt(d.expectedCapacity) : null, message: d.message || null,
      logoUrl: d.logoUrl || null, documentUrls: Array.isArray(d.documentUrls) ? d.documentUrls : [],
    }).returning();
    await notifyRoles(["ADMIN", "SUPER_ADMIN"], "BRANCH_APPLICATION", "New branch application", `${row.applicantName} (${row.city || "—"}) applied for a franchise branch.`, "/admin/branch-applications");
    await sendTemplatedEmail(row.email, "BRANCH_APPLICATION", { applicantName: row.applicantName, applicationCode, status: "RECEIVED" });
    return NextResponse.json({ success: true, applicationCode });
  } catch (e: any) { return NextResponse.json({ error: "Failed to submit application" }, { status: 500 }); }
}
