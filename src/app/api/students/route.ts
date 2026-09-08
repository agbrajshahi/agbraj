import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { students, branches, courses, batches } from "@/db/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "students.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId");
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");

    // Fetch all with relational data
    let query = db
      .select({
        id: students.id,
        studentIdCode: students.studentIdCode,
        name: students.name,
        photoUrl: students.photoUrl,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        phone: students.phone,
        email: students.email,
        address: students.address,
        guardianName: students.guardianName,
        guardianPhone: students.guardianPhone,
        guardianEmail: students.guardianEmail,
        guardianRelation: students.guardianRelation,
        emergencyContact: students.emergencyContact,
        branchId: students.branchId,
        branchName: branches.name,
        courseId: students.courseId,
        courseName: courses.name,
        batchId: students.batchId,
        batchName: batches.name,
        currentLevel: students.currentLevel,
        admissionDate: students.admissionDate,
        status: students.status,
        notes: students.notes,
        createdAt: students.createdAt,
      })
      .from(students)
      .leftJoin(branches, eq(students.branchId, branches.id))
      .leftJoin(courses, eq(students.courseId, courses.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .orderBy(desc(students.id));

    const records = await query;

    // Apply filtering in memory or conditional
    let filtered = records;

    // If branch manager, restrict to user's branch
    if (user.roleName === "BRANCH_MANAGER" && user.branchId) {
      filtered = filtered.filter((s) => s.branchId === user.branchId);
    } else if (branchId && branchId !== "ALL") {
      filtered = filtered.filter((s) => s.branchId === parseInt(branchId));
    }

    if (courseId && courseId !== "ALL") {
      filtered = filtered.filter((s) => s.courseId === parseInt(courseId));
    }

    if (status && status !== "ALL") {
      filtered = filtered.filter((s) => s.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentIdCode.toLowerCase().includes(q) ||
          (s.guardianName && s.guardianName.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
      );
    }

    return NextResponse.json({ students: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "students.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.guardianName || !data.guardianPhone || !data.branchId) {
      return NextResponse.json({ error: "Name, Guardian details, and Branch are required" }, { status: 400 });
    }

    // Auto-generate code if not passed
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(students);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const studentIdCode = data.studentIdCode || `STU-2026-${String(nextNum).padStart(3, "0")}`;

    const [newStudent] = await db
      .insert(students)
      .values({
        studentIdCode,
        name: data.name,
        photoUrl: data.photoUrl || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || "Not Specified",
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || null,
        guardianRelation: data.guardianRelation || "Parent",
        emergencyContact: data.emergencyContact || null,
        branchId: parseInt(data.branchId),
        courseId: data.courseId ? parseInt(data.courseId) : null,
        batchId: data.batchId ? parseInt(data.batchId) : null,
        currentLevel: data.currentLevel || "Foundation Level 1",
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
        status: data.status || "ACTIVE",
        notes: data.notes || null,
      })
      .returning();

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "STUDENT",
      entityId: newStudent.id,
      details: `Created student ${newStudent.name} (${newStudent.studentIdCode})`,
    });

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: error.message || "Failed to create student" }, { status: 500 });
  }
}
