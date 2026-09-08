import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { branches, students, teachers, batches, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "branches.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allBranches = await db.select().from(branches).orderBy(desc(branches.id));
    const allStudents = await db.select().from(students);
    const allTeachers = await db.select().from(teachers);
    const allBatches = await db.select().from(batches);

    const enriched = allBranches.map((b) => ({
      ...b,
      studentCount: allStudents.filter((s) => s.branchId === b.id).length,
      teacherCount: allTeachers.filter((t) => t.branchId === b.id).length,
      batchCount: allBatches.filter((batch) => batch.branchId === b.id).length,
    }));

    // If branch manager, filter to own branch only
    const filtered =
      user.roleName === "BRANCH_MANAGER" && user.branchId
        ? enriched.filter((b) => b.id === user.branchId)
        : enriched;

    return NextResponse.json({ branches: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch branches error:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "branches.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.phone || !data.email || !data.address || !data.city) {
      return NextResponse.json({ error: "Name, phone, email, address, and city are required" }, { status: 400 });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(branches);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const branchCode = data.branchCode || `BR-LOC-${String(nextNum).padStart(2, "0")}`;

    const [newBranch] = await db
      .insert(branches)
      .values({
        branchCode,
        name: data.name,
        logoUrl: data.logoUrl || null,
        managerId: data.managerId ? parseInt(data.managerId) : null,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        openingDate: data.openingDate ? new Date(data.openingDate) : new Date(),
        status: data.status || "ACTIVE",
        description: data.description || null,
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "BRANCH",
      entityId: newBranch.id,
      details: `Created new branch ${newBranch.name} (${newBranch.branchCode})`,
    });

    return NextResponse.json({ success: true, branch: newBranch });
  } catch (error: any) {
    console.error("Create branch error:", error);
    return NextResponse.json({ error: error.message || "Failed to create branch" }, { status: 500 });
  }
}
