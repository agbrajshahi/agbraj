"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Loader2,
  Rocket,
  FileQuestion,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const examId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [selectedQIds, setSelectedQIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resExam, resQ] = await Promise.all([fetch(`/api/exams/${examId}`), fetch("/api/questions")]);
      const examData = await resExam.json();
      setData(examData);
      setSelectedQIds((examData.questions || []).map((q: any) => q.questionId));
      setAllQuestions((await resQ.json()).questions || []);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (qId: number) => {
    setSelectedQIds((prev) => (prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]));
  };

  const saveQuestions = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: selectedQIds }),
      });
      if (!res.ok) throw new Error("Failed to save questions");
      toast("Exam questions updated!", "success");
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (selectedQIds.length === 0) {
      toast("Assign at least one question before publishing", "error");
      return;
    }
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (!res.ok) throw new Error("Failed to publish exam");
      toast("Exam published! Students have been notified.", "success");
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this draft exam?")) return;
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete");
      toast("Exam deleted", "info");
      router.push("/admin/exams");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" /></div>;
  if (!data?.exam) return <div className="p-12 text-center text-sm text-slate-600">Exam not found.</div>;

  const { exam, results = [] } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/admin/exams" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{exam.title}</h1>
            <p className="text-xs text-slate-500">{exam.status} • {new Date(exam.examDate).toLocaleDateString()} • {exam.totalMarks} marks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {exam.status === "DRAFT" && (
            <>
              <button onClick={handleDelete} className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200"><Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete Draft</button>
              <button onClick={handlePublish} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"><Rocket className="w-3.5 h-3.5 inline mr-1" /> Publish Exam</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><FileQuestion className="w-4 h-4 text-purple-600" /> Assign Questions from Bank</h2>
          <button onClick={saveQuestions} disabled={saving} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg">
            {saving ? "Saving..." : `Save Selection (${selectedQIds.length})`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {allQuestions.map((q) => (
            <div
              key={q.id}
              onClick={() => toggleQuestion(q.id)}
              className={`p-3 rounded-xl border cursor-pointer text-xs transition ${
                selectedQIds.includes(q.id) ? "bg-purple-50 border-purple-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center flex-shrink-0 ${selectedQIds.includes(q.id) ? "bg-purple-600" : "bg-slate-200"}`}>
                  {selectedQIds.includes(q.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{q.questionText}</p>
                  <span className="text-[10px] text-slate-400">{q.type} • {q.difficulty} • {q.marks} marks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Recorded Results</h2>
          <p className="text-xs text-slate-500">Manage grades in the <Link href="/admin/results" className="text-rose-600 font-bold hover:underline">Results</Link> section.</p>
        </div>
      )}
    </div>
  );
}
