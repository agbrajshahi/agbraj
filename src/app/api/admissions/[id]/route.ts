import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { admissions, students, enrollments, batches, courses, courseLevels, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admissions.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const row = await db.select().from(admissions).where(eq(admissions.id, parseInt(id))).limit(1);
    if (!row.length) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    return NextResponse.json({ admission: row[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admission" }, { status: 500 });
  }
}

/**
 * Status workflow:
 * APPROVED -> creates/links a student record (if not already)
 * ACTIVE    -> creates/links student AND enrollment into course/batch
 * REJECTED / CANCELLED -> records decision
 */
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admissions.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const data = await req.json();
    const admissionId = parseInt(id);

    const existing = await db.select().from(admissions).where(eq(admissions.id, admissionId)).limit(1);
    if (!existing.length) return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    const admission = existing[0];

    const update: any = {
      status: data.status,
      notes: data.notes !== undefined ? data.notes : admission.notes,
      updatedAt: new Date(),
    };

    let linkedStudentId = admission.linkedStudentId;

    // Create student on APPROVE / ACTIVE
    if ((data.status === "APPROVED" || data.status === "ACTIVE") && !linkedStudentId) {
      const countRes = await db.select({ count: sql<number>`count(*)` }).from(students);
      const studentIdCode = `STU-2026-${String(Number(countRes[0]?.count || 0) + 1).padStart(3, "0")}`;
      const [student] = await db
        .insert(students)
        .values({
          studentIdCode,
          name: admission.studentName,
          photoUrl: admission.photoUrl,
          dateOfBirth: admission.dateOfBirth,
          gender: admission.gender,
          phone: admission.phone,
          email: admission.email,
          address: admission.address,
          guardianName: admission.guardianName,
          guardianPhone: admission.guardianPhone,
          guardianEmail: admission.guardianEmail,
          guardianRelation: admission.guardianRelation,
          emergencyContact: admission.guardianPhone,
          branchId: admission.branchId,
          courseId: admission.courseId,
          batchId: admission.batchId,
          currentLevel: admission.levelId ? `Level ${admission.levelId}` : "Foundation Level 1",
          admissionDate: admission.admissionDate,
          status: "ACTIVE",
          notes: admission.notes,
        })
        .returning();
      linkedStudentId = student.id;
      update.linkedStudentId = student.id;
      update.decidedBy = user.id;
      update.decidedAt = new Date();
    }

    // Create enrollment on ACTIVE
    if (data.status === "ACTIVE" && linkedStudentId && admission.batchId && admission.courseId) {
      const existingEnr = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, linkedStudentId));
      if (!existingEnr.length) {
        await db.insert(enrollments).values({
          studentId: linkedStudentId,
          batchId: admission.batchId,
          courseId: admission.courseId,
          levelId: admission.levelId,
          branchId: admission.branchId,
          enrollmentDate: new Date(),
          startDate: new Date(),
          status: "ACTIVE",
        });
      }
    }

    if (data.status === "REJECTED" || data.status === "CANCELLED") {
      update.decidedBy = user.id;
      update.decidedAt = new Date();
    }

    const [updated] = await db.update(admissions).set(update).where(eq(admissions.id, admissionId)).returning();

    // Notify branch manager + admins of decision
    const { users } = await import("@/db/schema");
    const targetUsers = await db.select().from(users);
    for (const u of targetUsers) {
      if ((u.roleId === 2 || u.roleId === 3) && (u.branchId === null || u.branchId === admission.branchId)) {
        await db.insert(notifications).values({
          userId: u.id,
          title: `Admission ${data.status}`,
          message: `${admission.studentName} (${admission.admissionCode}) was marked ${data.status}.`,
          type: data.status === "REJECTED" ? "WARNING" : "SUCCESS",
          link: "/admin/admissions",
        });
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "ADMISSION",
      entityId: admissionId,
      details: `Admission ${admission.admissionCode} status changed to ${data.status}`,
    });

    return NextResponse.json({ success: true, admission: updated });
  } catch (error: any) {
    console.error("Update admission error:", error);
    return NextResponse.json({ error: error.message || "Failed to update admission" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admissions.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    await db.delete(admissions).where(eq(admissions.id, parseInt(id)));
    await logActivity({ userId: user.id, userName: user.name, action: "DELETE", entity: "ADMISSION", entityId: id, details: `Deleted admission #${id}` });
    return NextResponse.json({ success: true, message: "Admission deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete admission" }, { status: 500 });
  }
}
