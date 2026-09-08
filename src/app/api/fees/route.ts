import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { feeStructures, courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "fees.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = await db
      .select({
        id: feeStructures.id,
        name: feeStructures.name,
        feeType: feeStructures.feeType,
        courseId: feeStructures.courseId,
        courseName: courses.name,
        amount: feeStructures.amount,
        description: feeStructures.description,
        isActive: feeStructures.isActive,
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .leftJoin(courses, eq(feeStructures.courseId, courses.id))
      .orderBy(desc(feeStructures.id));

    return NextResponse.json({ fees: rows, total: rows.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch fee structures" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "fees.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data = await req.json();
    if (!data.name || !data.feeType || data.amount === undefined) {
      return NextResponse.json({ error: "Name, fee type, and amount are required" }, { status: 400 });
    }

    const [fee] = await db
      .insert(feeStructures)
      .values({
        name: data.name,
        feeType: data.feeType,
        courseId: data.courseId ? parseInt(data.courseId) : null,
        amount: data.amount.toString(),
        description: data.description || null,
        isActive: data.isActive !== false,
      })
      .returning();

    await logActivity({ userId: user.id, userName: user.name, action: "CREATE", entity: "FEE", entityId: fee.id, details: `Created fee structure "${fee.name}"` });
    return NextResponse.json({ success: true, fee });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create fee" }, { status: 500 });
  }
}
