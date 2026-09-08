import { NextResponse } from "next/server";
import { db } from "@/db";
import { admissions, branches, courses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { sendTemplatedEmail } from "@/lib/email/service";
import { notifyRoles } from "@/lib/notifications/notify";

export async function GET() {
  const [b, c] = await Promise.all([db.select({ id: branches.id, name: branches.name, city: branches.city }).from(branches), db.select({ id: courses.id, name: courses.name, fee: courses.fee }).from(courses)]);
  return NextResponse.json({ branches: b.filter(Boolean), courses: c });
}

export async function POST(req: Request) {
  try {
    const d = await req.json();
    if (!d.studentName || !d.guardianName || !d.guardianPhone || !d.branchId) return NextResponse.json({ error: "Student name, guardian name, guardian phone and branch are required" }, { status: 400 });
    const last = await db.select({ id: admissions.id }).from(admissions).orderBy(desc(admissions.id)).limit(1);
    const admissionCode = `ADM-2026-${String((last[0]?.id || 0) + 1).padStart(3, "0")}`;
    const [row] = await db.insert(admissions).values({
      admissionCode, studentName: d.studentName, photoUrl: d.photoUrl || null, dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null, gender: d.gender || null,
      phone: d.phone || null, email: d.email || null, address: d.address || null, guardianName: d.guardianName, guardianPhone: d.guardianPhone, guardianEmail: d.guardianEmail || null,
      branchId: parseInt(d.branchId), courseId: d.courseId ? parseInt(d.courseId) : null, notes: d.notes ? `[Online application] ${d.notes}` : "[Online application]", status: "PENDING",
    }).returning();
    await notifyRoles(["ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"], "ADMISSION", "New online admission", `${row.studentName} applied online (${admissionCode}).`, "/admin/admissions");
    await sendTemplatedEmail(row.guardianEmail, "ADMISSION", { guardianName: row.guardianName, studentName: row.studentName, admissionCode, status: "RECEIVED" });
    return NextResponse.json({ success: true, admissionCode });
  } catch (e: any) { return NextResponse.json({ error: "Failed to submit admission" }, { status: 500 }); }
}
