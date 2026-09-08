import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { payments, invoices, students, branches, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notifyRoles, notifyUsers } from "@/lib/notifications/notify";
import { sendTemplatedEmail } from "@/lib/email/service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "payments.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const method = searchParams.get("method");
    const branchId = searchParams.get("branchId");

    const rows = await db
      .select({
        id: payments.id,
        paymentCode: payments.paymentCode,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        studentId: payments.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        branchId: students.branchId,
        branchName: branches.name,
        amount: payments.amount,
        method: payments.method,
        paymentDate: payments.paymentDate,
        reference: payments.reference,
        notes: payments.notes,
        receivedByName: users.name,
        gatewayTransactionId: payments.gatewayTransactionId,
        gatewayProvider: payments.gatewayProvider,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(branches, eq(students.branchId, branches.id))
      .leftJoin(users, eq(payments.receivedBy, users.id))
      .orderBy(desc(payments.paymentDate));

    let filtered = rows;
    if (user.roleName === "BRANCH_MANAGER" && user.branchId) filtered = filtered.filter((r) => r.branchId === user.branchId);
    if (branchId && branchId !== "ALL") filtered = filtered.filter((r) => r.branchId === parseInt(branchId));
    if (method && method !== "ALL") filtered = filtered.filter((r) => r.method === method);

    return NextResponse.json({ payments: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

/**
 * Record a payment against an invoice.
 * - Duplicate prevention: gatewayTransactionId must be unique; if a payment with the
 *   same gateway transaction already exists, the existing record is returned (idempotent).
 * - Invoice paidAmount and status are updated inside a DB transaction.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "payments.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data = await req.json();
    if (!data.invoiceId || data.amount === undefined) {
      return NextResponse.json({ error: "Invoice and amount are required" }, { status: 400 });
    }
    const amount = Number(data.amount);
    if (amount <= 0) return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });

    const invoiceRow = await db.select().from(invoices).where(eq(invoices.id, parseInt(data.invoiceId))).limit(1);
    if (!invoiceRow.length) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const invoice = invoiceRow[0];
    if (invoice.status === "CANCELLED") return NextResponse.json({ error: "Cannot record payment on a cancelled invoice" }, { status: 400 });

    // Duplicate prevention first — identical gateway transactions are ignored (idempotent)
    if (data.gatewayTransactionId) {
      const existingGw = await db.select().from(payments).where(eq(payments.gatewayTransactionId, data.gatewayTransactionId)).limit(1);
      if (existingGw.length > 0) {
        return NextResponse.json({ success: true, payment: existingGw[0], duplicated: true });
      }
    }

    const alreadyPaid = Number(invoice.paidAmount);
    const total = Number(invoice.total);
    const remaining = total - alreadyPaid;
    if (amount > remaining + 0.01) {
      return NextResponse.json({ error: `Amount exceeds outstanding balance of $${remaining.toFixed(2)}` }, { status: 400 });
    }

    const lastPay = await db.select({ id: payments.id }).from(payments).orderBy(desc(payments.id)).limit(1);
    const paymentCode = data.paymentCode || `PAY-2026-${String(3001 + (lastPay[0]?.id || 0)).padStart(4, "0")}`;

    const result = await db.transaction(async (tx) => {
      // Idempotency check for gateway payments
      if (data.gatewayTransactionId) {
        const dup = await tx
          .select()
          .from(payments)
          .where(eq(payments.gatewayTransactionId, data.gatewayTransactionId))
          .limit(1);
        if (dup.length > 0) {
          return { duplicated: true, payment: dup[0] };
        }
      }

      const [payment] = await tx
        .insert(payments)
        .values({
          paymentCode,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount: amount.toFixed(2),
          method: data.method || "CASH",
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          reference: data.reference || null,
          notes: data.notes || null,
          receivedBy: user.id,
          gatewayTransactionId: data.gatewayTransactionId || null,
          gatewayProvider: data.gatewayProvider || null,
          status: data.status || "SUCCESS",
        })
        .returning();

      const newPaid = alreadyPaid + amount;
      const newStatus = newPaid >= total - 0.01 ? "PAID" : "PARTIAL";
      await tx
        .update(invoices)
        .set({ paidAmount: newPaid.toFixed(2), status: newStatus, updatedAt: new Date() })
        .where(eq(invoices.id, invoice.id));

      return { duplicated: false, payment };
    });

    await logActivity({
      userId: user.id, userName: user.name, action: "CREATE", entity: "PAYMENT", entityId: result.payment.id,
      details: result.duplicated
        ? `Duplicate gateway payment ignored (${data.gatewayTransactionId})`
        : `Recorded payment ${paymentCode} of $${amount.toFixed(2)} on invoice ${invoice.invoiceNumber}`,
    });

    if (!result.duplicated) {
      const stu = await db.select().from(students).where(eq(students.id, invoice.studentId)).limit(1);
      await notifyRoles(["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"], "PAYMENT", "Payment received", `$${amount.toFixed(2)} received on ${invoice.invoiceNumber} (${data.method || "CASH"})`, `/admin/receipts/${result.payment.id}`);
      if (stu[0]?.userId) await notifyUsers([stu[0].userId], "PAYMENT", "Payment confirmed", `We received $${amount.toFixed(2)} against ${invoice.invoiceNumber}. Thank you!`, "/student");
      await sendTemplatedEmail(stu[0]?.guardianEmail, "PAYMENT_RECEIPT", { paymentCode, amount: amount.toFixed(2), invoiceNumber: invoice.invoiceNumber, method: data.method || "CASH", studentName: stu[0]?.name });
    }

    return NextResponse.json({ success: true, payment: result.payment, duplicated: result.duplicated });
  } catch (error: any) {
    console.error("Record payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
