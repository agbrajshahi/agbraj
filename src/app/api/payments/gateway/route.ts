import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { paymentGatewayConfigs } from "@/db/schema";
import { getGateway, GatewayProvider } from "@/lib/payments/gateway";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "payments.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const configs = await db.select().from(paymentGatewayConfigs);
    // Environment readiness flags (booleans only — never expose secret values)
    const envStatus: Record<string, boolean> = {
      STRIPE: !!process.env.STRIPE_SECRET_KEY,
      BKASH: !!process.env.BKASH_SECRET_KEY,
      NAGAD: !!process.env.NAGAD_SECRET_KEY,
      SSLCOMMERZ: !!process.env.SSLCOMMERZ_STORE_PASSWORD,
    };

    return NextResponse.json({
      gateways: configs.map((c) => ({
        ...c,
        envConfigured: envStatus[c.provider] ?? false,
      })),
    });
  } catch (error) {
    console.error("Gateway config fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch gateway configs" }, { status: 500 });
  }
}

/** Create a payment intent via the selected provider (secrets stay in .env). */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "payments.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const provider = (data.provider || "MANUAL") as GatewayProvider;

    const gateway = getGateway(provider);
    const intent = await gateway.createPaymentIntent({
      amount: Number(data.amount),
      currency: data.currency || "USD",
      invoiceNumber: data.invoiceNumber,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      reference: data.reference,
      callbackUrl: data.callbackUrl,
    });

    return NextResponse.json({ success: intent.success, intent });
  } catch (error: any) {
    console.error("Gateway intent error:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment intent" }, { status: 500 });
  }
}
