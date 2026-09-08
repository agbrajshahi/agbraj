import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { courseLevels, courses } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "courses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const rows = await db
      .select({
        id: courseLevels.id,
        name: courseLevels.name,
        courseId: courseLevels.courseId,
        courseName: courses.name,
        levelNumber: courseLevels.levelNumber,
        durationWeeks: courseLevels.durationWeeks,
      })
      .from(courseLevels)
      .leftJoin(courses, eq(courseLevels.courseId, courses.id))
      .orderBy(asc(courseLevels.levelNumber));

    const filtered = courseId && courseId !== "ALL" ? rows.filter((r) => r.courseId === parseInt(courseId)) : rows;
    return NextResponse.json({ levels: filtered, total: filtered.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch course levels" }, { status: 500 });
  }
}
