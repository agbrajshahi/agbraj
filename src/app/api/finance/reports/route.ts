import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { payments, invoices, students, branches, expenses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "finance.reports")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : new Date();
    const branchId = searchParams.get("branchId");
    const method = searchParams.get("method");

    const allPayments = await db.select().from(payments);
    const allInvoices = await db.select().from(invoices);
    const allStudents = await db.select().from(students);
    const allBranches = await db.select().from(branches);
    const allExpenses = await db.select().from(expenses);

    const inRange = (d: Date) => d >= dateFrom && d <= dateTo;

    let paymentsIn = allPayments.filter((p) => inRange(new Date(p.paymentDate)) && p.status === "SUCCESS");
    let expensesIn = allExpenses.filter((e) => inRange(new Date(e.date)));

    const studentBranch = (sid: number) => allStudents.find((s) => s.id === sid)?.branchId ?? null;

    if (branchId && branchId !== "ALL") {
      paymentsIn = paymentsIn.filter((p) => studentBranch(p.studentId) === parseInt(branchId));
      expensesIn = expensesIn.filter((e) => e.branchId === parseInt(branchId));
    }
    if (method && method !== "ALL") paymentsIn = paymentsIn.filter((p) => p.method === method);

    // Daily collection (last 14 days)
    const dailyMap: Record<string, number> = {};
    for (const p of paymentsIn) {
      const key = new Date(p.paymentDate).toISOString().slice(0, 10);
      dailyMap[key] = (dailyMap[key] || 0) + Number(p.amount);
    }
    const dailyCollection = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    // Monthly collection
    const monthMap: Record<string, number> = {};
    for (const p of paymentsIn) {
      const key = new Date(p.paymentDate).toISOString().slice(0, 7);
      monthMap[key] = (monthMap[key] || 0) + Number(p.amount);
    }
    const monthlyCollection = Object.entries(monthMap)
      .map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Yearly collection
    const yearMap: Record<string, number> = {};
    for (const p of paymentsIn) {
      const key = new Date(p.paymentDate).getFullYear().toString();
      yearMap[key] = (yearMap[key] || 0) + Number(p.amount);
    }
    const yearlyCollection = Object.entries(yearMap).map(([year, amount]) => ({ year, amount: Number(amount.toFixed(2)) }));

    // Branch revenue
    const branchRevenue = allBranches.map((b) => {
      const rev = paymentsIn
        .filter((p) => studentBranch(p.studentId) === b.id)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const exp = expensesIn.filter((e) => e.branchId === b.id).reduce((sum, e) => sum + Number(e.amount), 0);
      return { branchId: b.id, branchName: b.name, revenue: Number(rev.toFixed(2)), expenses: Number(exp.toFixed(2)), net: Number((rev - exp).toFixed(2)) };
    });

    // By method
    const methodMap: Record<string, number> = {};
    for (const p of paymentsIn) methodMap[p.method] = (methodMap[p.method] || 0) + Number(p.amount);
    const byMethod = Object.entries(methodMap).map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }));

    // Due / overdue
    const now = new Date();
    const relevantInvoices = allInvoices.filter((i) => {
      if (branchId && branchId !== "ALL" && i.branchId !== parseInt(branchId)) return false;
      return i.status !== "CANCELLED";
    });
    const dueTotal = relevantInvoices
      .filter((i) => (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) >= now)
      .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);
    const overdueTotal = relevantInvoices
      .filter((i) => (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) < now)
      .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);

    // Expense categories
    const categoryMap: Record<string, number> = {};
    for (const e of expensesIn) categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
    const expensesByCategory = Object.entries(categoryMap).map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }));

    const revenue = paymentsIn.reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = expensesIn.reduce((s, e) => s + Number(e.amount), 0);

    return NextResponse.json({
      summary: {
        revenue: Number(revenue.toFixed(2)),
        expenses: Number(totalExpenses.toFixed(2)),
        netRevenue: Number((revenue - totalExpenses).toFixed(2)),
        dueTotal: Number(dueTotal.toFixed(2)),
        overdueTotal: Number(overdueTotal.toFixed(2)),
      },
      dailyCollection,
      monthlyCollection,
      yearlyCollection,
      branchRevenue,
      byMethod,
      expensesByCategory,
    });
  } catch (error) {
    console.error("Finance reports error:", error);
    return NextResponse.json({ error: "Failed to generate financial report" }, { status: 500 });
  }
}
