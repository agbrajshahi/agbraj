"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Download, Loader2, TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function FinancialReportsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState("ALL");
  const [method, setMethod] = useState("ALL");

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { fetchReport(); }, [dateFrom, dateTo, branchId, method]);

  const fetchBranches = async () => {
    const res = await fetch("/api/branches");
    setBranches((await res.json()).branches || []);
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (branchId !== "ALL") params.append("branchId", branchId);
      if (method !== "ALL") params.append("method", method);
      const res = await fetch(`/api/finance/reports?${params}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load report");
      setData(d);
    } catch (err: any) { toast(err.message, "error"); } finally { setLoading(false); }
  };

  const exportCSV = () => {
    const rows: string[][] = [];
    rows.push(["Report", "Value"]);
    rows.push(["Revenue", data?.summary?.revenue]);
    rows.push(["Expenses", data?.summary?.expenses]);
    rows.push(["Net Revenue", data?.summary?.netRevenue]);
    rows.push(["Due", data?.summary?.dueTotal]);
    rows.push(["Overdue", data?.summary?.overdueTotal]);
    rows.push([]);
    rows.push(["Monthly Collection", "Amount"]);
    (data?.monthlyCollection || []).forEach((m: any) => rows.push([m.month, m.amount]));
    rows.push([]);
    rows.push(["Branch Revenue", "Revenue", "Expenses", "Net"]);
    (data?.branchRevenue || []).forEach((b: any) => rows.push([b.branchName, b.revenue, b.expenses, b.net]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = `AbacusUp_Financial_Report_${dateFrom}_to_${dateTo}.csv`;
    link.click();
    toast("Financial report exported", "success");
  };

  const maxDaily = Math.max(1, ...(data?.dailyCollection || []).map((d: any) => d.amount));
  const maxMonthly = Math.max(1, ...(data?.monthlyCollection || []).map((m: any) => m.amount));
  const maxBranch = Math.max(1, ...(data?.branchRevenue || []).map((b: any) => b.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><BarChart3 className="w-7 h-7 text-indigo-600" /> Financial Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Daily, monthly, and yearly collection analytics with branch and method breakdowns</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-end gap-3">
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"><option value="ALL">All Branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">{["ALL", "CASH", "BANK", "MOBILE_BANKING", "ONLINE"].map((m) => <option key={m}>{m}</option>)}</select></div>
      </div>

      {loading || !data ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm"><span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span><p className="text-xl font-black text-emerald-600 mt-1">${data.summary.revenue.toFixed(2)}</p></div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm"><span className="text-[10px] font-bold text-slate-500 uppercase">Expenses</span><p className="text-xl font-black text-rose-600 mt-1">${data.summary.expenses.toFixed(2)}</p></div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm"><span className="text-[10px] font-bold text-slate-500 uppercase">Net Revenue</span><p className="text-xl font-black text-indigo-600 mt-1">${data.summary.netRevenue.toFixed(2)}</p></div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm"><span className="text-[10px] font-bold text-slate-500 uppercase">Due</span><p className="text-xl font-black text-amber-600 mt-1">${data.summary.dueTotal.toFixed(2)}</p></div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm"><span className="text-[10px] font-bold text-slate-500 uppercase">Overdue</span><p className="text-xl font-black text-rose-600 mt-1">${data.summary.overdueTotal.toFixed(2)}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly trend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-600" /> Monthly Collection Trend</h2>
              <div className="flex items-end gap-2 h-36">
                {data.monthlyCollection.slice(-8).map((m: any) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-emerald-700">{m.amount >= 1000 ? `$${(m.amount / 1000).toFixed(1)}k` : `$${m.amount}`}</span>
                    <div className="w-full bg-emerald-500 rounded-t-lg" style={{ height: `${Math.max(4, (m.amount / maxMonthly) * 100)}px` }} />
                    <span className="text-[9px] text-slate-400">{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-blue-600" /> Daily Collection (last 14 days)</h2>
              <div className="flex items-end gap-1 h-36">
                {data.dailyCollection.map((d: any) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: `${Math.max(4, (d.amount / maxDaily) * 100)}px` }} />
                    <span className="text-[8px] text-slate-400">{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Branch revenue */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Branch Revenue vs Expenses</h2>
              <div className="space-y-4">
                {data.branchRevenue.map((b: any) => (
                  <div key={b.branchId}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-800">{b.branchName}</span><span className="font-black text-slate-900">${b.revenue.toFixed(2)} net: ${b.net.toFixed(2)}</span></div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden"><div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(b.revenue / maxBranch) * 100}%` }} /></div>
                    <p className="text-[10px] text-slate-400 mt-1">Expenses: ${b.expenses.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Method + expense categories */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3">Collection by Payment Method</h2>
                <div className="flex flex-wrap gap-2">
                  {data.byMethod.map((m: any) => (
                    <div key={m.name} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"><span className="font-bold text-slate-700">{m.name}</span> <strong className="text-emerald-700">${m.amount.toFixed(2)}</strong></div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-rose-600" /> Expenses by Category</h2>
                <div className="space-y-2">
                  {data.expensesByCategory.map((c: any) => (
                    <div key={c.category} className="flex justify-between text-xs border-b border-slate-100 pb-2"><span className="font-semibold text-slate-700">{c.category}</span><strong className="text-rose-600">${c.amount.toFixed(2)}</strong></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
