import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, students } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getGateway, GatewayProvider } from "@/lib/payments/gateway";
import { logActivity } from "@/lib/auth";

/**
 * Gateway webhook/callback endpoint.
 * - Validates provider signature when a secret is configured.
 * - Idempotent: duplicate gatewayTransactionId callbacks are safely ignored.
 * - Payment + invoice update run inside a single DB transaction.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const provider = (body?.provider || "STRIPE") as GatewayProvider;
    const gateway = getGateway(provider);

    // Signature validation (throws on invalid signature when secret configured)
    const verified = await gateway.verifyCallback(body, Object.fromEntries(req.headers));

    if (verified.status !== "SUCCESS") {
      return NextResponse.json({ success: false, message: "Payment not successful" }, { status: 200 });
    }
    if (!verified.gatewayTransactionId || !verified.invoiceNumber) {
      return NextResponse.json({ error: "Missing transaction identifiers" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Duplicate prevention
      const dup = await tx
        .select()
        .from(payments)
        .where(eq(payments.gatewayTransactionId, verified.gatewayTransactionId))
        .limit(1);
      if (dup.length > 0) {
        return { duplicated: true, payment: dup[0] };
      }

      const invoiceRow = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, verified.invoiceNumber))
        .limit(1);
      if (!invoiceRow.length) {
        throw new Error(`Invoice ${verified.invoiceNumber} not found`);
      }
      const invoice = invoiceRow[0];
      if (invoice.status === "CANCELLED") {
        throw new Error("Invoice is cancelled — refusing payment");
      }

      // Validate amount: gateway amount must not exceed remaining balance by more than 0.01
      const remaining = Number(invoice.total) - Number(invoice.paidAmount);
      if (Number(verified.amount) > remaining + 0.01) {
        throw new Error("Gateway amount exceeds outstanding balance");
      }

      const lastPay = await tx.select({ id: payments.id }).from(payments).orderBy(desc(payments.id)).limit(1);
      const paymentCode = `PAY-2026-${String(3001 + (lastPay[0]?.id || 0)).padStart(4, "0")}`;

      const [payment] = await tx
        .insert(payments)
        .values({
          paymentCode,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount: Number(verified.amount).toFixed(2),
          method: "ONLINE",
          paymentDate: new Date(),
          reference: `Gateway ${provider} • ${verified.gatewayTransactionId}`,
          gatewayTransactionId: verified.gatewayTransactionId,
          gatewayProvider: provider,
          status: "SUCCESS",
        })
        .returning();

      const newPaid = Number(invoice.paidAmount) + Number(verified.amount);
      const newStatus = newPaid >= Number(invoice.total) - 0.01 ? "PAID" : "PARTIAL";
      await tx
        .update(invoices)
        .set({ paidAmount: newPaid.toFixed(2), status: newStatus, updatedAt: new Date() })
        .where(eq(invoices.id, invoice.id));

      return { duplicated: false, payment };
    });

    if (result.duplicated) {
      return NextResponse.json({ success: true, duplicated: true, message: "Callback already processed — ignored." });
    }

    const stu = await db.select().from(students).where(eq(students.id, result.payment.studentId)).limit(1);
    await logActivity({
      userName: `Gateway (${provider})`,
      action: "CREATE",
      entity: "PAYMENT",
      entityId: result.payment.id,
      details: `Online payment of $${result.payment.amount} via ${provider} (${verified.gatewayTransactionId})`,
    });

    return NextResponse.json({ success: true, payment: result.payment });
  } catch (error: any) {
    console.error("Gateway callback error:", error);
    return NextResponse.json({ error: error.message || "Callback processing failed" }, { status: 400 });
  }
}
