import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "questions.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(questions)
      .set({
        questionText: data.questionText,
        type: data.type,
        subject: data.subject,
        difficulty: data.difficulty,
        marks: data.marks ? parseInt(data.marks) : undefined,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, parseInt(id)))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "QUESTION",
      entityId: id,
      details: `Updated question #${id}`,
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "questions.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(questions).where(eq(questions.id, parseInt(id)));

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "QUESTION",
      entityId: id,
      details: `Deleted question #${id}`,
    });

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
