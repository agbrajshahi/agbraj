"use client";

import React, { useState, useEffect } from "react";
import {
  FileQuestion,
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function QuestionBankPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    questionText: "",
    type: "MCQ",
    subject: "Mental Arithmetic",
    courseId: "",
    difficulty: "MEDIUM",
    marks: "2",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
  });

  useEffect(() => {
    fetchData();
  }, [difficultyFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (difficultyFilter !== "ALL") params.append("difficulty", difficultyFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);

      const [resQ, resC] = await Promise.all([
        fetch(`/api/questions?${params.toString()}`),
        fetch("/api/courses"),
      ]);
      setQuestions((await resQ.json()).questions || []);
      const cData = (await resC.json()).courses || [];
      setCourses(cData);
      if (cData.length && !formData.courseId) setFormData((p) => ({ ...p, courseId: cData[0].id.toString() }));
    } catch {
      toast("Failed to load question bank", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        options: (formData.type === "MCQ" || formData.type === "MULTIPLE_CHOICE") ? formData.options.filter((o) => o.trim()) : null,
      };
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create question");
      toast("Question added to bank!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question permanently?")) return;
    try {
      await fetch(`/api/questions/${id}`, { method: "DELETE" });
      toast("Question deleted", "info");
      fetchData();
    } catch {
      toast("Failed to delete question", "error");
    }
  };

  const filteredQuestions = questions.filter((q) => q.questionText.toLowerCase().includes(search.toLowerCase()));

  const difficultyColor = (d: string) => {
    if (d === "EASY") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (d === "HARD") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileQuestion className="w-7 h-7 text-purple-600" /> Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curated repository of MCQ, multiple-choice, written, and short-answer questions
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search question bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl">
          <option value="ALL">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl">
          <option value="ALL">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="WRITTEN">Written</option>
          <option value="SHORT_ANSWER">Short Answer</option>
        </select>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{q.type}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{q.marks} marks</span>
                    <span className="text-[10px] text-slate-400">• {q.courseName}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{q.questionText}</p>
                  {q.options && Array.isArray(q.options) && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {q.options.map((opt: string, idx: number) => (
                        <div key={idx} className={`px-2.5 py-1.5 rounded-lg text-xs border ${opt === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                          {opt === q.correctAnswer && <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" />}
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.explanation && <p className="mt-2 text-[11px] text-slate-500 italic">💡 {q.explanation}</p>}
                </div>
                <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Question to Bank" maxWidth="2xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Question Text *</label>
            <textarea required rows={2} value={formData.questionText} onChange={(e) => setFormData({ ...formData, questionText: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="e.g. What is 45 + 27?" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                <option value="MCQ">MCQ</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="WRITTEN">Written</option>
                <option value="SHORT_ANSWER">Short Answer</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Difficulty</label>
              <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Marks</label>
              <input type="number" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Course</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {(formData.type === "MCQ" || formData.type === "MULTIPLE_CHOICE") && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Answer Options</label>
              <div className="space-y-2">
                {formData.options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...formData.options];
                      newOpts[idx] = e.target.value;
                      setFormData({ ...formData, options: newOpts });
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                ))}
              </div>
              <label className="block font-bold text-slate-700 uppercase mb-1 mt-2">Correct Answer</label>
              <input type="text" value={formData.correctAnswer} onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })} placeholder="Must match one option exactly" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          )}

          {(formData.type === "SHORT_ANSWER") && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Correct Answer</label>
              <input type="text" value={formData.correctAnswer} onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Explanation</label>
            <textarea rows={2} value={formData.explanation} onChange={(e) => setFormData({ ...formData, explanation: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl">
              {submitting ? "Saving..." : "Add to Bank"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
