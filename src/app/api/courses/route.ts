import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { courses, courseLevels, courseModules, courseLessons } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "courses.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allCourses = await db.select().from(courses).orderBy(desc(courses.id));
    const allLevels = await db.select().from(courseLevels);

    const enriched = allCourses.map((c) => {
      const levels = allLevels.filter((l) => l.courseId === c.id);
      return {
        ...c,
        levelsCount: levels.length,
      };
    });

    return NextResponse.json({ courses: enriched, total: enriched.length });
  } catch (error) {
    console.error("Fetch courses error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "courses.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.duration || !data.fee) {
      return NextResponse.json({ error: "Name, duration, and fee are required" }, { status: 400 });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(courses);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const code = data.code || `CRS-${String(nextNum).padStart(3, "0")}`;

    const [newCourse] = await db
      .insert(courses)
      .values({
        code,
        name: data.name,
        description: data.description || "",
        duration: data.duration,
        fee: data.fee.toString(),
        targetAge: data.targetAge || "5-14 years",
        status: data.status || "ACTIVE",
        thumbnailUrl: data.thumbnailUrl || null,
      })
      .returning();

    // Optionally create Level 1 Foundation
    await db.insert(courseLevels).values({
      courseId: newCourse.id,
      levelNumber: 1,
      name: `Level 1: Introduction to ${newCourse.name}`,
      description: "Fundamental principles and practice drills",
      durationWeeks: 4,
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "COURSE",
      entityId: newCourse.id,
      details: `Created new course ${newCourse.name} (${newCourse.code})`,
    });

    return NextResponse.json({ success: true, course: newCourse });
  } catch (error: any) {
    console.error("Create course error:", error);
    return NextResponse.json({ error: error.message || "Failed to create course" }, { status: 500 });
  }
}
