"use client";

import React, { useState, useEffect } from "react";
import { BookOpenCheck, Plus, Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function EnrollmentsPage() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "", batchId: "", courseId: "", levelId: "",
    startDate: new Date().toISOString().slice(0, 10), status: "ACTIVE",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resE, resS, resC, resL, resB] = await Promise.all([
        fetch("/api/enrollments"), fetch("/api/students"), fetch("/api/courses"), fetch("/api/courses/levels"), fetch("/api/batches"),
      ]);
      setEnrollments((await resE.json()).enrollments || []);
      setStudents((await resS.json()).students || []);
      setCourses((await resC.json()).courses || []);
      setLevels((await resL.json()).levels || []);
      setBatches((await resB.json()).batches || []);
    } catch { toast("Failed to load enrollments", "error"); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Enrollment failed");
      toast("Student enrolled successfully!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) { toast(err.message, "error"); } finally { setSubmitting(false); }
  };

  const changeStatus = async (enr: any, status: string) => {
    try {
      const res = await fetch(`/api/enrollments/${enr.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      toast(`Enrollment marked ${status}`, "success");
      fetchData();
    } catch (err: any) { toast(err.message, "error"); }
  };

  const filtered = enrollments.filter((e) => {
    const q = search.toLowerCase();
    return (e.studentName || "").toLowerCase().includes(q) || (e.batchName || "").toLowerCase().includes(q) || (e.courseName || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><BookOpenCheck className="w-7 h-7 text-teal-600" /> Enrollments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track student enrollment into courses, levels, batches, and branches</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20"><Plus className="w-4 h-4" /> New Enrollment</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, batch, course..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">No enrollments found</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Student</th><th className="p-3">Course → Level</th><th className="p-3">Batch / Branch</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="p-3"><p className="font-bold text-slate-900">{e.studentName}</p><p className="text-[10px] font-mono text-slate-400">{e.studentCode}</p></td>
                  <td className="p-3"><p className="text-slate-800">{e.courseName || "—"}</p><p className="text-[11px] text-slate-400">{e.levelName || ""}</p></td>
                  <td className="p-3"><p className="text-slate-800">{e.batchName || "—"}</p><p className="text-[11px] text-slate-400">{e.branchName}</p></td>
                  <td className="p-3 text-slate-500">{e.startDate ? new Date(e.startDate).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-slate-500">{e.endDate ? new Date(e.endDate).toLocaleDateString() : "—"}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${e.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : e.status === "COMPLETED" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>{e.status}</span></td>
                  <td className="p-3 text-right">
                    {e.status === "ACTIVE" ? (
                      <button onClick={() => changeStatus(e, "COMPLETED")} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-100">Complete</button>
                    ) : e.status === "COMPLETED" ? (
                      <button onClick={() => changeStatus(e, "ACTIVE")} className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100">Reactivate</button>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Enrollment" description="Enroll a student into a batch with course and level">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Student *</label>
            <select required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
              <option value="">Select student</option>
              {students.filter((s) => !enrollments.some((en) => en.studentId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentIdCode})</option>)}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Batch *</label>
            <select required value={formData.batchId} onChange={(e) => {
              const b = batches.find((x) => x.id.toString() === e.target.value);
              setFormData({ ...formData, batchId: e.target.value, courseId: b?.courseId?.toString() || "", levelId: "" });
            }} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
              <option value="">Select batch</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.branchName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Course</label>
              <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"><option value="">Auto from batch</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Level</label>
              <select value={formData.levelId} onChange={(e) => setFormData({ ...formData, levelId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"><option value="">Select level</option>{levels.filter((l) => !formData.courseId || l.courseId === parseInt(formData.courseId)).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl"><option>ACTIVE</option><option>DROPPED</option></select></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-teal-600 rounded-xl">{submitting ? "Enrolling..." : "Confirm Enrollment"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
