import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { attendance, students, batches, branches, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "attendance.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allAttendance = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        batchId: attendance.batchId,
        status: attendance.status,
        date: attendance.date,
      })
      .from(attendance);

    const allStudents = await db.select().from(students);
    const allBatches = await db.select().from(batches);
    const allBranches = await db.select().from(branches);
    const allTeachers = await db.select().from(teachers);

    // Student-level %
    const studentStats = allStudents.map((s) => {
      const recs = allAttendance.filter((a) => a.studentId === s.id);
      const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : 0;
      return {
        studentId: s.id,
        studentName: s.name,
        studentCode: s.studentIdCode,
        branchId: s.branchId,
        totalSessions: recs.length,
        presentCount: present,
        attendancePercentage: pct,
      };
    });

    // Batch-level %
    const batchStats = allBatches.map((b) => {
      const recs = allAttendance.filter((a) => a.batchId === b.id);
      const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : 0;
      return {
        batchId: b.id,
        batchName: b.name,
        branchId: b.branchId,
        totalSessions: recs.length,
        attendancePercentage: pct,
      };
    });

    // Branch-level %
    const branchStats = allBranches.map((br) => {
      const branchBatchIds = allBatches.filter((b) => b.branchId === br.id).map((b) => b.id);
      const recs = allAttendance.filter((a) => branchBatchIds.includes(a.batchId));
      const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : 0;
      return {
        branchId: br.id,
        branchName: br.name,
        totalSessions: recs.length,
        attendancePercentage: pct,
      };
    });

    // Teacher-level % (based on batches they teach)
    const teacherStats = allTeachers.map((t) => {
      const teacherBatchIds = allBatches.filter((b) => b.teacherId === t.id).map((b) => b.id);
      const recs = allAttendance.filter((a) => teacherBatchIds.includes(a.batchId));
      const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : 0;
      return {
        teacherId: t.id,
        teacherName: t.name,
        totalSessions: recs.length,
        attendancePercentage: pct,
      };
    });

    return NextResponse.json({ studentStats, batchStats, branchStats, teacherStats });
  } catch (error) {
    console.error("Attendance reports error:", error);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
