import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { admissions, branches, courses, courseLevels, batches, students, enrollments, notifications } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admissions.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");

    const rows = await db
      .select({
        id: admissions.id,
        admissionCode: admissions.admissionCode,
        studentName: admissions.studentName,
        photoUrl: admissions.photoUrl,
        dateOfBirth: admissions.dateOfBirth,
        gender: admissions.gender,
        phone: admissions.phone,
        email: admissions.email,
        guardianName: admissions.guardianName,
        guardianPhone: admissions.guardianPhone,
        guardianEmail: admissions.guardianEmail,
        branchId: admissions.branchId,
        branchName: branches.name,
        courseId: admissions.courseId,
        courseName: courses.name,
        levelId: admissions.levelId,
        levelName: courseLevels.name,
        batchId: admissions.batchId,
        batchName: batches.name,
        admissionDate: admissions.admissionDate,
        notes: admissions.notes,
        status: admissions.status,
        linkedStudentId: admissions.linkedStudentId,
        createdAt: admissions.createdAt,
      })
      .from(admissions)
      .leftJoin(branches, eq(admissions.branchId, branches.id))
      .leftJoin(courses, eq(admissions.courseId, courses.id))
      .leftJoin(courseLevels, eq(admissions.levelId, courseLevels.id))
      .leftJoin(batches, eq(admissions.batchId, batches.id))
      .orderBy(desc(admissions.createdAt));

    let filtered = rows;
    if (user.roleName === "BRANCH_MANAGER" && user.branchId) filtered = filtered.filter((r) => r.branchId === user.branchId);
    else if (branchId && branchId !== "ALL") filtered = filtered.filter((r) => r.branchId === parseInt(branchId));
    if (status && status !== "ALL") filtered = filtered.filter((r) => r.status === status);

    return NextResponse.json({ admissions: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch admissions error:", error);
    return NextResponse.json({ error: "Failed to fetch admissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admissions.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const data = await req.json();
    if (!data.studentName || !data.guardianName || !data.guardianPhone || !data.branchId) {
      return NextResponse.json({ error: "Student name, guardian details, and branch are required" }, { status: 400 });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(admissions);
    const admissionCode = data.admissionCode || `ADM-2026-${String(Number(countRes[0]?.count || 0) + 1).padStart(3, "0")}`;

    const [newAdmission] = await db
      .insert(admissions)
      .values({
        admissionCode,
        studentName: data.studentName,
        photoUrl: data.photoUrl || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || null,
        guardianRelation: data.guardianRelation || "Parent",
        branchId: parseInt(data.branchId),
        courseId: data.courseId ? parseInt(data.courseId) : null,
        levelId: data.levelId ? parseInt(data.levelId) : null,
        batchId: data.batchId ? parseInt(data.batchId) : null,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
        notes: data.notes || null,
        status: "PENDING",
      })
      .returning();

    // Notify admins/branch managers
    const targetUsers = await db.select().from((await import("@/db/schema")).users);
    for (const u of targetUsers) {
      if ((u.roleId === 2 || u.roleId === 3) && (u.branchId === null || u.branchId === newAdmission.branchId)) {
        await db.insert(notifications).values({
          userId: u.id,
          title: "New Admission Application",
          message: `${newAdmission.studentName} applied for admission (${newAdmission.admissionCode}).`,
          type: "INFO",
          link: "/admin/admissions",
        });
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entity: "ADMISSION",
      entityId: newAdmission.id,
      details: `Admission application received for ${newAdmission.studentName} (${newAdmission.admissionCode})`,
    });

    return NextResponse.json({ success: true, admission: newAdmission });
  } catch (error: any) {
    console.error("Create admission error:", error);
    return NextResponse.json({ error: error.message || "Failed to create admission" }, { status: 500 });
  }
}
