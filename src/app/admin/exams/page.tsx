"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Clock,
  Award,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function ExamsPage() {
  const { toast } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    batchId: "",
    examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    durationMinutes: "45",
    totalMarks: "100",
    passingMarks: "40",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resE, resB] = await Promise.all([fetch("/api/exams"), fetch("/api/batches")]);
      setExams((await resE.json()).exams || []);
      const bData = (await resB.json()).batches || [];
      setBatches(bData);
      if (bData.length && !formData.batchId) setFormData((p) => ({ ...p, batchId: bData[0].id.toString() }));
    } catch {
      toast("Failed to load exams", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const batch = batches.find((b) => b.id.toString() === formData.batchId);
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, courseId: batch?.courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create exam");
      toast("Exam created as draft!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "PUBLISHED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "COMPLETED") return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-rose-600" /> Exam Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, schedule, and publish assessments to student batches
          </p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-600/20">
          <Plus className="w-4 h-4" /> Create Exam
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" /></div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No exams created yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((e) => (
            <Link key={e.id} href={`/admin/exams/${e.id}`} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(e.status)}`}>{e.status}</span>
                  <Award className="w-4 h-4 text-rose-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">{e.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{e.batchName} • {e.courseName}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] border-t border-slate-100 pt-3">
                  <div><span className="text-slate-400 block">Date</span><strong className="text-slate-800">{new Date(e.examDate).toLocaleDateString()}</strong></div>
                  <div><span className="text-slate-400 block">Duration</span><strong className="text-slate-800">{e.durationMinutes}m</strong></div>
                  <div><span className="text-slate-400 block">Marks</span><strong className="text-slate-800">{e.totalMarks}</strong></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">Manage Exam <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Exam" description="Draft an assessment for a specific batch">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Exam Title *</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Level 2 Mid-Term Assessment" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Batch *</label>
            <select required value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Exam Date *</label>
              <input required type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Duration (min)</label>
              <input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Total Marks</label>
              <input type="number" value={formData.totalMarks} onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl">
              {submitting ? "Creating..." : "Create Draft Exam"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
