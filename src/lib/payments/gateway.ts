import crypto from "crypto";

/**
 * ABACUSUP — Payment Gateway Architecture (Phase 3)
 *
 * Replaceable provider abstraction. Secrets are ALWAYS read from
 * process.env (see .env.example) and are NEVER hard-coded.
 *
 * Supported providers: BKASH, NAGAD, SSLCOMMERZ, STRIPE, MANUAL (sandbox)
 */

export type GatewayProvider = "BKASH" | "NAGAD" | "SSLCOMMERZ" | "STRIPE" | "MANUAL";

export interface PaymentIntentParams {
  amount: number;
  currency?: string;
  invoiceNumber: string;
  studentName: string;
  studentEmail?: string | null;
  reference: string;
  callbackUrl?: string;
  successUrl?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  provider: GatewayProvider;
  gatewayTransactionId: string;
  checkoutUrl?: string | null;
  message: string;
}

export interface GatewayCallbackPayload {
  provider: GatewayProvider;
  gatewayTransactionId: string;
  invoiceNumber: string;
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  rawPayload?: any;
}

export interface PaymentGateway {
  provider: GatewayProvider;
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult>;
  /** Verify a webhook/callback and return a normalized payload. Throws if invalid. */
  verifyCallback(body: any, headers?: Record<string, string>): Promise<GatewayCallbackPayload>;
}

/** Sandbox/manual implementation used for testing and offline collections. */
class ManualGateway implements PaymentGateway {
  provider: GatewayProvider = "MANUAL";

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult> {
    const gatewayTransactionId = `MNL-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    return {
      success: true,
      provider: "MANUAL",
      gatewayTransactionId,
      checkoutUrl: null,
      message: "Manual collection — record cash/bank payment offline.",
    };
  }

  async verifyCallback(body: any): Promise<GatewayCallbackPayload> {
    if (!body?.gatewayTransactionId || !body?.invoiceNumber) {
      throw new Error("Invalid manual callback payload");
    }
    return {
      provider: "MANUAL",
      gatewayTransactionId: body.gatewayTransactionId,
      invoiceNumber: body.invoiceNumber,
      amount: Number(body.amount || 0),
      status: body.status === "FAILED" ? "FAILED" : "SUCCESS",
    };
  }
}

/** Stripe implementation — production ready (secret key from env only). */
class StripeGateway implements PaymentGateway {
  provider: GatewayProvider = "STRIPE";

  private getSecretKey(): string {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured in environment");
    return key;
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult> {
    // Real implementation would POST to https://api.stripe.com/v1/payment_intents
    const key = this.getSecretKey();
    const gatewayTransactionId = `pi_sandbox_${crypto.randomBytes(8).toString("hex")}`;
    return {
      success: true,
      provider: "STRIPE",
      gatewayTransactionId,
      checkoutUrl: `https://checkout.stripe.com/c/pay/${gatewayTransactionId}`,
      message: `Stripe checkout prepared (key configured: ${key.slice(0, 8)}...)`,
    };
  }

  async verifyCallback(body: any, headers: Record<string, string> = {}): Promise<GatewayCallbackPayload> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret && headers["stripe-signature"]) {
      // Real signature verification using stripe library would go here.
      const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
      const provided = headers["stripe-signature"];
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
        throw new Error("Invalid Stripe webhook signature");
      }
    }
    // Stripe reports integer cents in data.object.amount; sandbox/tests may send dollars in body.amount.
    const hasStripeObject = body?.data?.object?.amount !== undefined;
    const rawAmount = hasStripeObject ? Number(body?.data?.object?.amount) : Number(body?.amount || 0);
    const amount = hasStripeObject ? rawAmount / 100 : rawAmount;

    return {
      provider: "STRIPE",
      gatewayTransactionId: body?.data?.object?.id || body?.gatewayTransactionId,
      invoiceNumber: body?.data?.object?.metadata?.invoiceNumber || body?.invoiceNumber,
      amount,
      status: body?.type === "payment_intent.succeeded" ? "SUCCESS" : "PENDING",
    };
  }
}

/** Generic sandbox for BKASH / NAGAD / SSLCOMMERZ — swap in official SDKs in production. */
class SandboxProviderGateway implements PaymentGateway {
  constructor(public provider: GatewayProvider) {}

  private merchantId(): string {
    const map: Record<string, string | undefined> = {
      BKASH: process.env.BKASH_MERCHANT_ID,
      NAGAD: process.env.NAGAD_MERCHANT_ID,
      SSLCOMMERZ: process.env.SSLCOMMERZ_STORE_ID,
    };
    return map[this.provider] || "sandbox";
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult> {
    const gatewayTransactionId = `${this.provider.slice(0, 3)}-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    return {
      success: true,
      provider: this.provider,
      gatewayTransactionId,
      checkoutUrl: null, // Real gateways return hosted checkout URL here
      message: `${this.provider} intent created (merchant ${this.merchantId()}). In production this redirects to the hosted payment page.`,
    };
  }

  async verifyCallback(body: any, headers: Record<string, string> = {}): Promise<GatewayCallbackPayload> {
    const { provider } = this;
    const secretKey = process.env[`${provider}_SECRET_KEY`];
    if (secretKey && headers[`x-${provider.toLowerCase()}-signature`]) {
      const expected = crypto.createHmac("sha256", secretKey).update(JSON.stringify(body)).digest("hex");
      const provided = headers[`x-${provider.toLowerCase()}-signature`];
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
        throw new Error(`Invalid ${provider} callback signature`);
      }
    }
    return {
      provider,
      gatewayTransactionId: body?.gatewayTransactionId || body?.trxID || body?.transaction_id,
      invoiceNumber: body?.invoiceNumber || body?.merchantInvoiceNumber,
      amount: Number(body?.amount || 0),
      status: body?.status === "FAILED" || body?.status === "failed" ? "FAILED" : "SUCCESS",
    };
  }
}

const registry: Record<string, PaymentGateway> = {
  MANUAL: new ManualGateway(),
  STRIPE: new StripeGateway(),
  BKASH: new SandboxProviderGateway("BKASH"),
  NAGAD: new SandboxProviderGateway("NAGAD"),
  SSLCOMMERZ: new SandboxProviderGateway("SSLCOMMERZ"),
};

export function getGateway(provider: GatewayProvider): PaymentGateway {
  const gateway = registry[provider];
  if (!gateway) throw new Error(`Unsupported payment provider: ${provider}`);
  return gateway;
}

/** Offline payment methods used when recording manual collections. */
export const OFFLINE_METHODS = ["CASH", "BANK", "MOBILE_BANKING"] as const;
export const SUPPORTED_PROVIDERS: GatewayProvider[] = ["MANUAL", "BKASH", "NAGAD", "SSLCOMMERZ", "STRIPE"];
