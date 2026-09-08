import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { classSchedules, batches, courses, teachers, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "schedule.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const batchId = searchParams.get("batchId");

    const records = await db
      .select({
        id: classSchedules.id,
        courseId: classSchedules.courseId,
        courseName: courses.name,
        batchId: classSchedules.batchId,
        batchName: batches.name,
        teacherId: classSchedules.teacherId,
        teacherName: teachers.name,
        branchId: classSchedules.branchId,
        branchName: branches.name,
        room: classSchedules.room,
        date: classSchedules.date,
        startTime: classSchedules.startTime,
        endTime: classSchedules.endTime,
        status: classSchedules.status,
        topic: classSchedules.topic,
        notes: classSchedules.notes,
      })
      .from(classSchedules)
      .leftJoin(courses, eq(classSchedules.courseId, courses.id))
      .leftJoin(batches, eq(classSchedules.batchId, batches.id))
      .leftJoin(teachers, eq(classSchedules.teacherId, teachers.id))
      .leftJoin(branches, eq(classSchedules.branchId, branches.id))
      .orderBy(desc(classSchedules.date));

    let filtered = records;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((r) => r.branchId === user.branchId);
    } else if (branchId && branchId !== "ALL") {
      filtered = filtered.filter((r) => r.branchId === parseInt(branchId));
    }

    if (user.roleName === "TEACHER") {
      const myTeacher = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
      if (myTeacher.length) filtered = filtered.filter((r) => r.teacherId === myTeacher[0].id);
    }

    if (user.roleName === "STUDENT") {
      const { students } = await import("@/db/schema");
      const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      if (myStudent.length) filtered = filtered.filter((r) => r.batchId === myStudent[0].batchId);
      else filtered = [];
    }

    if (batchId && batchId !== "ALL") filtered = filtered.filter((r) => r.batchId === parseInt(batchId));

    return NextResponse.json({ schedules: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "schedule.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { courseId, batchId, teacherId, branchId, room, date, startTime, endTime, topic, notes } = data;

    if (!courseId || !batchId || !branchId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Course, batch, branch, date, and time range are required" }, { status: 400 });
    }

    // Conflict detection: same teacher OR same room, overlapping time, same date
    const sameDayRecords = await db.select().from(classSchedules).where(eq(classSchedules.branchId, parseInt(branchId)));

    const targetDateStr = new Date(date).toDateString();
    const conflicts = sameDayRecords.filter((r) => {
      const sameDate = new Date(r.date).toDateString() === targetDateStr;
      if (!sameDate) return false;
      const overlap = startTime < r.endTime && endTime > r.startTime;
      const sameTeacher = teacherId && r.teacherId === parseInt(teacherId);
      const sameRoom = room && r.room === room;
      return overlap && (sameTeacher || sameRoom);
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: `Scheduling conflict detected: ${
            conflicts[0].teacherId && teacherId && conflicts[0].teacherId === parseInt(teacherId)
              ? "Instructor is already booked"
              : "Room is already occupied"
          } during this time slot on the selected date.`,
        },
        { status: 409 }
      );
    }

    const [newSchedule] = await db
      .insert(classSchedules)
      .values({
        courseId: parseInt(courseId),
        batchId: parseInt(batchId),
        teacherId: teacherId ? parseInt(teacherId) : null,
        branchId: parseInt(branchId),
        room: room || "Room A1",
        date: new Date(date),
        startTime,
        endTime,
        topic: topic || null,
        notes: notes || null,
        status: "SCHEDULED",
        createdBy: user.id,
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "SCHEDULE",
      entityId: newSchedule.id,
      details: `Scheduled class session on ${new Date(date).toLocaleDateString()} (${startTime}-${endTime})`,
    });

    return NextResponse.json({ success: true, schedule: newSchedule });
  } catch (error: any) {
    console.error("Create schedule error:", error);
    return NextResponse.json({ error: error.message || "Failed to create schedule" }, { status: 500 });
  }
}
