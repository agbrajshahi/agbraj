import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import {
  teachers,
  batches,
  students,
  courses,
  branches,
  attendance,
  assignments,
  exams,
  classSchedules,
  submissions,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const myTeacherRows = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
    if (!myTeacherRows.length) {
      return NextResponse.json({ error: "No teacher profile linked to this account" }, { status: 404 });
    }
    const teacher = myTeacherRows[0];

    const myBatches = await db
      .select({
        id: batches.id,
        name: batches.name,
        batchCode: batches.batchCode,
        courseId: batches.courseId,
        courseName: courses.name,
        branchId: batches.branchId,
        branchName: branches.name,
        schedule: batches.schedule,
        room: batches.room,
        capacity: batches.capacity,
        status: batches.status,
      })
      .from(batches)
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .leftJoin(branches, eq(batches.branchId, branches.id))
      .where(eq(batches.teacherId, teacher.id));

    const batchIds = myBatches.map((b) => b.id);

    const myStudents = batchIds.length
      ? (await db.select().from(students)).filter((s) => batchIds.includes(s.batchId || -1))
      : [];

    const myAssignments = batchIds.length
      ? (await db.select().from(assignments)).filter((a) => batchIds.includes(a.batchId))
      : [];

    const myExams = batchIds.length
      ? (await db.select().from(exams)).filter((e) => batchIds.includes(e.batchId))
      : [];

    const mySchedule = batchIds.length
      ? (await db.select().from(classSchedules)).filter((c) => batchIds.includes(c.batchId)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [];

    const allAttendance = await db.select().from(attendance);
    const myAttendance = allAttendance.filter((a) => batchIds.includes(a.batchId));

    const pendingSubmissions = myAssignments.length
      ? (await db.select().from(submissions)).filter(
          (s) => myAssignments.some((a) => a.id === s.assignmentId) && (s.status === "SUBMITTED" || s.status === "LATE")
        )
      : [];

    return NextResponse.json({
      teacher,
      batches: myBatches,
      students: myStudents,
      assignments: myAssignments,
      exams: myExams,
      schedule: mySchedule,
      attendanceCount: myAttendance.length,
      pendingReviewCount: pendingSubmissions.length,
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json({ error: "Failed to load teacher dashboard" }, { status: 500 });
  }
}
