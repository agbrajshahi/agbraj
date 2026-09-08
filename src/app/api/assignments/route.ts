import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { assignments, batches, courses, teachers, students, submissions, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "assignments.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const records = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        batchId: assignments.batchId,
        batchName: batches.name,
        branchId: batches.branchId,
        courseId: assignments.courseId,
        courseName: courses.name,
        teacherId: assignments.teacherId,
        teacherName: teachers.name,
        deadline: assignments.deadline,
        attachmentUrl: assignments.attachmentUrl,
        maxMarks: assignments.maxMarks,
        status: assignments.status,
        createdAt: assignments.createdAt,
      })
      .from(assignments)
      .leftJoin(batches, eq(assignments.batchId, batches.id))
      .leftJoin(courses, eq(assignments.courseId, courses.id))
      .leftJoin(teachers, eq(assignments.teacherId, teachers.id))
      .orderBy(desc(assignments.deadline));

    let filtered = records;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((a) => a.branchId === user.branchId);
    }

    if (user.roleName === "TEACHER") {
      const myTeacher = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
      if (myTeacher.length) filtered = filtered.filter((a) => a.teacherId === myTeacher[0].id);
    }

    let myStudentRecord: any = null;
    if (user.roleName === "STUDENT") {
      const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      myStudentRecord = myStudent[0] || null;
      filtered = myStudentRecord ? filtered.filter((a) => a.batchId === myStudentRecord.batchId) : [];
    }

    // Attach submission status for each assignment when viewed by student
    let enriched: any[] = filtered;
    if (myStudentRecord) {
      const mySubs = await db.select().from(submissions).where(eq(submissions.studentId, myStudentRecord.id));
      enriched = filtered.map((a) => {
        const sub = mySubs.find((s) => s.assignmentId === a.id);
        return { ...a, mySubmission: sub || null };
      });
    } else {
      // For teachers/admins, attach submission counts
      const allSubs = await db.select().from(submissions);
      enriched = filtered.map((a) => {
        const subs = allSubs.filter((s) => s.assignmentId === a.id);
        return {
          ...a,
          submissionCount: subs.filter((s) => s.status !== "PENDING").length,
          pendingCount: subs.filter((s) => s.status === "PENDING").length,
          reviewedCount: subs.filter((s) => s.status === "REVIEWED").length,
        };
      });
    }

    return NextResponse.json({ assignments: enriched, total: enriched.length });
  } catch (error) {
    console.error("Fetch assignments error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "assignments.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.title || !data.batchId || !data.deadline) {
      return NextResponse.json({ error: "Title, batch, and deadline are required" }, { status: 400 });
    }

    const [newAssignment] = await db
      .insert(assignments)
      .values({
        title: data.title,
        description: data.description || null,
        batchId: parseInt(data.batchId),
        courseId: data.courseId ? parseInt(data.courseId) : null,
        teacherId: data.teacherId ? parseInt(data.teacherId) : null,
        deadline: new Date(data.deadline),
        attachmentUrl: data.attachmentUrl || null,
        maxMarks: data.maxMarks ? parseInt(data.maxMarks) : 10,
        status: "ACTIVE",
      })
      .returning();

    // Create pending submission placeholders + notify students
    const batchStudents = await db.select().from(students).where(eq(students.batchId, newAssignment.batchId));
    if (batchStudents.length > 0) {
      await db.insert(submissions).values(
        batchStudents.map((s) => ({
          assignmentId: newAssignment.id,
          studentId: s.id,
          status: "PENDING",
        }))
      );

      for (const s of batchStudents) {
        if (s.userId) {
          await db.insert(notifications).values({
            userId: s.userId,
            title: "New Assignment Posted",
            message: `"${newAssignment.title}" is due on ${new Date(newAssignment.deadline).toLocaleDateString()}.`,
            type: "INFO",
            link: "/student",
          });
        }
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "ASSIGNMENT",
      entityId: newAssignment.id,
      details: `Created assignment "${newAssignment.title}"`,
    });

    return NextResponse.json({ success: true, assignment: newAssignment });
  } catch (error: any) {
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: error.message || "Failed to create assignment" }, { status: 500 });
  }
}
