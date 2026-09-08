"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Loader2,
  Save,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ResultsPage() {
  const { toast } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [entries, setEntries] = useState<Record<number, { marks: string; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchExamData(selectedExam);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      const data = await res.json();
      setExams(data.exams || []);
      if (data.exams?.length) setSelectedExam(data.exams[0].id.toString());
    } catch {
      toast("Failed to load exams", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamData = async (examId: string) => {
    try {
      const [resExam, resResults] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/results?examId=${examId}`),
      ]);
      const examData = await resExam.json();
      const resultsRes = await resResults.json();
      setStudents(examData.students || []);
      setResultsData(resultsRes.results || []);

      const initial: Record<number, { marks: string; remarks: string }> = {};
      (examData.students || []).forEach((s: any) => {
        const existing = (resultsRes.results || []).find((r: any) => r.studentId === s.id);
        initial[s.id] = { marks: existing?.marksObtained || "", remarks: existing?.remarks || "" };
      });
      setEntries(initial);
    } catch {
      toast("Failed to load exam roster", "error");
    }
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      const entriesArr = students.map((s) => ({
        studentId: s.id,
        marksObtained: entries[s.id]?.marks || "0",
        remarks: entries[s.id]?.remarks || "",
      }));
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExam, entries: entriesArr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save marks");
      toast("Grades saved as draft!", "success");
      fetchExamData(selectedExam);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const publishResult = async (resultId: number) => {
    try {
      const res = await fetch(`/api/results/${resultId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      toast("Result published to student!", "success");
      fetchExamData(selectedExam);
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const publishAll = async () => {
    const draftResults = resultsData.filter((r) => r.status === "DRAFT");
    if (draftResults.length === 0) {
      toast("No draft results to publish. Save grades first.", "error");
      return;
    }
    for (const r of draftResults) {
      await publishResult(r.id);
    }
    toast(`Published ${draftResults.length} results!`, "success");
  };

  const selectedExamData = exams.find((e) => e.id.toString() === selectedExam);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Award className="w-7 h-7 text-amber-600" /> Results & Grading
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Enter marks, auto-calculate grades, and publish results to students and parents
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="max-w-md w-full">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Exam</label>
              <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl">
                {exams.map((e) => <option key={e.id} value={e.id}>{e.title} — {e.batchName}</option>)}
              </select>
            </div>
            {selectedExamData && (
              <div className="flex gap-2">
                <button onClick={handleSaveMarks} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Grades"}
                </button>
                <button onClick={publishAll} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">
                  <Send className="w-4 h-4" /> Publish All
                </button>
              </div>
            )}
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">No students in this exam's batch.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Marks (out of {selectedExamData?.totalMarks})</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const existing = resultsData.find((r) => r.studentId === s.id);
                  return (
                    <tr key={s.id}>
                      <td className="p-3 font-bold text-slate-900">{s.name} <span className="text-slate-400 font-mono text-[10px]">({s.studentIdCode})</span></td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={entries[s.id]?.marks || ""}
                          onChange={(e) => setEntries((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value } }))}
                          className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                        />
                        {existing && <span className="ml-2 text-[10px] font-bold text-amber-600">{existing.grade}</span>}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={entries[s.id]?.remarks || ""}
                          onChange={(e) => setEntries((prev) => ({ ...prev, [s.id]: { ...prev[s.id], remarks: e.target.value } }))}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                          placeholder="Teacher remarks..."
                        />
                      </td>
                      <td className="p-3">
                        {existing ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${existing.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {existing.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not graded</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {existing && existing.status === "DRAFT" && (
                          <button onClick={() => publishResult(existing.id)} className="text-emerald-600 font-bold text-xs hover:underline">
                            Publish
                          </button>
                        )}
                        {existing && existing.status === "PUBLISHED" && (
                          <span className="text-emerald-600 flex items-center gap-1 justify-end text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Live</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
