"use client";

import React, { useState, useEffect } from "react";
import { Building2, Loader2, Eye, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { statusBadge } from "@/components/admin/ResourceManager";

const STATUSES = ["PENDING", "UNDER_REVIEW", "CONTACTED", "APPROVED", "REJECTED"];

export default function BranchApplicationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [viewing, setViewing] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/cms/branch-applications").then((r) => r.json()).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const update = async (id: number, body: any) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/cms/branch-applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      toast(body.createBranch ? "Approved — branch created (INACTIVE until configured)" : "Application updated", "success");
      setViewing(d.item); load();
    } catch (e: any) { toast(e.message, "error"); } finally { setSaving(false); }
  };

  const filtered = items.filter((a) => (filter === "ALL" || a.status === filter) && [a.applicantName, a.organization, a.city, a.email, a.applicationCode].some((v) => (v || "").toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><Building2 className="w-7 h-7 text-emerald-600" /> Branch Applications</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Franchise applications from the public website — review, add notes, approve into a branch</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicant, organization, city..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"><option value="ALL">All Statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {loading ? <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div> : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No applications yet</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]"><th className="p-3">Applicant</th><th className="p-3">Location</th><th className="p-3">Capacity</th><th className="p-3">Submitted</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="p-3"><p className="font-bold text-slate-900">{a.applicantName}</p><p className="text-[10px] text-slate-400">{a.organization || "Individual"} · {a.applicationCode}</p></td>
                  <td className="p-3 text-slate-700">{a.city || "—"}</td>
                  <td className="p-3 text-slate-700">{a.expectedCapacity || "—"}</td>
                  <td className="p-3 text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{statusBadge(a.status)}</td>
                  <td className="p-3 text-right"><button onClick={() => { setViewing(a); setNotes(a.adminNotes || ""); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg font-bold"><Eye className="w-3.5 h-3.5" /> Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={`Application ${viewing?.applicationCode}`} description={viewing?.status} maxWidth="2xl">
        {viewing && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              {[["Applicant", viewing.applicantName], ["Organization", viewing.organization], ["Phone", viewing.phone], ["Email", viewing.email], ["City", viewing.city], ["Expected Capacity", viewing.expectedCapacity], ["Address", viewing.address]].map(([l, v]) => <div key={l as string}><span className="text-slate-400 block">{l}</span><strong className="text-slate-800">{v || "—"}</strong></div>)}
              <div className="col-span-2"><span className="text-slate-400 block">Experience</span><p className="text-slate-800">{viewing.experience || "—"}</p></div>
              <div className="col-span-2"><span className="text-slate-400 block">Message</span><p className="text-slate-800">{viewing.message || "—"}</p></div>
              {viewing.logoUrl && <div className="col-span-2"><img src={viewing.logoUrl} className="w-20 h-20 object-cover rounded-xl" /></div>}
              {Array.isArray(viewing.documentUrls) && viewing.documentUrls.length > 0 && <div className="col-span-2"><span className="text-slate-400 block mb-1">Documents</span>{viewing.documentUrls.map((u: string, i: number) => <a key={i} href={u} target="_blank" className="text-blue-600 font-bold block">Document {i + 1} →</a>)}</div>}
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Review Notes</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              <button onClick={() => update(viewing.id, { adminNotes: notes })} disabled={saving} className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold">Save Notes</button>
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              {viewing.status === "PENDING" && <button onClick={() => update(viewing.id, { status: "UNDER_REVIEW", adminNotes: notes })} className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold">Start Review</button>}
              {(viewing.status === "UNDER_REVIEW" || viewing.status === "PENDING") && <button onClick={() => update(viewing.id, { status: "CONTACTED", adminNotes: notes })} className="px-3 py-2 bg-purple-600 text-white rounded-xl font-bold">Mark Contacted</button>}
              {viewing.status !== "APPROVED" && viewing.status !== "REJECTED" && (<>
                <button onClick={() => update(viewing.id, { status: "APPROVED", createBranch: true, adminNotes: notes })} className="px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold">Approve & Create Branch</button>
                <button onClick={() => update(viewing.id, { status: "REJECTED", adminNotes: notes })} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold">Reject</button>
              </>)}
              {viewing.createdBranchId && <a href={`/admin/branches/${viewing.createdBranchId}`} className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold">Open Created Branch →</a>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
