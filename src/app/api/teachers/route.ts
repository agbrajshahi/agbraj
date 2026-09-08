import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { teachers, branches, batches } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "teachers.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const teacherRecords = await db
      .select({
        id: teachers.id,
        teacherIdCode: teachers.teacherIdCode,
        name: teachers.name,
        email: teachers.email,
        phone: teachers.phone,
        address: teachers.address,
        qualification: teachers.qualification,
        experience: teachers.experience,
        joiningDate: teachers.joiningDate,
        branchId: teachers.branchId,
        branchName: branches.name,
        bio: teachers.bio,
        photoUrl: teachers.photoUrl,
        status: teachers.status,
        createdAt: teachers.createdAt,
      })
      .from(teachers)
      .leftJoin(branches, eq(teachers.branchId, branches.id))
      .orderBy(desc(teachers.id));

    let filtered = teacherRecords;

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((t) => t.branchId === user.branchId);
    } else if (branchId && branchId !== "ALL") {
      filtered = filtered.filter((t) => t.branchId === parseInt(branchId));
    }

    if (status && status !== "ALL") {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.teacherIdCode.toLowerCase().includes(q) ||
          (t.qualification && t.qualification.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ teachers: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch teachers error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "teachers.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.email || !data.phone || !data.branchId) {
      return NextResponse.json({ error: "Name, email, phone, and branch are required" }, { status: 400 });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(teachers);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const teacherIdCode = data.teacherIdCode || `TCH-2026-${String(nextNum).padStart(3, "0")}`;

    const [newTeacher] = await db
      .insert(teachers)
      .values({
        teacherIdCode,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        qualification: data.qualification || null,
        experience: data.experience || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        branchId: parseInt(data.branchId),
        bio: data.bio || null,
        photoUrl: data.photoUrl || null,
        status: data.status || "ACTIVE",
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "TEACHER",
      entityId: newTeacher.id,
      details: `Created teacher record ${newTeacher.name} (${newTeacher.teacherIdCode})`,
    });

    return NextResponse.json({ success: true, teacher: newTeacher });
  } catch (error: any) {
    console.error("Create teacher error:", error);
    return NextResponse.json({ error: error.message || "Failed to create teacher" }, { status: 500 });
  }
}
