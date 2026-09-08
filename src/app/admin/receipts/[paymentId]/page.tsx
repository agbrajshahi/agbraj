"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Loader2, CheckCircle2 } from "lucide-react";

export default function ReceiptPage() {
  const params = useParams();
  const paymentId = params.paymentId as string;
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/payments/${paymentId}`)
      .then((r) => r.json())
      .then((d) => { setReceipt(d.receipt); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div>;
  if (!receipt) return <div className="p-12 text-center text-sm text-slate-600">Receipt not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/admin/payments" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"><ArrowLeft className="w-4 h-4" /> Back to Payments</Link>
        <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"><Printer className="w-4 h-4 inline mr-1" /> Print Receipt</button>
      </div>

      {/* Printable Receipt */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 print:shadow-none print:border-0 print:p-0">
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b-2 border-dashed border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white font-black text-xl">A</div>
            <div>
              <p className="text-lg font-black text-slate-900">ABACUS<span className="text-blue-600">UP</span></p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Mental Arithmetic Academy</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payment Receipt
            </div>
            <p className="text-xs font-mono text-slate-500 mt-2">{receipt.paymentCode}</p>
          </div>
        </div>

        <div className="py-6 text-xs grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Received From</p>
            <p className="font-bold text-slate-900 text-sm">{receipt.studentName}</p>
            <p className="text-slate-500">{receipt.studentCode}</p>
            <p className="text-slate-500">Guardian: {receipt.guardianName || "—"} • {receipt.guardianPhone || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Invoice</p>
            <p className="font-mono font-bold text-slate-900">{receipt.invoiceNumber}</p>
            <p className="text-slate-500 mt-2">Branch: {receipt.branchName}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Description</th><th className="p-3">Method</th><th className="p-3">Date</th><th className="p-3">Reference</th><th className="p-3 text-right">Amount</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-medium text-slate-800">Payment against {receipt.invoiceNumber}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{receipt.method}</span></td>
                <td className="p-3 text-slate-500">{new Date(receipt.paymentDate).toLocaleDateString()}</td>
                <td className="p-3 text-slate-500 font-mono">{receipt.reference || "—"}</td>
                <td className="p-3 text-right font-black text-emerald-700">${receipt.amount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500"><span>Invoice Total</span><span>${receipt.invoiceTotal}</span></div>
            <div className="flex justify-between text-slate-500"><span>Total Paid</span><span>${receipt.paidAmount}</span></div>
            <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-2"><span>Balance Due</span><span>${receipt.dueAmount}</span></div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <span>Received by: <strong className="text-slate-700">{receipt.receivedByName || "Cash Desk"}</strong></span>
          <span>Authorized signature</span>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-300">This is a computer-generated receipt from the ABACUSUP Education Management System.</p>
      </div>
    </div>
  );
}
