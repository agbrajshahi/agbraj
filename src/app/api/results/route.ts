import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { results, exams, students, batches, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function computeGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "results.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const records = await db
      .select({
        id: results.id,
        examId: results.examId,
        examTitle: exams.title,
        batchId: exams.batchId,
        studentId: results.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        branchId: students.branchId,
        marksObtained: results.marksObtained,
        totalMarks: results.totalMarks,
        percentage: results.percentage,
        grade: results.grade,
        remarks: results.remarks,
        status: results.status,
        publishedAt: results.publishedAt,
        createdAt: results.createdAt,
      })
      .from(results)
      .leftJoin(exams, eq(results.examId, exams.id))
      .leftJoin(students, eq(results.studentId, students.id))
      .orderBy(desc(results.createdAt));

    let filtered = records;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((r) => r.branchId === user.branchId);
    }

    if (user.roleName === "STUDENT") {
      const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      filtered = myStudent.length
        ? filtered.filter((r) => r.studentId === myStudent[0].id && r.status === "PUBLISHED")
        : [];
    }

    if (examId) filtered = filtered.filter((r) => r.examId === parseInt(examId));

    return NextResponse.json({ results: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch results error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

// Bulk enter/update marks for an exam
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "results.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { examId, entries } = data; // entries: [{ studentId, marksObtained, remarks }]

    if (!examId || !Array.isArray(entries)) {
      return NextResponse.json({ error: "examId and entries array are required" }, { status: 400 });
    }

    const examRow = await db.select().from(exams).where(eq(exams.id, parseInt(examId))).limit(1);
    if (!examRow.length) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    const totalMarks = examRow[0].totalMarks;

    const savedResults = [];
    for (const entry of entries) {
      const marks = parseFloat(entry.marksObtained);
      const percentage = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;
      const grade = computeGrade(percentage);

      const existing = await db
        .select()
        .from(results)
        .where(eq(results.examId, parseInt(examId)));
      const existingForStudent = existing.find((r) => r.studentId === parseInt(entry.studentId));

      if (existingForStudent) {
        const [updated] = await db
          .update(results)
          .set({
            marksObtained: marks.toString(),
            totalMarks: totalMarks.toString(),
            percentage: percentage.toFixed(2),
            grade,
            remarks: entry.remarks || null,
            gradedBy: user.id,
            updatedAt: new Date(),
          })
          .where(eq(results.id, existingForStudent.id))
          .returning();
        savedResults.push(updated);
      } else {
        const [created] = await db
          .insert(results)
          .values({
            examId: parseInt(examId),
            studentId: parseInt(entry.studentId),
            marksObtained: marks.toString(),
            totalMarks: totalMarks.toString(),
            percentage: percentage.toFixed(2),
            grade,
            remarks: entry.remarks || null,
            status: "DRAFT",
            gradedBy: user.id,
          })
          .returning();
        savedResults.push(created);
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "RESULT",
      entityId: examId,
      details: `Entered/updated marks for ${entries.length} students on exam #${examId}`,
    });

    return NextResponse.json({ success: true, results: savedResults });
  } catch (error: any) {
    console.error("Save results error:", error);
    return NextResponse.json({ error: error.message || "Failed to save results" }, { status: 500 });
  }
}
