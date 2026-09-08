import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { branches, students, teachers, batches, courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "branches.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const branchId = parseInt(id);

    if (user.roleName === "BRANCH_MANAGER" && user.branchId && user.branchId !== branchId) {
      return NextResponse.json({ error: "Access denied to other branch details" }, { status: 403 });
    }

    const branchRows = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1);
    if (!branchRows.length) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const branch = branchRows[0];
    const branchStudents = await db.select().from(students).where(eq(students.branchId, branchId)).orderBy(desc(students.id));
    const branchTeachers = await db.select().from(teachers).where(eq(teachers.branchId, branchId));
    const branchBatches = await db.select().from(batches).where(eq(batches.branchId, branchId));
    const allCourses = await db.select().from(courses);

    // Performance metrics
    const activeStudents = branchStudents.filter((s) => s.status === "ACTIVE").length;
    const activeBatches = branchBatches.filter((b) => b.status === "ONGOING").length;
    const totalCapacity = branchBatches.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const capacityUtilization = totalCapacity > 0 ? Math.round((branchStudents.length / totalCapacity) * 100) : 0;

    return NextResponse.json({
      branch,
      students: branchStudents,
      teachers: branchTeachers,
      batches: branchBatches,
      courses: allCourses,
      performance: {
        activeStudents,
        totalStudents: branchStudents.length,
        totalTeachers: branchTeachers.length,
        totalBatches: branchBatches.length,
        activeBatches,
        capacityUtilization,
      },
    });
  } catch (error) {
    console.error("Branch detail error:", error);
    return NextResponse.json({ error: "Failed to fetch branch details" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "branches.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const branchId = parseInt(id);
    const data = await req.json();

    const [updated] = await db
      .update(branches)
      .set({
        name: data.name,
        logoUrl: data.logoUrl,
        managerId: data.managerId ? parseInt(data.managerId) : null,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        status: data.status,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      entity: "BRANCH",
      entityId: branchId,
      details: `Updated branch ${updated.name}`,
    });

    return NextResponse.json({ success: true, branch: updated });
  } catch (error: any) {
    console.error("Update branch error:", error);
    return NextResponse.json({ error: error.message || "Failed to update branch" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "branches.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const branchId = parseInt(id);

    const [deleted] = await db.delete(branches).where(eq(branches.id, branchId)).returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "BRANCH",
      entityId: branchId,
      details: `Deleted branch ${deleted?.name || branchId}`,
    });

    return NextResponse.json({ success: true, message: "Branch deleted successfully" });
  } catch (error) {
    console.error("Delete branch error:", error);
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}
