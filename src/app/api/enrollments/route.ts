import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { enrollments, students, batches, courses, courseLevels, branches, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "enrollments.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        batchId: enrollments.batchId,
        batchName: batches.name,
        courseId: enrollments.courseId,
        courseName: courses.name,
        levelId: enrollments.levelId,
        levelName: courseLevels.name,
        branchId: enrollments.branchId,
        branchName: branches.name,
        enrollmentDate: enrollments.enrollmentDate,
        startDate: enrollments.startDate,
        endDate: enrollments.endDate,
        status: enrollments.status,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(batches, eq(enrollments.batchId, batches.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(courseLevels, eq(enrollments.levelId, courseLevels.id))
      .leftJoin(branches, eq(enrollments.branchId, branches.id))
      .orderBy(desc(enrollments.enrollmentDate));

    let filtered = rows;
    if (user.roleName === "BRANCH_MANAGER" && user.branchId) filtered = filtered.filter((r) => r.branchId === user.branchId);
    return NextResponse.json({ enrollments: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch enrollments error:", error);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "enrollments.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data = await req.json();
    if (!data.studentId || !data.batchId || !data.courseId) {
      return NextResponse.json({ error: "Student, batch, and course are required" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, parseInt(data.studentId)));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Student is already enrolled. Update the existing enrollment instead." }, { status: 409 });
    }

    const batchRow = await db.select().from(batches).where(eq(batches.id, parseInt(data.batchId))).limit(1);
    if (!batchRow.length) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const [newEnrollment] = await db
      .insert(enrollments)
      .values({
        studentId: parseInt(data.studentId),
        batchId: parseInt(data.batchId),
        courseId: parseInt(data.courseId),
        levelId: data.levelId ? parseInt(data.levelId) : null,
        branchId: data.branchId ? parseInt(data.branchId) : batchRow[0].branchId,
        enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : new Date(),
        startDate: data.startDate ? new Date(data.startDate) : batchRow[0].startDate,
        endDate: data.endDate ? new Date(data.endDate) : batchRow[0].endDate,
        status: data.status || "ACTIVE",
      })
      .returning();

    // Sync the student record's course/batch assignment
    await db
      .update(students)
      .set({ courseId: parseInt(data.courseId), batchId: parseInt(data.batchId), updatedAt: new Date() })
      .where(eq(students.id, parseInt(data.studentId)));

    const stu = await db.select().from(students).where(eq(students.id, parseInt(data.studentId))).limit(1);
    if (stu[0]?.userId) {
      await db.insert(notifications).values({
        userId: stu[0].userId,
        title: "Enrollment Confirmed",
        message: `You have been enrolled in ${batchRow[0].name}. Welcome aboard!`,
        type: "SUCCESS",
        link: "/student",
      });
    }

    await logActivity({
      userId: user.id, userName: user.name, action: "CREATE", entity: "ENROLLMENT", entityId: newEnrollment.id,
      details: `Enrolled student #${data.studentId} into batch #${data.batchId}`,
    });

    return NextResponse.json({ success: true, enrollment: newEnrollment });
  } catch (error: any) {
    console.error("Create enrollment error:", error);
    return NextResponse.json({ error: error.message || "Failed to create enrollment" }, { status: 500 });
  }
}
