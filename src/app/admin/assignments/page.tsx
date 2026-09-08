"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Calendar,
  Loader2,
  ChevronRight,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export default function AssignmentsPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    batchId: "",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    maxMarks: "10",
    attachmentUrl: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resA, resB] = await Promise.all([fetch("/api/assignments"), fetch("/api/batches")]);
      setAssignments((await resA.json()).assignments || []);
      const bData = (await resB.json()).batches || [];
      setBatches(bData);
      if (bData.length && !formData.batchId) setFormData((p) => ({ ...p, batchId: bData[0].id.toString() }));
    } catch {
      toast("Failed to load assignments", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const batch = batches.find((b) => b.id.toString() === formData.batchId);
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, courseId: batch?.courseId, teacherId: batch?.teacherId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assignment");
      toast("Assignment posted to students!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDue = (deadline: string) => new Date(deadline) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-teal-600" /> Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Post homework, track submissions, and review student work
          </p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-600/20">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" /></div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No assignments posted yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignments.map((a) => (
            <Link key={a.id} href={`/admin/assignments/${a.id}`} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPastDue(a.deadline) ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
                    {isPastDue(a.deadline) ? "Past Due" : "Active"}
                  </span>
                  <span className="text-xs font-bold text-teal-700">{a.maxMarks} marks</span>
                </div>
                <h2 className="text-sm font-bold text-slate-900">{a.title}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                <p className="text-[11px] text-slate-400 mt-2">{a.batchName} • Due {new Date(a.deadline).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-500"><Users className="w-3.5 h-3.5" /> {a.submissionCount || 0} submitted, {a.pendingCount || 0} pending</span>
                <span className="inline-flex items-center gap-1 font-bold text-teal-600">Review <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Assignment" description="Post homework with deadline and optional attachment">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Title *</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Complement of 10 Practice Sheet" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Batch *</label>
            <select required value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Deadline *</label>
              <input required type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Max Marks</label>
              <input type="number" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <FileUpload label="Attachment (Optional)" entityType="GENERAL" category="ASSIGNMENT" onSuccess={(url) => setFormData({ ...formData, attachmentUrl: url })} />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl">
              {submitting ? "Posting..." : "Post Assignment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
