"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, FileText, Clock } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function AssignmentDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const assignmentId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assignments/${assignmentId}`);
      const result = await res.json();
      setData(result);
    } catch {
      toast("Failed to load assignment", "error");
    } finally {
      setLoading(false);
    }
  };

  const openGrading = (sub: any) => {
    setGradingSubmission(sub);
    setMarks(sub.marksObtained?.toString() || "");
    setFeedback(sub.feedback || "");
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: gradingSubmission.id, marksObtained: marks, feedback }),
      });
      if (!res.ok) throw new Error("Failed to grade submission");
      toast("Submission graded and student notified!", "success");
      setGradingSubmission(null);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" /></div>;
  if (!data?.assignment) return <div className="p-12 text-center text-sm text-slate-600">Assignment not found.</div>;

  const { assignment, submissions = [] } = data;

  const statusColor = (s: string) => {
    if (s === "REVIEWED") return "bg-emerald-50 text-emerald-700";
    if (s === "LATE") return "bg-rose-50 text-rose-700";
    if (s === "SUBMITTED") return "bg-blue-50 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/admin/assignments" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
          <p className="text-xs text-slate-500">Due {new Date(assignment.deadline).toLocaleDateString()} • {assignment.maxMarks} marks</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Student Submissions ({submissions.length})</h2>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <th className="p-3">Student</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3">Marks</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map((s: any) => (
              <tr key={s.id}>
                <td className="p-3 font-bold text-slate-900">{s.studentName} <span className="text-slate-400 font-mono text-[10px]">({s.studentCode})</span></td>
                <td className="p-3 text-slate-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Not submitted"}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(s.status)}`}>{s.status}</span></td>
                <td className="p-3 font-bold text-slate-800">{s.marksObtained ?? "—"} / {assignment.maxMarks}</td>
                <td className="p-3 text-right">
                  {s.status !== "PENDING" && (
                    <button onClick={() => openGrading(s)} className="text-teal-600 font-bold hover:underline">
                      {s.status === "REVIEWED" ? "Update Grade" : "Grade Now"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {gradingSubmission && (
        <Modal isOpen={!!gradingSubmission} onClose={() => setGradingSubmission(null)} title={`Grade Submission — ${gradingSubmission.studentName}`}>
          <form onSubmit={handleGrade} className="space-y-4 text-xs">
            {gradingSubmission.note && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">Student Note:</span>
                <p className="text-slate-600">{gradingSubmission.note}</p>
              </div>
            )}
            {gradingSubmission.fileUrl && (
              <a href={gradingSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-teal-600 font-bold hover:underline flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> View Submitted File
              </a>
            )}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Marks (out of {assignment.maxMarks})</label>
              <input type="number" max={assignment.maxMarks} required value={marks} onChange={(e) => setMarks(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Feedback</label>
              <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="Great work on speed drills! Focus more on..." />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setGradingSubmission(null)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl">
                {submitting ? "Saving..." : "Submit Grade"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
