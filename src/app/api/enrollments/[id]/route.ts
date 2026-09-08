import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "enrollments.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(enrollments)
      .set({
        levelId: data.levelId ? parseInt(data.levelId) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
      })
      .where(eq(enrollments.id, parseInt(id)))
      .returning();

    await logActivity({
      userId: user.id, userName: user.name, action: "UPDATE", entity: "ENROLLMENT", entityId: id,
      details: `Updated enrollment #${id} (status: ${data.status || "unchanged"})`,
    });
    return NextResponse.json({ success: true, enrollment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update enrollment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "enrollments.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    await db.delete(enrollments).where(eq(enrollments.id, parseInt(id)));
    await logActivity({ userId: user.id, userName: user.name, action: "DELETE", entity: "ENROLLMENT", entityId: id, details: `Deleted enrollment #${id}` });
    return NextResponse.json({ success: true, message: "Enrollment deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
