import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { payments, invoices, students, branches, expenses, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["ACCOUNTANT", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"].includes(user.roleName)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const allPayments = await db.select().from(payments);
    const allInvoices = await db.select().from(invoices);
    const allExpenses = await db.select().from(expenses);
    const allStudents = await db.select().from(students);
    const allBranches = await db.select().from(branches);

    const scopeBranch = user.roleName === "BRANCH_MANAGER" ? user.branchId : null;
    const branchIds = new Set(allStudents.filter((s) => (scopeBranch ? s.branchId === scopeBranch : true)).map((s) => s.id));

    const paymentsScoped = allPayments.filter((p) => p.status === "SUCCESS" && branchIds.has(p.studentId));
    const invoicesScoped = allInvoices.filter((i) => (scopeBranch ? i.branchId === scopeBranch : true) && i.status !== "CANCELLED");
    const expensesScoped = allExpenses.filter((e) => (scopeBranch ? e.branchId === scopeBranch : true));

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    const todaysCollection = sum(paymentsScoped.filter((p) => new Date(p.paymentDate) >= startOfDay).map((p) => Number(p.amount)));
    const monthlyCollection = sum(paymentsScoped.filter((p) => new Date(p.paymentDate) >= startOfMonth).map((p) => Number(p.amount)));
    const yearlyCollection = sum(paymentsScoped.filter((p) => new Date(p.paymentDate) >= startOfYear).map((p) => Number(p.amount)));
    const monthlyExpenses = sum(expensesScoped.filter((e) => new Date(e.date) >= startOfMonth).map((e) => Number(e.amount)));

    const due = invoicesScoped
      .filter((i) => (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) >= now)
      .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);
    const overdue = invoicesScoped
      .filter((i) => (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) < now)
      .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);

    const recentPayments = await db
      .select({
        id: payments.id,
        paymentCode: payments.paymentCode,
        invoiceNumber: invoices.invoiceNumber,
        studentName: students.name,
        amount: payments.amount,
        method: payments.method,
        paymentDate: payments.paymentDate,
        receivedByName: users.name,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(users, eq(payments.receivedBy, users.id))
      .orderBy(desc(payments.paymentDate))
      .limit(10);

    return NextResponse.json({
      kpis: {
        todaysCollection: Number(todaysCollection.toFixed(2)),
        monthlyCollection: Number(monthlyCollection.toFixed(2)),
        yearlyCollection: Number(yearlyCollection.toFixed(2)),
        monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
        netMonthly: Number((monthlyCollection - monthlyExpenses).toFixed(2)),
        due: Number(due.toFixed(2)),
        overdue: Number(overdue.toFixed(2)),
      },
      branchCount: scopeBranch ? 1 : allBranches.length,
      recentPayments,
    });
  } catch (error) {
    console.error("Accountant dashboard error:", error);
    return NextResponse.json({ error: "Failed to load accountant dashboard" }, { status: 500 });
  }
}
