import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { invoices, invoiceItems, students, branches, payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "invoices.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;

    const row = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        studentId: invoices.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        guardianName: students.guardianName,
        guardianPhone: students.guardianPhone,
        branchId: invoices.branchId,
        branchName: branches.name,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        total: invoices.total,
        paidAmount: invoices.paidAmount,
        status: invoices.status,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(branches, eq(invoices.branchId, branches.id))
      .where(eq(invoices.id, parseInt(id)))
      .limit(1);

    if (!row.length) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const invoice = row[0];
    const dueAmount = Math.max(0, Number(invoice.total) - Number(invoice.paidAmount));
    const status = invoice.status === "DUE" && new Date(invoice.dueDate) < new Date() && dueAmount > 0 ? "OVERDUE" : invoice.status;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
    const paymentRows = await db
      .select({
        id: payments.id,
        paymentCode: payments.paymentCode,
        amount: payments.amount,
        method: payments.method,
        paymentDate: payments.paymentDate,
        reference: payments.reference,
        status: payments.status,
        receivedByName: users.name,
      })
      .from(payments)
      .leftJoin(users, eq(payments.receivedBy, users.id))
      .where(eq(payments.invoiceId, invoice.id))
      .orderBy(desc(payments.paymentDate));

    return NextResponse.json({ invoice: { ...invoice, dueAmount, status }, items, payments: paymentRows });
  } catch (error) {
    console.error("Invoice detail error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "invoices.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const data = await req.json();

    const [updated] = await db
      .update(invoices)
      .set({
        status: data.status || undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    await logActivity({ userId: user.id, userName: user.name, action: "UPDATE", entity: "INVOICE", entityId: id, details: `Updated invoice #${id} (status: ${data.status || "fields"})` });
    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 });
  }
}
