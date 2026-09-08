"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Plus, Loader2, Trash2, BadgePercent } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function FeesPage() {
  const { toast } = useToast();
  const [fees, setFees] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", feeType: "COURSE", courseId: "", amount: "0", description: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resF, resC] = await Promise.all([fetch("/api/fees"), fetch("/api/courses")]);
      setFees((await resF.json()).fees || []);
      setCourses((await resC.json()).courses || []);
    } catch { toast("Failed to load fee structures", "error"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/fees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create fee");
      toast("Fee structure created!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast(err.message, "error"); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this fee structure?")) return;
    await fetch(`/api/fees/${id}`, { method: "DELETE" });
    toast("Fee structure deleted", "info");
    fetchData();
  };

  const FEE_TYPES = ["ADMISSION", "COURSE", "MONTHLY", "EXAM", "MATERIAL", "OTHER"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><DollarSign className="w-7 h-7 text-emerald-600" /> Fee Structures</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Admission, course, monthly, exam, and material fee templates for invoicing</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20"><Plus className="w-4 h-4" /> New Fee Structure</button>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div>
      ) : fees.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No fee structures defined</h3></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {fees.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{f.feeType}</span>
                  <button onClick={() => handleDelete(f.id)} className="text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-2">{f.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{f.description || f.courseName || "General fee"}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-lg font-black text-emerald-700">${f.amount}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{f.isActive ? "ACTIVE" : "INACTIVE"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Fee Structure" description="Define a billable fee template">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div><label className="block font-bold text-slate-700 uppercase mb-1">Name *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Term Exam Fee" className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Fee Type *</label>
              <select value={formData.feeType} onChange={(e) => setFormData({ ...formData, feeType: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">{FEE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Amount ($) *</label>
              <input type="number" min="0" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          </div>
          <div><label className="block font-bold text-slate-700 uppercase mb-1">Linked Course (optional)</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"><option value="">General</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <BadgePercent className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] text-slate-500">Discounts and scholarships are applied per-invoice during billing.</span>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-emerald-600 rounded-xl">{submitting ? "Saving..." : "Create Fee"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
