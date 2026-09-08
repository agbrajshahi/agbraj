import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { results, students, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "results.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const data = await req.json();

    const updateData: any = { updatedAt: new Date() };
    if (data.marksObtained !== undefined) updateData.marksObtained = data.marksObtained.toString();
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.grade !== undefined) updateData.grade = data.grade;

    if (data.status === "PUBLISHED") {
      updateData.status = "PUBLISHED";
      updateData.publishedAt = new Date();
    }

    const [updated] = await db.update(results).set(updateData).where(eq(results.id, parseInt(id))).returning();

    if (data.status === "PUBLISHED" && updated) {
      const stu = await db.select().from(students).where(eq(students.id, updated.studentId)).limit(1);
      if (stu[0]?.userId) {
        await db.insert(notifications).values({
          userId: stu[0].userId,
          title: "Result Published",
          message: `Your exam result has been published. Grade: ${updated.grade}, Score: ${updated.marksObtained}/${updated.totalMarks}`,
          type: "SUCCESS",
          link: "/student",
        });
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "RESULT",
      entityId: id,
      details: `Updated result #${id}${data.status === "PUBLISHED" ? " and published to student" : ""}`,
    });

    return NextResponse.json({ success: true, result: updated });
  } catch (error: any) {
    console.error("Update result error:", error);
    return NextResponse.json({ error: error.message || "Failed to update result" }, { status: 500 });
  }
}
