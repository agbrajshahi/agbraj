import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { batches, branches, courses, teachers, students } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "batches.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const batchRecords = await db
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
      .orderBy(desc(batches.id));

    const allStudents = await db.select({ id: students.id, batchId: students.batchId }).from(students);

    const enriched = batchRecords.map((b) => ({
      ...b,
      enrolledCount: allStudents.filter((s) => s.batchId === b.id).length,
    }));

    let filtered = enriched;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((b) => b.branchId === user.branchId);
    } else if (branchId && branchId !== "ALL") {
      filtered = filtered.filter((b) => b.branchId === parseInt(branchId));
    }

    if (status && status !== "ALL") {
      filtered = filtered.filter((b) => b.status === status);
    }

    return NextResponse.json({ batches: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch batches error:", error);
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "batches.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.branchId || !data.courseId || !data.schedule || !data.startDate) {
      return NextResponse.json({ error: "Name, branch, course, schedule, and start date are required" }, { status: 400 });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(batches);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const batchCode = data.batchCode || `BTC-${String(nextNum).padStart(3, "0")}`;

    const [newBatch] = await db
      .insert(batches)
      .values({
        batchCode,
        name: data.name,
        branchId: parseInt(data.branchId),
        courseId: parseInt(data.courseId),
        teacherId: data.teacherId ? parseInt(data.teacherId) : null,
        schedule: data.schedule,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        room: data.room || "Room 101",
        capacity: data.capacity ? parseInt(data.capacity) : 15,
        status: data.status || "UPCOMING",
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "BATCH",
      entityId: newBatch.id,
      details: `Created batch ${newBatch.name} (${newBatch.batchCode})`,
    });

    return NextResponse.json({ success: true, batch: newBatch });
  } catch (error: any) {
    console.error("Create batch error:", error);
    return NextResponse.json({ error: error.message || "Failed to create batch" }, { status: 500 });
  }
}
