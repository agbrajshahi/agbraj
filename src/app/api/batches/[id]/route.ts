import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { batches, branches, courses, teachers, students, attendance } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "batches.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const batchId = parseInt(id);

    const batchRows = await db
      .select({
        id: batches.id,
        batchCode: batches.batchCode,
        name: batches.name,
        branchId: batches.branchId,
        branchName: branches.name,
        courseId: batches.courseId,
        courseName: courses.name,
        teacherId: batches.teacherId,
        teacherName: teachers.name,
        teacherEmail: teachers.email,
        teacherPhone: teachers.phone,
        schedule: batches.schedule,
        startDate: batches.startDate,
        endDate: batches.endDate,
        room: batches.room,
        capacity: batches.capacity,
        status: batches.status,
        createdAt: batches.createdAt,
      })
      .from(batches)
      .leftJoin(branches, eq(batches.branchId, branches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .leftJoin(teachers, eq(batches.teacherId, teachers.id))
      .where(eq(batches.id, batchId))
      .limit(1);

    if (!batchRows.length) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const batch = batchRows[0];

    if (user.roleName === "BRANCH_MANAGER" && user.branchId && batch.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enrolled students
    const batchStudents = await db.select().from(students).where(eq(students.batchId, batchId));

    // Recent batch attendance
    const recentAttendance = await db
      .select()
      .from(attendance)
      .where(eq(attendance.batchId, batchId))
      .orderBy(desc(attendance.date))
      .limit(20);

    return NextResponse.json({
      batch,
      students: batchStudents,
      attendance: recentAttendance,
    });
  } catch (error) {
    console.error("Batch detail error:", error);
    return NextResponse.json({ error: "Failed to fetch batch details" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "batches.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const batchId = parseInt(id);
    const data = await req.json();

    const [updated] = await db
      .update(batches)
      .set({
        name: data.name,
        branchId: data.branchId ? parseInt(data.branchId) : undefined,
        courseId: data.courseId ? parseInt(data.courseId) : undefined,
        teacherId: data.teacherId ? parseInt(data.teacherId) : null,
        schedule: data.schedule,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
        room: data.room,
        capacity: data.capacity ? parseInt(data.capacity) : undefined,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "BATCH",
      entityId: batchId,
      details: `Updated batch ${updated.name}`,
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error: any) {
    console.error("Update batch error:", error);
    return NextResponse.json({ error: error.message || "Failed to update batch" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "batches.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const batchId = parseInt(id);

    const [deleted] = await db.delete(batches).where(eq(batches.id, batchId)).returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "BATCH",
      entityId: batchId,
      details: `Deleted batch ${deleted?.name || batchId}`,
    });

    return NextResponse.json({ success: true, message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Delete batch error:", error);
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}
