import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { assignments, submissions, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "assignments.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const assignmentId = parseInt(id);

    const assignmentRows = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (!assignmentRows.length) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const subs = await db
      .select({
        id: submissions.id,
        studentId: submissions.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        fileUrl: submissions.fileUrl,
        note: submissions.note,
        submittedAt: submissions.submittedAt,
        status: submissions.status,
        marksObtained: submissions.marksObtained,
        feedback: submissions.feedback,
      })
      .from(submissions)
      .innerJoin(students, eq(submissions.studentId, students.id))
      .where(eq(submissions.assignmentId, assignmentId));

    return NextResponse.json({ assignment: assignmentRows[0], submissions: subs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "assignments.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(assignments)
      .set({
        title: data.title,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        maxMarks: data.maxMarks ? parseInt(data.maxMarks) : undefined,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, parseInt(id)))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "ASSIGNMENT",
      entityId: id,
      details: `Updated assignment #${id}`,
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "assignments.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(assignments).where(eq(assignments.id, parseInt(id)));

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "ASSIGNMENT",
      entityId: id,
      details: `Deleted assignment #${id}`,
    });

    return NextResponse.json({ success: true, message: "Assignment deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
