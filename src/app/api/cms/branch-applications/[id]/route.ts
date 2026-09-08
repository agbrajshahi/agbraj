import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { branchApplications, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendTemplatedEmail } from "@/lib/email/service";
import { notifyRoles } from "@/lib/notifications/notify";

/** Review workflow: PENDING → UNDER_REVIEW → CONTACTED → APPROVED (creates branch) / REJECTED */
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "cms.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const data = await req.json();
    const existing = await db.select().from(branchApplications).where(eq(branchApplications.id, parseInt(id))).limit(1);
    if (!existing.length) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const app = existing[0];

    const update: any = { updatedAt: new Date() };
    if (data.status) { update.status = data.status; update.reviewedBy = user.id; update.reviewedAt = new Date(); }
    if (data.adminNotes !== undefined) update.adminNotes = data.adminNotes;

    // Approved applications can become a branch
    if (data.status === "APPROVED" && data.createBranch && !app.createdBranchId) {
      const last = await db.select({ id: branches.id }).from(branches).orderBy(desc(branches.id)).limit(1);
      const [branch] = await db.insert(branches).values({
        branchCode: `BR-APP-${String((last[0]?.id || 0) + 1).padStart(2, "0")}`,
        name: app.organization || `${app.applicantName} Learning Center`,
        logoUrl: app.logoUrl,
        phone: app.phone,
        email: app.email,
        address: app.address || "Address pending",
        city: app.city || "City pending",
        status: "INACTIVE",
        description: `Franchise branch created from application ${app.applicationCode}. Expected capacity: ${app.expectedCapacity || "N/A"}.`,
      }).returning();
      update.createdBranchId = branch.id;
    }

    const [updated] = await db.update(branchApplications).set(update).where(eq(branchApplications.id, app.id)).returning();

    if (data.status) {
      await sendTemplatedEmail(app.email, "BRANCH_APPLICATION", { applicantName: app.applicantName, applicationCode: app.applicationCode, status: data.status });
      await notifyRoles(["ADMIN", "SUPER_ADMIN"], "BRANCH_APPLICATION", `Branch application ${data.status}`, `${app.applicantName} (${app.applicationCode}) marked ${data.status}.`, "/admin/branch-applications");
    }

    await logActivity({ userId: user.id, userName: user.name, action: "UPDATE", entity: "BRANCH_APPLICATION", entityId: id, details: `Application ${app.applicationCode} → ${data.status || "notes updated"}` });
    return NextResponse.json({ success: true, item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Update failed" }, { status: 500 }); }
}
