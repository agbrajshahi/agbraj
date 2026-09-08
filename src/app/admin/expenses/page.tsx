"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Plus, Search, Loader2, Trash2, Building } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

const CATEGORIES = ["RENT", "SALARY", "UTILITIES", "MATERIALS", "MARKETING", "TRANSPORT", "OTHER"];

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ branchId: "", category: "RENT", amount: "0", date: new Date().toISOString().slice(0, 10), description: "", attachmentUrl: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resE, resB] = await Promise.all([fetch("/api/expenses"), fetch("/api/branches")]);
      setExpenses((await resE.json()).expenses || []);
      const b = (await resB.json()).branches || [];
      setBranches(b);
      if (b[0] && !formData.branchId) setFormData((p) => ({ ...p, branchId: b[0].id.toString() }));
    } catch { toast("Failed to load expenses", "error"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to record expense");
      toast("Expense recorded!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast(err.message, "error"); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense record?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    toast("Expense deleted", "info");
    fetchData();
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const filtered = expenses.filter((e) => e.description?.toLowerCase().includes(search.toLowerCase()) || e.expenseCode.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><Wallet className="w-7 h-7 text-rose-600" /> Expense Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Rent, salaries, utilities, materials, marketing, and transport</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs">Total: <strong className="text-rose-600">${total.toFixed(2)}</strong></span>
          <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20"><Plus className="w-4 h-4" /> Record Expense</button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, code, category..." className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl" />
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No expenses recorded</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Expense</th><th className="p-3">Branch</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Recorded By</th><th className="p-3 text-right"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-slate-900">{e.expenseCode}</td>
                  <td className="p-3 text-slate-700">{e.branchName}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">{e.category}</span></td>
                  <td className="p-3 font-black text-rose-600">${e.amount}</td>
                  <td className="p-3 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-3 text-slate-500 max-w-[200px] truncate">{e.description || "—"}</td>
                  <td className="p-3 text-slate-500">{e.createdByName || "—"}</td>
                  <td className="p-3 text-right"><button onClick={() => handleDelete(e.id)} className="text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Record Expense" description="Log an operational expense with attachment support">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Branch *</label>
              <select required value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Amount ($) *</label>
              <input type="number" min="0" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          </div>
          <div><label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Monthly electricity bill" className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <FileUpload label="Attachment (Bill / Receipt)" entityType="GENERAL" category="EXPENSE" onSuccess={(url) => setFormData({ ...formData, attachmentUrl: url })} />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-rose-600 rounded-xl">{submitting ? "Saving..." : "Record Expense"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
