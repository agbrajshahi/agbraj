"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Loader2, Plus, CheckCircle2, Banknote, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function InvoiceDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", method: "CASH", provider: "STRIPE", reference: "", notes: "" });

  useEffect(() => { fetchInvoice(); }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load invoice");
      setData(d);
      setPayForm((p) => ({ ...p, amount: d.invoice.dueAmount.toFixed(2) }));
    } catch (err: any) { toast(err.message, "error"); } finally { setLoading(false); }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const amount = Number(payForm.amount);
      if (payForm.method === "ONLINE") {
        const intentRes = await fetch("/api/payments/gateway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: payForm.provider, amount, invoiceNumber: data.invoice.invoiceNumber,
            studentName: data.invoice.studentName, studentEmail: null, reference: data.invoice.invoiceNumber,
          }),
        });
        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.error || "Gateway intent failed");
        toast(`Gateway intent created (${intentData.intent.gatewayTransactionId}). Sandbox marks payment on confirmation.`, "info");
        if (intentData.intent.gatewayTransactionId) {
          const res = await fetch("/api/payments", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoiceId, amount, method: "ONLINE", gatewayTransactionId: intentData.intent.gatewayTransactionId, gatewayProvider: payForm.provider, notes: payForm.notes }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || "Failed to record payment");
        }
      } else {
        const res = await fetch("/api/payments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId, amount, method: payForm.method, reference: payForm.reference, notes: payForm.notes }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to record payment");
      }
      toast("Payment recorded successfully!", "success");
      setIsPayOpen(false);
      fetchInvoice();
    } catch (err: any) { toast(err.message, "error"); } finally { setSubmitting(false); }
  };

  const cancelInvoice = async () => {
    if (!confirm("Cancel this invoice? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
      if (!res.ok) throw new Error("Failed to cancel");
      toast("Invoice cancelled", "info");
      fetchInvoice();
    } catch (err: any) { toast(err.message, "error"); }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;
  if (!data?.invoice) return <div className="p-12 text-center text-sm text-slate-600">Invoice not found.</div>;

  const { invoice, items = [], payments = [] } = data;

  const statusStyle: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
    DUE: "bg-amber-50 text-amber-700 border-amber-200",
    OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link href="/admin/invoices" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 font-mono">{invoice.invoiceNumber}</h1>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle[invoice.status]}`}>{invoice.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== "CANCELLED" && invoice.dueAmount > 0 && (
            <button onClick={() => setIsPayOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"><Banknote className="w-3.5 h-3.5 inline mr-1" /> Record Payment</button>
          )}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <button onClick={cancelInvoice} className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">Cancel Invoice</button>
          )}
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"><Printer className="w-3.5 h-3.5 inline mr-1" /> Print</button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10 print:shadow-none print:border-0 print:p-0">
        {/* Brand header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white font-black text-xl">A</div>
            <div>
              <p className="text-lg font-black text-slate-900">ABACUS<span className="text-blue-600">UP</span></p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Mental Arithmetic Academy</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">Invoice</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-400">Issued: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
            <p className="text-xs text-slate-400">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 text-xs">
          <div>
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">Billed To</p>
            <p className="font-bold text-slate-900 text-sm">{invoice.studentName}</p>
            <p className="text-slate-500 mt-0.5">Student ID: {invoice.studentCode}</p>
            <p className="text-slate-500">Guardian: {invoice.guardianName} • {invoice.guardianPhone}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">Branch</p>
            <p className="font-bold text-slate-900 text-sm">{invoice.branchName}</p>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Description</th><th className="p-3">Type</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it: any) => (
              <tr key={it.id}>
                <td className="p-3 font-medium text-slate-800">{it.description}</td>
                <td className="p-3 text-slate-400">{it.feeType}</td>
                <td className="p-3 text-center text-slate-500">{it.quantity}</td>
                <td className="p-3 text-right font-semibold">${it.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${invoice.subtotal}</span></div>
            <div className="flex justify-between text-slate-500"><span>Discount</span><span className="text-emerald-600">-${invoice.discount}</span></div>
            <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2"><span>Total</span><span>${invoice.total}</span></div>
            <div className="flex justify-between text-emerald-700 font-bold"><span>Paid</span><span>${invoice.paidAmount}</span></div>
            <div className="flex justify-between text-rose-700 font-black"><span>Balance Due</span><span>${invoice.dueAmount}</span></div>
          </div>
        </div>

        {invoice.notes && <p className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900">Note: {invoice.notes}</p>}

        <div className="mt-8 pt-6 border-t border-slate-200 print:break-inside-avoid">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-3">Payment History</p>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-400">No payments recorded yet.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200"><th className="p-2">Code</th><th className="p-2">Date</th><th className="p-2">Method</th><th className="p-2">Reference</th><th className="p-2 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-2 font-mono font-semibold">{p.paymentCode}</td>
                    <td className="p-2 text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{p.method}</span></td>
                    <td className="p-2 text-slate-500">{p.reference || "—"}</td>
                    <td className="p-2 text-right font-bold text-emerald-700">${p.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Record Payment" description={`Outstanding balance: $${invoice.dueAmount.toFixed(2)}`}>
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Amount ($) *</label>
            <input type="number" min="0.01" max={invoice.dueAmount} step="0.01" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {["CASH", "BANK", "MOBILE_BANKING", "ONLINE"].map((m) => (
                <button key={m} type="button" onClick={() => setPayForm({ ...payForm, method: m })} className={`px-3 py-2 rounded-xl border font-bold transition ${payForm.method === m ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{m}</button>
              ))}
            </div>
          </div>
          {payForm.method === "ONLINE" && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Gateway Provider</label>
              <select value={payForm.provider} onChange={(e) => setPayForm({ ...payForm, provider: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                <option value="STRIPE">Stripe</option><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option><option value="SSLCOMMERZ">SSLCommerz</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Gateway keys come from server environment (.env) — never exposed to the browser.</p>
            </div>
          )}
          {payForm.method !== "ONLINE" && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Reference (transaction / check #)</label>
              <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Notes</label>
            <input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsPayOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-emerald-600 rounded-xl">{submitting ? "Processing..." : "Confirm Payment"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
