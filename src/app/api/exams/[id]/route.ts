import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { exams, examQuestions, questions, batches, students, results } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "exams.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const examId = parseInt(id);

    const examRows = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    if (!examRows.length) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    const exam = examRows[0];

    const examQs = await db
      .select({
        id: examQuestions.id,
        orderIndex: examQuestions.orderIndex,
        marksOverride: examQuestions.marksOverride,
        questionId: questions.id,
        questionText: questions.questionText,
        type: questions.type,
        difficulty: questions.difficulty,
        marks: questions.marks,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
      })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, examId))
      .orderBy(examQuestions.orderIndex);

    const batchStudents = await db.select().from(students).where(eq(students.batchId, exam.batchId));
    const examResults = await db.select().from(results).where(eq(results.examId, examId));

    return NextResponse.json({ exam, questions: examQs, students: batchStudents, results: examResults });
  } catch (error) {
    console.error("Exam detail error:", error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "exams.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const data = await req.json();

    // Handle question assignment
    if (data.questionIds && Array.isArray(data.questionIds)) {
      await db.delete(examQuestions).where(eq(examQuestions.examId, parseInt(id)));
      if (data.questionIds.length > 0) {
        await db.insert(examQuestions).values(
          data.questionIds.map((qId: number, idx: number) => ({
            examId: parseInt(id),
            questionId: qId,
            orderIndex: idx + 1,
          }))
        );
      }
    }

    const [updated] = await db
      .update(exams)
      .set({
        title: data.title,
        description: data.description,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
        durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : undefined,
        totalMarks: data.totalMarks ? parseInt(data.totalMarks) : undefined,
        passingMarks: data.passingMarks ? parseInt(data.passingMarks) : undefined,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, parseInt(id)))
      .returning();

    // If publishing, notify students in the batch
    if (data.status === "PUBLISHED") {
      const batchStudents = await db.select().from(students).where(eq(students.batchId, updated.batchId));
      const { notifications } = await import("@/db/schema");
      for (const stu of batchStudents) {
        if (stu.userId) {
          await db.insert(notifications).values({
            userId: stu.userId,
            title: "New Exam Published",
            message: `A new exam "${updated.title}" has been scheduled for ${new Date(updated.examDate).toLocaleDateString()}.`,
            type: "INFO",
            link: "/student",
          });
        }
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "EXAM",
      entityId: id,
      details: `Updated exam #${id}${data.status ? ` (status: ${data.status})` : ""}`,
    });

    return NextResponse.json({ success: true, exam: updated });
  } catch (error: any) {
    console.error("Update exam error:", error);
    return NextResponse.json({ error: error.message || "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "exams.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;

    const examRow = await db.select().from(exams).where(eq(exams.id, parseInt(id))).limit(1);
    if (examRow.length && examRow[0].status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft exams can be deleted. Archive published exams instead." }, { status: 400 });
    }

    await db.delete(exams).where(eq(exams.id, parseInt(id)));

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "EXAM",
      entityId: id,
      details: `Deleted draft exam #${id}`,
    });

    return NextResponse.json({ success: true, message: "Exam deleted" });
  } catch (error) {
    console.error("Delete exam error:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
