import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { classSchedules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "schedule.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(classSchedules)
      .set({
        room: data.room,
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        topic: data.topic,
        notes: data.notes,
        teacherId: data.teacherId ? parseInt(data.teacherId) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(classSchedules.id, parseInt(id)))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "SCHEDULE",
      entityId: id,
      details: `Updated class schedule #${id}`,
    });

    return NextResponse.json({ success: true, schedule: updated });
  } catch (error: any) {
    console.error("Update schedule error:", error);
    return NextResponse.json({ error: error.message || "Failed to update schedule" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "schedule.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(classSchedules).where(eq(classSchedules.id, parseInt(id)));

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "SCHEDULE",
      entityId: id,
      details: `Deleted class schedule #${id}`,
    });

    return NextResponse.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
