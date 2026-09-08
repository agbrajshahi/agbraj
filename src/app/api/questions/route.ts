import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { questions, courses, courseLevels } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "questions.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";

    const records = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        type: questions.type,
        subject: questions.subject,
        courseId: questions.courseId,
        courseName: courses.name,
        levelId: questions.levelId,
        levelName: courseLevels.name,
        difficulty: questions.difficulty,
        marks: questions.marks,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .leftJoin(courses, eq(questions.courseId, courses.id))
      .leftJoin(courseLevels, eq(questions.levelId, courseLevels.id))
      .orderBy(desc(questions.id));

    let filtered = records;
    if (courseId && courseId !== "ALL") filtered = filtered.filter((q) => q.courseId === parseInt(courseId));
    if (difficulty && difficulty !== "ALL") filtered = filtered.filter((q) => q.difficulty === difficulty);
    if (type && type !== "ALL") filtered = filtered.filter((q) => q.type === type);
    if (search) filtered = filtered.filter((q) => q.questionText.toLowerCase().includes(search.toLowerCase()));

    return NextResponse.json({ questions: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "questions.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.questionText || !data.type) {
      return NextResponse.json({ error: "Question text and type are required" }, { status: 400 });
    }

    const [newQuestion] = await db
      .insert(questions)
      .values({
        questionText: data.questionText,
        type: data.type,
        subject: data.subject || "Mental Arithmetic",
        courseId: data.courseId ? parseInt(data.courseId) : null,
        levelId: data.levelId ? parseInt(data.levelId) : null,
        difficulty: data.difficulty || "MEDIUM",
        marks: data.marks ? parseInt(data.marks) : 1,
        options: data.options || null,
        correctAnswer: data.correctAnswer || null,
        explanation: data.explanation || null,
        createdBy: user.id,
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "QUESTION",
      entityId: newQuestion.id,
      details: `Added question to bank: "${data.questionText.slice(0, 60)}..."`,
    });

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error: any) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: error.message || "Failed to create question" }, { status: 500 });
  }
}
