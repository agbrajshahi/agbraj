"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calculator, DollarSign, AlertTriangle, Wallet, TrendingUp, Loader2, FileText, CreditCard, ReceiptText, BarChart3 } from "lucide-react";

export default function AccountantDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accountant/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div>;

  const kpis = data?.kpis || {};

  const cards = [
    { label: "Today's Collection", value: kpis.todaysCollection, icon: DollarSign, cls: "text-emerald-600 bg-emerald-50" },
    { label: "Monthly Collection", value: kpis.monthlyCollection, icon: TrendingUp, cls: "text-blue-600 bg-blue-50" },
    { label: "Yearly Collection", value: kpis.yearlyCollection, icon: BarChart3, cls: "text-indigo-600 bg-indigo-50" },
    { label: "Total Due", value: kpis.due, icon: AlertTriangle, cls: "text-amber-600 bg-amber-50" },
    { label: "Overdue", value: kpis.overdue, icon: AlertTriangle, cls: "text-rose-600 bg-rose-50" },
    { label: "Monthly Expenses", value: kpis.monthlyExpenses, icon: Wallet, cls: "text-purple-600 bg-purple-50" },
  ];

  const tools = [
    { label: "Invoices & Billing", href: "/admin/invoices", icon: FileText },
    { label: "Payment Records", href: "/admin/payments", icon: CreditCard },
    { label: "Due / Overdue List", href: "/admin/due", icon: AlertTriangle },
    { label: "Expense Management", href: "/admin/expenses", icon: Wallet },
    { label: "Accounting Overview", href: "/admin/accounting", icon: Calculator },
    { label: "Financial Reports", href: "/admin/financial-reports", icon: ReceiptText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Accountant Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Restricted finance workspace — collections, dues, expenses, and reporting</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.cls}`}><Icon className="w-4 h-4" /></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">${Number(c.value || 0).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Finance Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition text-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                <span className="font-bold text-slate-800">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Recent Collections</h2>
        {data?.recentPayments?.length === 0 || !data?.recentPayments ? (
          <p className="text-xs text-slate-500 text-center p-6">No recent payments.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentPayments.map((p: any) => (
              <div key={p.id} className="py-3 flex justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{p.studentName} <span className="text-slate-400 font-mono text-[10px]">({p.paymentCode})</span></p>
                  <p className="text-[11px] text-slate-400">{new Date(p.paymentDate).toLocaleString()} • {p.invoiceNumber} • by {p.receivedByName}</p>
                </div>
                <span className="font-black text-emerald-700">${p.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
