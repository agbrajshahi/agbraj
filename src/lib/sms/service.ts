/**
 * ABACUSUP — SMS Provider Abstraction (Phase 4)
 * SMS_PROVIDER env: console | twilio | bulksmsbd | ssl_wireless | greenweb (Bangladesh providers prepared)
 */
export interface SmsProvider { name: string; send(to: string, message: string): Promise<{ success: boolean; id?: string; error?: string }>; }

class ConsoleSms implements SmsProvider {
  name = "console";
  async send(to: string, message: string) { if (process.env.NODE_ENV !== "production") console.log(`[sms:console] → ${to}: ${message}`); return { success: true, id: `console-${Date.now()}` }; }
}

/** Generic HTTP provider used for Bangladesh gateways (BulkSMSBD, SSL Wireless, GreenWeb) and Twilio-like APIs. */
class HttpSms implements SmsProvider {
  constructor(public name: string, private buildRequest: (to: string, msg: string) => { url: string; init: RequestInit } | null) {}
  async send(to: string, message: string) {
    const req = this.buildRequest(to, message);
    if (!req) return { success: false, error: `${this.name} credentials not configured` };
    try { const res = await fetch(req.url, req.init); return res.ok ? { success: true, id: `${this.name}-${Date.now()}` } : { success: false, error: `HTTP ${res.status}` }; }
    catch (e: any) { return { success: false, error: e.message }; }
  }
}

export function getSmsProvider(): SmsProvider {
  const p = (process.env.SMS_PROVIDER || "console").toLowerCase();
  if (p === "bulksmsbd") return new HttpSms("bulksmsbd", (to, msg) => process.env.BULKSMSBD_API_KEY ? { url: `https://bulksmsbd.net/api/smsapi?api_key=${process.env.BULKSMSBD_API_KEY}&type=text&number=${encodeURIComponent(to)}&senderid=${process.env.SMS_SENDER_ID || ""}&message=${encodeURIComponent(msg)}`, init: { method: "GET" } } : null);
  if (p === "ssl_wireless") return new HttpSms("ssl_wireless", (to, msg) => process.env.SSL_SMS_API_TOKEN ? { url: "https://smsplus.sslwireless.com/api/v3/send-sms", init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_token: process.env.SSL_SMS_API_TOKEN, sid: process.env.SMS_SENDER_ID, msisdn: to, sms: msg, csms_id: `${Date.now()}` }) } } : null);
  if (p === "greenweb") return new HttpSms("greenweb", (to, msg) => process.env.GREENWEB_TOKEN ? { url: "https://api.greenweb.com.bd/api.php", init: { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: process.env.GREENWEB_TOKEN, to, message: msg }).toString() } } : null);
  if (p === "twilio") return new HttpSms("twilio", (to, msg) => process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN ? { url: `https://api.twilio.com/2010-04-01/Accounts/${process.env.SMS_ACCOUNT_SID}/Messages.json`, init: { method: "POST", headers: { Authorization: "Basic " + Buffer.from(`${process.env.SMS_ACCOUNT_SID}:${process.env.SMS_AUTH_TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ To: to, From: process.env.SMS_FROM_NUMBER || "", Body: msg }).toString() } } : null);
  return new ConsoleSms();
}

export async function sendSms(to: string | null | undefined, message: string) {
  if (!to) return { success: false, error: "No recipient" };
  try { return await getSmsProvider().send(to, message); } catch (e: any) { return { success: false, error: e.message }; }
}
