import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { students, teachers, branches, courses, batches, activityLogs, enrollments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Branch Manager scoping
    const isBranchManager = user.roleName === "BRANCH_MANAGER" && user.branchId;

    // Counts
    const allStudents = await db.select().from(students);
    const filteredStudents = isBranchManager
      ? allStudents.filter((s) => s.branchId === user.branchId)
      : allStudents;
    const totalStudents = filteredStudents.length;
    const activeStudents = filteredStudents.filter((s) => s.status === "ACTIVE").length;

    const allTeachers = await db.select().from(teachers);
    const filteredTeachers = isBranchManager
      ? allTeachers.filter((t) => t.branchId === user.branchId)
      : allTeachers;
    const totalTeachers = filteredTeachers.length;

    const allBranches = await db.select().from(branches);
    const totalBranches = allBranches.length;
    const activeBranches = allBranches.filter((b) => b.status === "ACTIVE").length;

    const allCourses = await db.select().from(courses);
    const totalCourses = allCourses.length;

    const allBatches = await db.select().from(batches);
    const filteredBatches = isBranchManager
      ? allBatches.filter((b) => b.branchId === user.branchId)
      : allBatches;
    const totalBatches = filteredBatches.length;

    // Recent activity logs
    const recentActivity = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(8);

    // Branch breakdown
    const branchStats = allBranches.map((branch) => {
      const branchStuCount = allStudents.filter((s) => s.branchId === branch.id).length;
      const branchTchCount = allTeachers.filter((t) => t.branchId === branch.id).length;
      const branchBtcCount = allBatches.filter((b) => b.branchId === branch.id).length;
      return {
        id: branch.id,
        name: branch.name,
        code: branch.branchCode,
        studentsCount: branchStuCount,
        teachersCount: branchTchCount,
        batchesCount: branchBtcCount,
      };
    });

    // Course enrollment stats
    const courseStats = allCourses.map((c) => {
      const enrolled = filteredStudents.filter((s) => s.courseId === c.id).length;
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        fee: c.fee,
        enrolledCount: enrolled,
      };
    });

    return NextResponse.json({
      summary: {
        totalStudents,
        activeStudents,
        totalTeachers,
        totalBranches,
        activeBranches,
        totalCourses,
        totalBatches,
      },
      branchStats,
      courseStats,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
