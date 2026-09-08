import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { courses, courseLevels, courseModules, courseLessons } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "courses.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const courseId = parseInt(id);

    const courseRows = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!courseRows.length) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const course = courseRows[0];

    // Hierarchy: Levels -> Modules -> Lessons
    const levels = await db.select().from(courseLevels).where(eq(courseLevels.courseId, courseId)).orderBy(asc(courseLevels.levelNumber));
    const allModules = await db.select().from(courseModules).orderBy(asc(courseModules.moduleNumber));
    const allLessons = await db.select().from(courseLessons).orderBy(asc(courseLessons.lessonNumber));

    const curriculum = levels.map((lvl) => {
      const lvlModules = allModules.filter((m) => m.levelId === lvl.id);
      const modulesWithLessons = lvlModules.map((mod) => {
        const modLessons = allLessons.filter((l) => l.moduleId === mod.id);
        return {
          ...mod,
          lessons: modLessons,
        };
      });
      return {
        ...lvl,
        modules: modulesWithLessons,
      };
    });

    return NextResponse.json({
      course,
      curriculum,
    });
  } catch (error) {
    console.error("Course hierarchy error:", error);
    return NextResponse.json({ error: "Failed to fetch course details" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "courses.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const courseId = parseInt(id);
    const data = await req.json();

    const [updated] = await db
      .update(courses)
      .set({
        name: data.name,
        description: data.description,
        duration: data.duration,
        fee: data.fee ? data.fee.toString() : undefined,
        targetAge: data.targetAge,
        status: data.status,
        thumbnailUrl: data.thumbnailUrl,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "COURSE",
      entityId: courseId,
      details: `Updated course ${updated.name}`,
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (error: any) {
    console.error("Update course error:", error);
    return NextResponse.json({ error: error.message || "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "courses.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const courseId = parseInt(id);

    const [deleted] = await db.delete(courses).where(eq(courses.id, courseId)).returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "COURSE",
      entityId: courseId,
      details: `Deleted course ${deleted?.name || courseId}`,
    });

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
