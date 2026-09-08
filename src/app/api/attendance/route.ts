import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { attendance, students, batches, branches, teachers } from "@/db/schema";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "attendance.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const studentId = searchParams.get("studentId");
    const branchId = searchParams.get("branchId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const records = await db
      .select({
        id: attendance.id,
        batchId: attendance.batchId,
        batchName: batches.name,
        studentId: attendance.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        branchId: batches.branchId,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        recordedBy: attendance.recordedBy,
        createdAt: attendance.createdAt,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(batches, eq(attendance.batchId, batches.id))
      .orderBy(desc(attendance.date));

    let filtered = records;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((r) => r.branchId === user.branchId);
    } else if (branchId && branchId !== "ALL") {
      filtered = filtered.filter((r) => r.branchId === parseInt(branchId));
    }

    if (user.roleName === "TEACHER") {
      const myBatches = await db.select().from(batches).leftJoin(teachers, eq(batches.teacherId, teachers.id)).where(eq(teachers.userId, user.id));
      const myBatchIds = myBatches.map((b) => b.batches.id);
      filtered = filtered.filter((r) => myBatchIds.includes(r.batchId));
    }

    if (user.roleName === "STUDENT") {
      const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      if (myStudent.length) filtered = filtered.filter((r) => r.studentId === myStudent[0].id);
      else filtered = [];
    }

    if (batchId && batchId !== "ALL") filtered = filtered.filter((r) => r.batchId === parseInt(batchId));
    if (studentId) filtered = filtered.filter((r) => r.studentId === parseInt(studentId));
    if (dateFrom) filtered = filtered.filter((r) => new Date(r.date) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter((r) => new Date(r.date) <= new Date(dateTo));

    return NextResponse.json({ attendance: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// Bulk mark attendance for a batch on a given date
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "attendance.mark")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { batchId, date, records } = data; // records: [{ studentId, status, remarks }]

    if (!batchId || !date || !Array.isArray(records)) {
      return NextResponse.json({ error: "batchId, date, and records array are required" }, { status: 400 });
    }

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    // Remove existing records for that batch/date, then re-insert (idempotent overwrite)
    const existing = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.batchId, parseInt(batchId)), gte(attendance.date, dayStart), lte(attendance.date, dayEnd)));

    if (existing.length > 0) {
      await db.delete(attendance).where(inArray(attendance.id, existing.map((e) => e.id)));
    }

    const rows = records.map((r: any) => ({
      batchId: parseInt(batchId),
      studentId: parseInt(r.studentId),
      date: new Date(date),
      status: r.status,
      remarks: r.remarks || null,
      recordedBy: user.id,
    }));

    const inserted = await db.insert(attendance).values(rows).returning();

    // Notify students of absence
    for (const r of rows) {
      if (r.status === "ABSENT") {
        const stu = await db.select().from(students).where(eq(students.id, r.studentId)).limit(1);
        if (stu[0]?.userId) {
          await db.insert((await import("@/db/schema")).notifications).values({
            userId: stu[0].userId,
            title: "Attendance Marked: Absent",
            message: `You were marked absent on ${new Date(date).toLocaleDateString()}. Please contact your instructor.`,
            type: "WARNING",
            link: "/student",
          });
        }
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "ATTENDANCE",
      entityId: batchId,
      details: `Marked attendance for batch #${batchId} on ${new Date(date).toLocaleDateString()} (${rows.length} students)`,
    });

    return NextResponse.json({ success: true, attendance: inserted });
  } catch (error: any) {
    console.error("Mark attendance error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark attendance" }, { status: 500 });
  }
}
