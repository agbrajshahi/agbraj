import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { payments, invoices, students, branches, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "payments.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;

    const rows = await db
      .select({
        id: payments.id,
        paymentCode: payments.paymentCode,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        invoiceTotal: invoices.total,
        paidAmount: invoices.paidAmount,
        studentId: payments.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        guardianName: students.guardianName,
        guardianPhone: students.guardianPhone,
        branchName: branches.name,
        amount: payments.amount,
        method: payments.method,
        paymentDate: payments.paymentDate,
        reference: payments.reference,
        notes: payments.notes,
        receivedByName: users.name,
        status: payments.status,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(branches, eq(invoices.branchId, branches.id))
      .leftJoin(users, eq(payments.receivedBy, users.id))
      .where(eq(payments.id, parseInt(id)))
      .limit(1);

    if (!rows.length) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const p = rows[0];
    const dueAmount = Math.max(0, Number(p.invoiceTotal) - Number(p.paidAmount));
    return NextResponse.json({
      receipt: {
        ...p,
        amount: Number(p.amount).toFixed(2),
        invoiceTotal: Number(p.invoiceTotal).toFixed(2),
        paidAmount: Number(p.paidAmount).toFixed(2),
        dueAmount: dueAmount.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Receipt fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
  }
}
