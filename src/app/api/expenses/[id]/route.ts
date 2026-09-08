import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "expenses.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(expenses)
      .set({
        category: data.category,
        amount: data.amount !== undefined ? data.amount.toString() : undefined,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description,
        attachmentUrl: data.attachmentUrl,
      })
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    await logActivity({ userId: user.id, userName: user.name, action: "UPDATE", entity: "EXPENSE", entityId: id, details: `Updated expense #${id}` });
    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "expenses.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    await db.delete(expenses).where(eq(expenses.id, parseInt(id)));
    await logActivity({ userId: user.id, userName: user.name, action: "DELETE", entity: "EXPENSE", entityId: id, details: `Deleted expense #${id}` });
    return NextResponse.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
