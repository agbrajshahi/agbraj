import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { teachers, branches, batches, students, documents, activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "teachers.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const teacherId = parseInt(id);

    const teacherRecords = await db
      .select({
        id: teachers.id,
        teacherIdCode: teachers.teacherIdCode,
        name: teachers.name,
        email: teachers.email,
        phone: teachers.phone,
        address: teachers.address,
        qualification: teachers.qualification,
        experience: teachers.experience,
        joiningDate: teachers.joiningDate,
        branchId: teachers.branchId,
        branchName: branches.name,
        bio: teachers.bio,
        photoUrl: teachers.photoUrl,
        status: teachers.status,
        createdAt: teachers.createdAt,
      })
      .from(teachers)
      .leftJoin(branches, eq(teachers.branchId, branches.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (teacherRecords.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacher = teacherRecords[0];

    // Assigned batches
    const assignedBatches = await db
      .select()
      .from(batches)
      .where(eq(batches.teacherId, teacherId));

    // Documents
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.entityId, teacherId))
      .orderBy(desc(documents.createdAt));

    // Activity
    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, String(teacherId)))
      .orderBy(desc(activityLogs.timestamp))
      .limit(10);

    return NextResponse.json({
      teacher,
      batches: assignedBatches,
      documents: docs,
      activity: logs,
    });
  } catch (error) {
    console.error("Teacher detail error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher details" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "teachers.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const teacherId = parseInt(id);
    const data = await req.json();

    const [updated] = await db
      .update(teachers)
      .set({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        qualification: data.qualification,
        experience: data.experience,
        branchId: data.branchId ? parseInt(data.branchId) : undefined,
        bio: data.bio,
        photoUrl: data.photoUrl,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "TEACHER",
      entityId: teacherId,
      details: `Updated teacher ${updated.name}`,
    });

    return NextResponse.json({ success: true, teacher: updated });
  } catch (error: any) {
    console.error("Update teacher error:", error);
    return NextResponse.json({ error: error.message || "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "teachers.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const teacherId = parseInt(id);

    const [deleted] = await db.delete(teachers).where(eq(teachers.id, teacherId)).returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "TEACHER",
      entityId: teacherId,
      details: `Removed teacher ${deleted?.name || teacherId}`,
    });

    return NextResponse.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
