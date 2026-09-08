"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Loader2, Eye, Printer } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    studentId: "", dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    discount: "0", notes: "", items: [{ description: "", feeType: "COURSE", amount: "0" }],
  });

  useEffect(() => { fetchData(); }, [statusFilter, branchFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (branchFilter !== "ALL") params.append("branchId", branchFilter);
      const [resI, resS, resB, resF] = await Promise.all([
        fetch(`/api/invoices?${params}`), fetch("/api/students"), fetch("/api/branches"), fetch("/api/fees"),
      ]);
      setInvoices((await resI.json()).invoices || []);
      setStudents((await resS.json()).students || []);
      setBranches((await resB.json()).branches || []);
      setFees((await resF.json()).fees || []);
    } catch { toast("Failed to load invoices", "error"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formData.items.filter((i: any) => i.description && Number(i.amount) > 0);
    if (!formData.studentId || validItems.length === 0) {
      toast("Select a student and add at least one valid item", "error");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, items: validItems }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create invoice");
      toast(`Invoice ${d.invoice.invoiceNumber} generated!`, "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast(err.message, "error"); } finally { setSubmitting(false); }
  };

  const useFeeTemplate = (feeId: string) => {
    const fee = fees.find((f) => f.id.toString() === feeId);
    if (!fee) return;
    setFormData((p: any) => ({ ...p, items: [...p.items, { description: fee.name, feeType: fee.feeType, amount: fee.amount }] }));
  };

  const addRow = () => setFormData((p: any) => ({ ...p, items: [...p.items, { description: "", feeType: "COURSE", amount: "0" }] }));
  const updateRow = (idx: number, key: string, val: string) => {
    setFormData((p: any) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [key]: val };
      return { ...p, items };
    });
  };

  const statusStyle: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
    DUE: "bg-amber-50 text-amber-700 border-amber-200",
    OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const filtered = invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (i.studentName || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><FileText className="w-7 h-7 text-blue-600" /> Invoices & Billing</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Generate professional invoices with items, discounts, and payment tracking</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20"><Plus className="w-4 h-4" /> Generate Invoice</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice # or student..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
          {["ALL", "PAID", "PARTIAL", "DUE", "OVERDUE", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
          <option value="ALL">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No invoices found</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Invoice</th><th className="p-3">Student</th><th className="p-3">Branch</th><th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Due</th><th className="p-3">Due Date</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-slate-900">{i.invoiceNumber}</td>
                  <td className="p-3 font-medium text-slate-800">{i.studentName}</td>
                  <td className="p-3 text-slate-500">{i.branchName}</td>
                  <td className="p-3 font-bold text-slate-900">${i.total}</td>
                  <td className="p-3 text-emerald-600 font-semibold">${i.paidAmount}</td>
                  <td className="p-3 font-semibold text-rose-600">${i.dueAmount}</td>
                  <td className="p-3 text-slate-500">{new Date(i.dueDate).toLocaleDateString()}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle[i.status] || ""}`}>{i.status}</span></td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/invoices/${i.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg font-bold transition"><Eye className="w-3.5 h-3.5" /> View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Generate Invoice" description="Bill a student for fees, with discounts applied" maxWidth="2xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Student *</label>
              <select required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                <option value="">Select student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentIdCode})</option>)}
              </select>
            </div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Due Date *</label>
              <input type="date" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block font-bold text-slate-700 uppercase mb-1">Add from Fee Templates</label>
              <select value="" onChange={(e) => { useFeeTemplate(e.target.value); e.target.value = ""; }} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                <option value="">Select a fee template...</option>
                {fees.filter((f) => f.isActive).map((f) => <option key={f.id} value={f.id}>{f.name} — ${f.amount}</option>)}
              </select>
            </div>
            <button type="button" onClick={addRow} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700">+ Add Item</button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_90px_30px] gap-2 items-center text-[10px] font-bold text-slate-500 uppercase">
              <span>Description</span><span>Type</span><span>Amount</span><span></span>
            </div>
            {formData.items.map((item: any, idx: number) => (
              <div key={idx} className="grid grid-cols-[1fr_100px_90px_30px] gap-2 items-center">
                <input value={item.description} onChange={(e) => updateRow(idx, "description", e.target.value)} placeholder="e.g. Foundation Course Fee" className="px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                <select value={item.feeType} onChange={(e) => updateRow(idx, "feeType", e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white">
                  {["ADMISSION", "COURSE", "MONTHLY", "EXAM", "MATERIAL", "OTHER"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <input type="number" step="0.01" min="0" value={item.amount} onChange={(e) => updateRow(idx, "amount", e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg" />
                <button type="button" onClick={() => setFormData((p: any) => ({ ...p, items: p.items.filter((_: any, i: number) => i !== idx) }))} className="text-slate-300 hover:text-rose-600">✕</button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Discount ($) / Scholarship</label>
              <input type="number" min="0" step="0.01" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Notes</label>
              <input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. Scholarship applied" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-xl">{submitting ? "Generating..." : "Generate Invoice"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
