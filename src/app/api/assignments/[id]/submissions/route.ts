import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { submissions, students, assignments, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Student submits their assignment
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const assignmentId = parseInt(id);
    const data = await req.json();

    const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
    if (!myStudent.length) {
      return NextResponse.json({ error: "No linked student profile found for this account" }, { status: 403 });
    }

    const assignmentRow = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (!assignmentRow.length) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const isLate = new Date() > new Date(assignmentRow[0].deadline);

    const existing = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, myStudent[0].id)));

    let saved;
    if (existing.length > 0) {
      [saved] = await db
        .update(submissions)
        .set({
          fileUrl: data.fileUrl || existing[0].fileUrl,
          note: data.note || null,
          submittedAt: new Date(),
          status: isLate ? "LATE" : "SUBMITTED",
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, existing[0].id))
        .returning();
    } else {
      [saved] = await db
        .insert(submissions)
        .values({
          assignmentId,
          studentId: myStudent[0].id,
          fileUrl: data.fileUrl || null,
          note: data.note || null,
          submittedAt: new Date(),
          status: isLate ? "LATE" : "SUBMITTED",
        })
        .returning();
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "SUBMISSION",
      entityId: saved.id,
      details: `Submitted assignment #${assignmentId}${isLate ? " (late)" : ""}`,
    });

    return NextResponse.json({ success: true, submission: saved });
  } catch (error: any) {
    console.error("Submit assignment error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit assignment" }, { status: 500 });
  }
}

// Teacher reviews/grades a submission
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "assignments.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { submissionId, marksObtained, feedback } = data;

    if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

    const [updated] = await db
      .update(submissions)
      .set({
        marksObtained: marksObtained !== undefined ? parseInt(marksObtained) : undefined,
        feedback: feedback || null,
        status: "REVIEWED",
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, parseInt(submissionId)))
      .returning();

    const stu = await db.select().from(students).where(eq(students.id, updated.studentId)).limit(1);
    if (stu[0]?.userId) {
      await db.insert(notifications).values({
        userId: stu[0].userId,
        title: "Assignment Reviewed",
        message: `Your assignment submission has been graded: ${marksObtained} marks. ${feedback ? "Feedback: " + feedback : ""}`,
        type: "SUCCESS",
        link: "/student",
      });
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "SUBMISSION",
      entityId: submissionId,
      details: `Graded submission #${submissionId} with ${marksObtained} marks`,
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error: any) {
    console.error("Grade submission error:", error);
    return NextResponse.json({ error: error.message || "Failed to grade submission" }, { status: 500 });
  }
}
