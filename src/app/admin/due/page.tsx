"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Search, Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function DuePage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"due" | "overdue">("due");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, [view, branchFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resI, resB] = await Promise.all([
        fetch(`/api/invoices?status=${view === "overdue" ? "OVERDUE" : "DUE"}&branchId=${branchFilter}`),
        fetch("/api/branches"),
      ]);
      setInvoices((await resI.json()).invoices || []);
      setBranches((await resB.json()).branches || []);
    } catch { toast("Failed to load due list", "error"); } finally { setLoading(false); }
  };

  const exportCSV = () => {
    const headers = ["Invoice", "Student", "Branch", "Total", "Paid", "Due", "Due Date", "Status"];
    const rows = invoices.map((i) => [i.invoiceNumber, `"${i.studentName}"`, `"${i.branchName}"`, i.total, i.paidAmount, i.dueAmount, new Date(i.dueDate).toLocaleDateString(), i.status]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `AbacusUp_${view}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast("Due list exported", "success");
  };

  const totalDue = invoices.reduce((s, i) => s + Number(i.dueAmount), 0);
  const filtered = invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (i.studentName || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><AlertTriangle className="w-7 h-7 text-amber-600" /> Due Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Outstanding balances across students, batches, and branches</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"><Download className="w-3.5 h-3.5 inline mr-1" /> Export CSV</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 inline-flex gap-1">
          <button onClick={() => setView("due")} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === "due" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Due List</button>
          <button onClick={() => setView("overdue")} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === "overdue" ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Overdue List</button>
        </div>
        <div className="flex-1 relative min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice or student..." className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl" />
        </div>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
          <option value="ALL">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs">
          <span className="text-slate-500">{view === "overdue" ? "Total Overdue: " : "Total Due: "}</span>
          <span className="font-black text-rose-600">${totalDue.toFixed(2)}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircleIcon />
          <h3 className="text-sm font-bold text-slate-800 mt-3">No {view} invoices 🎉</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Invoice</th><th className="p-3">Student</th><th className="p-3">Branch</th><th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Due Amount</th><th className="p-3">Due Date</th><th className="p-3 text-right">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-slate-900">{i.invoiceNumber}</td>
                  <td className="p-3 font-medium text-slate-800">{i.studentName}</td>
                  <td className="p-3 text-slate-500">{i.branchName}</td>
                  <td className="p-3 font-semibold">${i.total}</td>
                  <td className="p-3 text-emerald-600">${i.paidAmount}</td>
                  <td className="p-3 font-black text-rose-600">${i.dueAmount}</td>
                  <td className="p-3 text-slate-500">{new Date(i.dueDate).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/invoices/${i.id}`} className="text-blue-600 font-bold hover:underline">Collect →</Link>
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

function CheckCircleIcon() {
  return <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div>;
}
