import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { studyMaterials, courses, courseLevels, batches, students } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "materials.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const batchId = searchParams.get("batchId");

    const records = await db
      .select({
        id: studyMaterials.id,
        title: studyMaterials.title,
        description: studyMaterials.description,
        fileUrl: studyMaterials.fileUrl,
        fileType: studyMaterials.fileType,
        category: studyMaterials.category,
        courseId: studyMaterials.courseId,
        courseName: courses.name,
        levelId: studyMaterials.levelId,
        levelName: courseLevels.name,
        batchId: studyMaterials.batchId,
        batchName: batches.name,
        createdAt: studyMaterials.createdAt,
      })
      .from(studyMaterials)
      .leftJoin(courses, eq(studyMaterials.courseId, courses.id))
      .leftJoin(courseLevels, eq(studyMaterials.levelId, courseLevels.id))
      .leftJoin(batches, eq(studyMaterials.batchId, batches.id))
      .orderBy(desc(studyMaterials.createdAt));

    let filtered = records;

    if (user.roleName === "STUDENT") {
      const myStudent = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
      if (myStudent.length) {
        filtered = filtered.filter(
          (m) => m.courseId === myStudent[0].courseId || m.batchId === myStudent[0].batchId || (!m.courseId && !m.batchId)
        );
      }
    }

    if (courseId && courseId !== "ALL") filtered = filtered.filter((m) => m.courseId === parseInt(courseId));
    if (batchId && batchId !== "ALL") filtered = filtered.filter((m) => m.batchId === parseInt(batchId));

    return NextResponse.json({ materials: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch materials error:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "materials.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.title || !data.fileUrl) {
      return NextResponse.json({ error: "Title and file are required" }, { status: 400 });
    }

    const [newMaterial] = await db
      .insert(studyMaterials)
      .values({
        title: data.title,
        description: data.description || null,
        fileUrl: data.fileUrl,
        fileType: data.fileType || "application/octet-stream",
        category: data.category || "DOCUMENT",
        courseId: data.courseId ? parseInt(data.courseId) : null,
        levelId: data.levelId ? parseInt(data.levelId) : null,
        moduleId: data.moduleId ? parseInt(data.moduleId) : null,
        lessonId: data.lessonId ? parseInt(data.lessonId) : null,
        batchId: data.batchId ? parseInt(data.batchId) : null,
        uploadedBy: user.id,
      })
      .returning();

    // Notify batch students
    if (newMaterial.batchId) {
      const batchStudents = await db.select().from(students).where(eq(students.batchId, newMaterial.batchId));
      const { notifications } = await import("@/db/schema");
      for (const s of batchStudents) {
        if (s.userId) {
          await db.insert(notifications).values({
            userId: s.userId,
            title: "New Study Material Available",
            message: `"${newMaterial.title}" has been added to your learning resources.`,
            type: "INFO",
            link: "/student",
          });
        }
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "MATERIAL",
      entityId: newMaterial.id,
      details: `Uploaded study material "${newMaterial.title}"`,
    });

    return NextResponse.json({ success: true, material: newMaterial });
  } catch (error: any) {
    console.error("Create material error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload material" }, { status: 500 });
  }
}
