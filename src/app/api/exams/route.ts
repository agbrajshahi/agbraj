import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { exams, batches, courses, courseLevels, students, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "exams.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const records = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        courseId: exams.courseId,
        courseName: courses.name,
        batchId: exams.batchId,
        batchName: batches.name,
        branchId: batches.branchId,
        levelId: exams.levelId,
        levelName: courseLevels.name,
        examDate: exams.examDate,
        durationMinutes: exams.durationMinutes,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        status: exams.status,
        createdAt: exams.createdAt,
      })
      .from(exams)
      .leftJoin(courses, eq(exams.courseId, courses.id))
      .leftJoin(batches, eq(exams.batchId, batches.id))
      .leftJoin(courseLevels, eq(exams.levelId, courseLevels.id))
      .orderBy(desc(exams.examDate));

    let filtered = records;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((e) => e.branchId === user.branchId);
    }

    if (user.roleName === "TEACHER") {
      const { teachers } = await import("@/db/schema");
      const myTeacher = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
      if (myTeacher.length) {
        const myBatches = await db.select().from(batches).where(eq(batches.teacherId, myTeacher[0].id));
        const myBatchIds = myBatches.map((b) => b.id);
        filtered = filtered.filter((e) => myBatchIds.includes(e.batchId));
      }
    }

    if (user.roleName === "STUDENT" || user.roleName === "PARENT") {
      // Only published exams visible
      filtered = filtered.filter((e) => e.status === "PUBLISHED" || e.status === "COMPLETED");

      if (user.roleName === "STUDENT") {
        const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
        if (myStudent.length) filtered = filtered.filter((e) => e.batchId === myStudent[0].batchId);
        else filtered = [];
      }
    }

    return NextResponse.json({ exams: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch exams error:", error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "exams.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.title || !data.batchId || !data.examDate) {
      return NextResponse.json({ error: "Title, batch, and exam date are required" }, { status: 400 });
    }

    const [newExam] = await db
      .insert(exams)
      .values({
        title: data.title,
        description: data.description || null,
        courseId: data.courseId ? parseInt(data.courseId) : null,
        batchId: parseInt(data.batchId),
        levelId: data.levelId ? parseInt(data.levelId) : null,
        examDate: new Date(data.examDate),
        durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : 60,
        totalMarks: data.totalMarks ? parseInt(data.totalMarks) : 100,
        passingMarks: data.passingMarks ? parseInt(data.passingMarks) : 40,
        status: "DRAFT",
        createdBy: user.id,
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "EXAM",
      entityId: newExam.id,
      details: `Created exam "${newExam.title}"`,
    });

    return NextResponse.json({ success: true, exam: newExam });
  } catch (error: any) {
    console.error("Create exam error:", error);
    return NextResponse.json({ error: error.message || "Failed to create exam" }, { status: 500 });
  }
}
