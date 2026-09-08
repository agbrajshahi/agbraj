import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { expenses, branches, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "expenses.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = await db
      .select({
        id: expenses.id,
        expenseCode: expenses.expenseCode,
        branchId: expenses.branchId,
        branchName: branches.name,
        category: expenses.category,
        amount: expenses.amount,
        date: expenses.date,
        description: expenses.description,
        attachmentUrl: expenses.attachmentUrl,
        createdByName: users.name,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(branches, eq(expenses.branchId, branches.id))
      .leftJoin(users, eq(expenses.createdBy, users.id))
      .orderBy(desc(expenses.date));

    let filtered = rows;
    if (user.roleName === "BRANCH_MANAGER" && user.branchId) filtered = filtered.filter((r) => r.branchId === user.branchId);
    return NextResponse.json({ expenses: filtered, total: filtered.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "expenses.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data = await req.json();
    if (!data.branchId || !data.category || data.amount === undefined) {
      return NextResponse.json({ error: "Branch, category, and amount are required" }, { status: 400 });
    }

    const lastExp = await db.select({ id: expenses.id }).from(expenses).orderBy(desc(expenses.id)).limit(1);
    const expenseCode = data.expenseCode || `EXP-2026-${String((lastExp[0]?.id || 0) + 1).padStart(3, "0")}`;

    const [expense] = await db
      .insert(expenses)
      .values({
        expenseCode,
        branchId: parseInt(data.branchId),
        category: data.category,
        amount: data.amount.toString(),
        date: data.date ? new Date(data.date) : new Date(),
        description: data.description || null,
        attachmentUrl: data.attachmentUrl || null,
        createdBy: user.id,
      })
      .returning();

    await logActivity({ userId: user.id, userName: user.name, action: "CREATE", entity: "EXPENSE", entityId: expense.id, details: `Recorded expense ${expenseCode} (${data.category})` });
    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record expense" }, { status: 500 });
  }
}
