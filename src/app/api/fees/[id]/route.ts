import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { feeStructures } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "fees.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(feeStructures)
      .set({
        name: data.name,
        feeType: data.feeType,
        amount: data.amount !== undefined ? data.amount.toString() : undefined,
        description: data.description,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(feeStructures.id, parseInt(id)))
      .returning();

    await logActivity({ userId: user.id, userName: user.name, action: "UPDATE", entity: "FEE", entityId: id, details: `Updated fee structure #${id}` });
    return NextResponse.json({ success: true, fee: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update fee" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "fees.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    await db.delete(feeStructures).where(eq(feeStructures.id, parseInt(id)));
    await logActivity({ userId: user.id, userName: user.name, action: "DELETE", entity: "FEE", entityId: id, details: `Deleted fee structure #${id}` });
    return NextResponse.json({ success: true, message: "Fee structure deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete fee" }, { status: 500 });
  }
}
