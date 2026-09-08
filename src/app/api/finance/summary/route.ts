import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { payments, invoices, expenses } from "@/db/schema";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "finance.reports") && !hasPermission(user, "reports.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allPayments = await db.select().from(payments);
    const allInvoices = await db.select().from(invoices);
    const allExpenses = await db.select().from(expenses);

    const todaysCollection = allPayments
      .filter((p) => p.status === "SUCCESS" && new Date(p.paymentDate) >= startOfDay)
      .reduce((s, p) => s + Number(p.amount), 0);
    const monthlyCollection = allPayments
      .filter((p) => p.status === "SUCCESS" && new Date(p.paymentDate) >= startOfMonth)
      .reduce((s, p) => s + Number(p.amount), 0);
    const monthlyExpenses = allExpenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((s, e) => s + Number(e.amount), 0);

    const activeInvoices = allInvoices.filter((i) => i.status !== "CANCELLED");
    const outstandingDue = activeInvoices
      .filter((i) => (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) >= now)
      .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);
    const overdue = activeInvoices
      .filter((i) => (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) < now)
      .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);

    return NextResponse.json({
      todaysCollection: Number(todaysCollection.toFixed(2)),
      monthlyCollection: Number(monthlyCollection.toFixed(2)),
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      netMonthly: Number((monthlyCollection - monthlyExpenses).toFixed(2)),
      outstandingDue: Number(outstandingDue.toFixed(2)),
      overdue: Number(overdue.toFixed(2)),
    });
  } catch (error) {
    console.error("Finance summary error:", error);
    return NextResponse.json({ error: "Failed to load finance summary" }, { status: 500 });
  }
}
