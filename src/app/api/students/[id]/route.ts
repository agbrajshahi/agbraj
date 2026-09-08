import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { students, branches, courses, batches, attendance, documents, activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "students.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = parseInt(id);

    const studentRecords = await db
      .select({
        id: students.id,
        studentIdCode: students.studentIdCode,
        name: students.name,
        photoUrl: students.photoUrl,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        phone: students.phone,
        email: students.email,
        address: students.address,
        guardianName: students.guardianName,
        guardianPhone: students.guardianPhone,
        guardianEmail: students.guardianEmail,
        guardianRelation: students.guardianRelation,
        emergencyContact: students.emergencyContact,
        branchId: students.branchId,
        branchName: branches.name,
        courseId: students.courseId,
        courseName: courses.name,
        courseDuration: courses.duration,
        courseFee: courses.fee,
        batchId: students.batchId,
        batchName: batches.name,
        batchSchedule: batches.schedule,
        batchRoom: batches.room,
        currentLevel: students.currentLevel,
        admissionDate: students.admissionDate,
        status: students.status,
        notes: students.notes,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .leftJoin(branches, eq(students.branchId, branches.id))
      .leftJoin(courses, eq(students.courseId, courses.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentRecords.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = studentRecords[0];

    // Branch manager scoping check
    if (user.roleName === "BRANCH_MANAGER" && user.branchId && student.branchId !== user.branchId) {
      return NextResponse.json({ error: "Unauthorized access to other branch student" }, { status: 403 });
    }

    // Attendance records
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date))
      .limit(20);

    // Documents
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.entityId, studentId))
      .orderBy(desc(documents.createdAt));

    // Activity
    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, String(studentId)))
      .orderBy(desc(activityLogs.timestamp))
      .limit(15);

    // Synthetic fee ledger (Payments-ready section)
    const paymentRecords = [
      {
        id: "INV-2026-001",
        description: `Enrollment Fee - ${student.courseName || "Abacus Foundation"}`,
        amount: student.courseFee || "480.00",
        dueDate: new Date(student.admissionDate),
        status: "PAID",
        paidDate: new Date(student.admissionDate),
        method: "Bank Transfer",
      },
    ];

    return NextResponse.json({
      student,
      attendance: attendanceRecords,
      documents: docs,
      activity: logs,
      payments: paymentRecords,
    });
  } catch (error) {
    console.error("Get student detail error:", error);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "students.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = parseInt(id);
    const data = await req.json();

    const [updated] = await db
      .update(students)
      .set({
        name: data.name,
        photoUrl: data.photoUrl,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        guardianRelation: data.guardianRelation,
        emergencyContact: data.emergencyContact,
        branchId: data.branchId ? parseInt(data.branchId) : undefined,
        courseId: data.courseId ? parseInt(data.courseId) : null,
        batchId: data.batchId ? parseInt(data.batchId) : null,
        currentLevel: data.currentLevel,
        status: data.status,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "STUDENT",
      entityId: studentId,
      details: `Updated details for student ${updated.name}`,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "students.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const studentId = parseInt(id);

    const [deleted] = await db.delete(students).where(eq(students.id, studentId)).returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "STUDENT",
      entityId: studentId,
      details: `Archived/deleted student ${deleted?.name || studentId}`,
    });

    return NextResponse.json({ success: true, message: "Student record deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
