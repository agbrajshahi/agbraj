"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calculator, DollarSign, AlertTriangle, Wallet, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AccountingPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accountant/dashboard")
      .then((r) => r.json())
      .then((d) => { if (!d.kpis) throw new Error(d.error); setData(d); })
      .catch((e) => toast(e.message || "Failed to load accounting data", "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div>;

  const { kpis, recentPayments = [] } = data || {};

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const cards = [
    { label: "Today's Collection", value: kpis?.todaysCollection, icon: DollarSign, color: "emerald", href: "/admin/payments" },
    { label: "Monthly Collection", value: kpis?.monthlyCollection, icon: TrendingUp, color: "blue", href: "/admin/financial-reports" },
    { label: "Outstanding Due", value: kpis?.due, icon: AlertTriangle, color: "amber", href: "/admin/due" },
    { label: "Overdue", value: kpis?.overdue, icon: AlertTriangle, color: "rose", href: "/admin/due" },
    { label: "Monthly Expenses", value: kpis?.monthlyExpenses, icon: Wallet, color: "purple", href: "/admin/expenses" },
    { label: "Net Monthly Revenue", value: kpis?.netMonthly, icon: Calculator, color: "indigo", href: "/admin/financial-reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><Calculator className="w-7 h-7 text-emerald-600" /> Accounting Overview</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Collections, dues, expenses, and net revenue at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[c.color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</p>
              <p className={`text-lg font-black mt-0.5 ${Number(c.value) < 0 ? "text-rose-600" : "text-slate-900"}`}>${Number(c.value || 0).toFixed(2)}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Collections</h2>
            <Link href="/admin/payments" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">All Payments <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">No payments recorded yet.</p>
            ) : recentPayments.map((p: any) => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{p.studentName} <span className="text-slate-400 font-mono text-[10px]">({p.paymentCode})</span></p>
                  <p className="text-[11px] text-slate-400">{new Date(p.paymentDate).toLocaleString()} • {p.invoiceNumber} • {p.receivedByName}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-700 block">${p.amount}</span>
                  <span className="text-[10px] font-bold text-slate-400">{p.method}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
          {[
            { label: "Generate Invoice", href: "/admin/invoices", color: "bg-blue-600 hover:bg-blue-500" },
            { label: "Record Payment", href: "/admin/due", color: "bg-emerald-600 hover:bg-emerald-500" },
            { label: "Log Expense", href: "/admin/expenses", color: "bg-rose-600 hover:bg-rose-500" },
            { label: "Financial Reports", href: "/admin/financial-reports", color: "bg-indigo-600 hover:bg-indigo-500" },
          ].map((q) => (
            <Link key={q.label} href={q.href} className={`block px-4 py-2.5 ${q.color} text-white rounded-xl text-xs font-bold text-center transition`}>{q.label}</Link>
          ))}
          <p className="text-[10px] text-slate-400 pt-2 text-center">{data?.branchCount || 1} branch scope active</p>
        </div>
      </div>
    </div>
  );
}
