import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import {
  students,
  batches,
  courses,
  branches,
  attendance,
  assignments,
  submissions,
  exams,
  results,
  studyMaterials,
  classSchedules,
  documents,
  teachers,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const myStudentRows = await db
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
        emergencyContact: students.emergencyContact,
        branchId: students.branchId,
        branchName: branches.name,
        courseId: students.courseId,
        courseName: courses.name,
        courseFee: courses.fee,
        batchId: students.batchId,
        batchName: batches.name,
        batchSchedule: batches.schedule,
        batchRoom: batches.room,
        currentLevel: students.currentLevel,
        admissionDate: students.admissionDate,
        status: students.status,
      })
      .from(students)
      .leftJoin(branches, eq(students.branchId, branches.id))
      .leftJoin(courses, eq(students.courseId, courses.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.userId, user.id))
      .limit(1);

    if (!myStudentRows.length) {
      return NextResponse.json({ error: "No student profile linked to this account" }, { status: 404 });
    }
    const student = myStudentRows[0];

    const teacherRow = student.batchId
      ? await db.select({ id: teachers.id, name: teachers.name, email: teachers.email, phone: teachers.phone }).from(teachers).innerJoin(batches, eq(batches.teacherId, teachers.id)).where(eq(batches.id, student.batchId)).limit(1)
      : [];

    const myAttendance = await db.select().from(attendance).where(eq(attendance.studentId, student.id)).orderBy(desc(attendance.date));
    const presentCount = myAttendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const attendancePercentage = myAttendance.length > 0 ? Math.round((presentCount / myAttendance.length) * 100) : 0;

    const myAssignments = student.batchId
      ? await db.select().from(assignments).where(eq(assignments.batchId, student.batchId)).orderBy(desc(assignments.deadline))
      : [];
    const mySubmissions = await db.select().from(submissions).where(eq(submissions.studentId, student.id));
    const assignmentsWithStatus = myAssignments.map((a) => ({
      ...a,
      mySubmission: mySubmissions.find((s) => s.assignmentId === a.id) || null,
    }));

    const myExams = student.batchId
      ? await db.select().from(exams).where(eq(exams.batchId, student.batchId))
      : [];
    const publishedExams = myExams.filter((e) => e.status === "PUBLISHED" || e.status === "COMPLETED");

    const myResults = await db
      .select()
      .from(results)
      .where(eq(results.studentId, student.id));
    const publishedResults = myResults.filter((r) => r.status === "PUBLISHED");

    const myMaterials = await db.select().from(studyMaterials);
    const filteredMaterials = myMaterials.filter(
      (m) => m.courseId === student.courseId || m.batchId === student.batchId || (!m.courseId && !m.batchId)
    );

    const mySchedule = student.batchId
      ? await db.select().from(classSchedules).where(eq(classSchedules.batchId, student.batchId)).orderBy(classSchedules.date)
      : [];

    const myDocuments = await db.select().from(documents).where(eq(documents.entityId, student.id));

    return NextResponse.json({
      student,
      teacher: teacherRow[0] || null,
      attendance: { records: myAttendance.slice(0, 20), percentage: attendancePercentage, total: myAttendance.length, present: presentCount },
      assignments: assignmentsWithStatus,
      exams: publishedExams,
      results: publishedResults,
      materials: filteredMaterials,
      schedule: mySchedule,
      documents: myDocuments,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json({ error: "Failed to load student dashboard" }, { status: 500 });
  }
}
