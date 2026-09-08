"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Search, Loader2, Receipt as ReceiptIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  useEffect(() => { fetchData(); }, [methodFilter, branchFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (methodFilter !== "ALL") params.append("method", methodFilter);
      if (branchFilter !== "ALL") params.append("branchId", branchFilter);
      const [resP, resB] = await Promise.all([fetch(`/api/payments?${params}`), fetch("/api/branches")]);
      setPayments((await resP.json()).payments || []);
      setBranches((await resB.json()).branches || []);
    } catch { toast("Failed to load payments", "error"); } finally { setLoading(false); }
  };

  const filtered = payments.filter((p) => p.paymentCode.toLowerCase().includes(search.toLowerCase()) || (p.studentName || "").toLowerCase().includes(search.toLowerCase()) || (p.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><CreditCard className="w-7 h-7 text-emerald-600" /> Payment Records</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">All collections — cash, bank, mobile banking, and online gateway payments</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payment code, student, invoice..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
          {["ALL", "CASH", "BANK", "MOBILE_BANKING", "ONLINE"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
          <option value="ALL">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No payments found</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Payment</th><th className="p-3">Invoice</th><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Date</th><th className="p-3">Received By</th><th className="p-3 text-right">Receipt</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-slate-900">{p.paymentCode}</td>
                  <td className="p-3 font-mono text-slate-600">{p.invoiceNumber}</td>
                  <td className="p-3 font-medium text-slate-800">{p.studentName}</td>
                  <td className="p-3 font-black text-emerald-700">${p.amount}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{p.method}</span></td>
                  <td className="p-3 text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="p-3 text-slate-500">{p.receivedByName || "—"}</td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/receipts/${p.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg font-bold transition"><ReceiptIcon className="w-3.5 h-3.5" /> Receipt</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
