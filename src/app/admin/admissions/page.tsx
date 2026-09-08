"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Ban,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdmissionsPage() {
  const { toast } = useToast();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewing, setViewing] = useState<any>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "", gender: "Male", dateOfBirth: "2017-06-15", phone: "", email: "", address: "",
    guardianName: "", guardianPhone: "", guardianEmail: "", guardianRelation: "Parent",
    branchId: "", courseId: "", levelId: "", batchId: "", admissionDate: new Date().toISOString().slice(0, 10), notes: "", photoUrl: "",
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      const [resA, resB, resC, resL, resBt] = await Promise.all([
        fetch(`/api/admissions?${params}`),
        fetch("/api/branches"), fetch("/api/courses"), fetch("/api/courses/levels"), fetch("/api/batches"),
      ]);
      setAdmissions((await resA.json()).admissions || []);
      setBranches((await resB.json()).branches || []);
      setCourses((await resC.json()).courses || []);
      setLevels((await resL.json()).levels || []);
      setBatches((await resBt.json()).batches || []);
      if (!formData.branchId && branches.length === 0) {
        const b = (await resB.json()).branches || [];
        if (b[0]) setFormData((p) => ({ ...p, branchId: b[0].id.toString() }));
      }
    } catch { toast("Failed to load admissions", "error"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/admissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit admission");
      toast("Admission application submitted!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast(err.message, "error"); } finally { setSubmitting(false); }
  };

  const changeStatus = async (adm: any, status: string) => {
    try {
      const res = await fetch(`/api/admissions/${adm.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Action failed");
      toast(`Admission marked ${status}`, status === "REJECTED" ? "info" : "success");
      fetchData();
    } catch (err: any) { toast(err.message, "error"); }
  };

  const filtered = admissions.filter((a) => {
    const q = search.toLowerCase();
    return a.studentName.toLowerCase().includes(q) || a.admissionCode.toLowerCase().includes(q) || (a.guardianName || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><UserPlus className="w-7 h-7 text-blue-600" /> Admissions</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Process admission applications — pending, approve, activate enrollment, or reject</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20"><Plus className="w-4 h-4" /> New Application</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, application ID, guardian..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "ACTIVE", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No admissions found</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Applicant</th><th className="p-3">Guardian</th><th className="p-3">Branch / Course</th><th className="p-3">Applied</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">{a.photoUrl ? <img src={a.photoUrl} className="w-full h-full object-cover" /> : a.studentName.charAt(0)}</div>
                      <div><p className="font-bold text-slate-900">{a.studentName}</p><p className="text-[10px] font-mono text-slate-400">{a.admissionCode} • {a.gender}</p></div>
                    </div>
                  </td>
                  <td className="p-3"><p className="font-medium">{a.guardianName}</p><p className="text-[11px] text-slate-400">{a.guardianPhone}</p></td>
                  <td className="p-3"><p className="text-slate-700">{a.branchName}</p><p className="text-[11px] text-slate-400">{a.courseName || "—"} {a.batchName ? `• ${a.batchName}` : ""}</p></td>
                  <td className="p-3 text-slate-500">{new Date(a.admissionDate).toLocaleDateString()}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLE[a.status] || ""}`}>{a.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      <button onClick={() => setViewing(a)} className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      {a.status === "PENDING" && (<>
                        <button onClick={() => changeStatus(a, "APPROVED")} className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">Approve</button>
                        <button onClick={() => changeStatus(a, "REJECTED")} className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold hover:bg-rose-100">Reject</button>
                      </>)}
                      {a.status === "APPROVED" && <button onClick={() => changeStatus(a, "ACTIVE")} className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500">Activate</button>}
                      {(a.status === "PENDING" || a.status === "APPROVED") && <button onClick={() => changeStatus(a, "CANCELLED")} className="p-1.5 text-slate-400 hover:text-rose-600"><Ban className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={`Application ${viewing?.admissionCode}`} description={viewing?.status}>
        {viewing && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-400 block">Student</span><strong>{viewing.studentName} ({viewing.gender})</strong></div>
            <div><span className="text-slate-400 block">DOB</span><strong>{viewing.dateOfBirth ? new Date(viewing.dateOfBirth).toLocaleDateString() : "—"}</strong></div>
            <div><span className="text-slate-400 block">Phone</span><strong>{viewing.phone || "—"}</strong></div>
            <div><span className="text-slate-400 block">Email</span><strong>{viewing.email || "—"}</strong></div>
            <div><span className="text-slate-400 block">Guardian</span><strong>{viewing.guardianName} ({viewing.guardianRelation})</strong></div>
            <div><span className="text-slate-400 block">Guardian Phone</span><strong>{viewing.guardianPhone}</strong></div>
            <div className="col-span-2"><span className="text-slate-400 block">Notes</span><strong>{viewing.notes || "—"}</strong></div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Admission Application" description="Student and guardian details for admission" maxWidth="2xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Student Name *</label>
              <input required value={formData.studentName} onChange={(e) => setFormData({ ...formData, studentName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl"><option>Male</option><option>Female</option><option>Other</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">DOB</label><input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Phone</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <span className="font-bold text-slate-900 uppercase block">Guardian *</span>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-semibold text-slate-600 mb-1">Name *</label><input required value={formData.guardianName} onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone *</label><input required value={formData.guardianPhone} onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Branch *</label>
              <select required value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Course</label>
              <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"><option value="">Select</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Level</label>
              <select value={formData.levelId} onChange={(e) => setFormData({ ...formData, levelId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"><option value="">Select</option>{levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Batch</label>
              <select value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"><option value="">Select</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          </div>
          <FileUpload label="Applicant Photo" entityType="GENERAL" category="AVATAR" accept="image/*" onSuccess={(url) => setFormData({ ...formData, photoUrl: url })} />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-xl">{submitting ? "Submitting..." : "Submit Application"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
