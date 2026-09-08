import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import {
  parents,
  studentParents,
  students,
  batches,
  courses,
  branches,
  attendance,
  assignments,
  exams,
  results,
  classSchedules,
  studyMaterials,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const myParentRows = await db.select().from(parents).where(eq(parents.userId, user.id)).limit(1);
    if (!myParentRows.length) {
      return NextResponse.json({ error: "No parent profile linked to this account" }, { status: 404 });
    }
    const parent = myParentRows[0];

    const links = await db.select().from(studentParents).where(eq(studentParents.parentId, parent.id));
    const studentIds = links.map((l) => l.studentId);

    if (studentIds.length === 0) {
      return NextResponse.json({ parent, children: [] });
    }

    const allStudents = await db
      .select({
        id: students.id,
        studentIdCode: students.studentIdCode,
        name: students.name,
        photoUrl: students.photoUrl,
        currentLevel: students.currentLevel,
        status: students.status,
        branchId: students.branchId,
        branchName: branches.name,
        courseId: students.courseId,
        courseName: courses.name,
        batchId: students.batchId,
        batchName: batches.name,
        batchSchedule: batches.schedule,
      })
      .from(students)
      .leftJoin(branches, eq(students.branchId, branches.id))
      .leftJoin(courses, eq(students.courseId, courses.id))
      .leftJoin(batches, eq(students.batchId, batches.id));

    const myChildren = allStudents.filter((s) => studentIds.includes(s.id));

    const allAttendance = await db.select().from(attendance);
    const allAssignments = await db.select().from(assignments);
    const allExams = await db.select().from(exams);
    const allResults = await db.select().from(results);
    const allSchedules = await db.select().from(classSchedules);
    const allMaterials = await db.select().from(studyMaterials);

    const childrenData = myChildren.map((child) => {
      const attRecords = allAttendance.filter((a) => a.studentId === child.id);
      const present = attRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const attendancePercentage = attRecords.length ? Math.round((present / attRecords.length) * 100) : 0;

      const childAssignments = allAssignments.filter((a) => a.batchId === child.batchId);
      const childExams = allExams.filter((e) => e.batchId === child.batchId && (e.status === "PUBLISHED" || e.status === "COMPLETED"));
      const childResults = allResults.filter((r) => r.studentId === child.id && r.status === "PUBLISHED");
      const childSchedule = allSchedules.filter((s) => s.batchId === child.batchId);
      const childMaterials = allMaterials.filter((m) => m.courseId === child.courseId || m.batchId === child.batchId);

      return {
        ...child,
        attendancePercentage,
        attendanceTotal: attRecords.length,
        assignments: childAssignments,
        exams: childExams,
        results: childResults,
        schedule: childSchedule,
        materials: childMaterials,
      };
    });

    return NextResponse.json({ parent, children: childrenData });
  } catch (error) {
    console.error("Parent dashboard error:", error);
    return NextResponse.json({ error: "Failed to load parent dashboard" }, { status: 500 });
  }
}
