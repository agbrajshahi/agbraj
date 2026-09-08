"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  Award,
  FolderOpen,
  FileText,
  CreditCard,
  User,
  Loader2,
  Upload,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export default function StudentDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [submittingAssignment, setSubmittingAssignment] = useState<any>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionFile, setSubmissionFile] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/dashboard");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load dashboard");
      setData(result);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/assignments/${submittingAssignment.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: submissionNote, fileUrl: submissionFile }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to submit");
      toast("Assignment submitted successfully!", "success");
      setSubmittingAssignment(null);
      setSubmissionNote("");
      setSubmissionFile("");
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;
  if (!data?.student) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">No student profile linked to your account.</p>
        <p className="text-xs text-slate-500 mt-1">Please contact your branch administrator.</p>
      </div>
    );
  }

  const { student, teacher, attendance, assignments, exams, results, materials, schedule, documents } = data;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "courses", label: "My Courses & Batch", icon: BookOpen },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "exams", label: "Exams", icon: FileSpreadsheet },
    { id: "results", label: "Results", icon: Award },
    { id: "materials", label: "Study Materials", icon: FolderOpen },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center overflow-hidden border-2 border-white shadow">
          {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : student.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Welcome back, {student.name.split(" ")[0]}!</h1>
          <p className="text-xs text-slate-500">{student.studentIdCode} • {student.currentLevel} • {student.branchName}</p>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-2 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-xs font-bold text-blue-900 uppercase block">Attendance</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{attendance.percentage}%</p>
              <span className="text-[11px] text-slate-500">{attendance.present}/{attendance.total} sessions</span>
            </div>
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
              <span className="text-xs font-bold text-teal-900 uppercase block">Assignments</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{assignments.length}</p>
              <span className="text-[11px] text-slate-500">{assignments.filter((a: any) => a.mySubmission?.status === "SUBMITTED" || a.mySubmission?.status === "REVIEWED").length} completed</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
              <span className="text-xs font-bold text-rose-900 uppercase block">Exams</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{exams.length}</p>
              <span className="text-[11px] text-slate-500">Published assessments</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-xs font-bold text-amber-900 uppercase block">Results</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{results.length}</p>
              <span className="text-[11px] text-slate-500">Published grades</span>
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 uppercase block mb-1">Enrolled Course</span>
              <p className="text-sm font-bold text-blue-700">{student.courseName}</p>
              <p className="text-slate-500 mt-1">Level: {student.currentLevel}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 uppercase block mb-1">Batch & Instructor</span>
              <p className="text-sm font-bold text-slate-900">{student.batchName}</p>
              <p className="text-slate-500 mt-1">{student.batchSchedule}</p>
              {teacher && <p className="text-slate-500 mt-1">Instructor: {teacher.name}</p>}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-3">
            {schedule.length === 0 ? <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl">No classes scheduled.</p> : schedule.map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{new Date(s.date).toLocaleDateString()} • {s.startTime}-{s.endTime}</p>
                  <p className="text-slate-500">{s.topic || "Regular Session"} • {s.room}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">{s.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "attendance" && (
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]"><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Remarks</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.records.map((r: any) => (
                <tr key={r.id}><td className="p-3 font-medium">{new Date(r.date).toLocaleDateString()}</td><td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "PRESENT" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{r.status}</span></td><td className="p-3 text-slate-500">{r.remarks || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.map((a: any) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{a.title}</p>
                  <p className="text-slate-500 mt-0.5">{a.description}</p>
                  <p className="text-slate-400 mt-1">Due {new Date(a.deadline).toLocaleDateString()} • {a.maxMarks} marks</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  {a.mySubmission?.status === "REVIEWED" ? (
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 block mb-1">Graded: {a.mySubmission.marksObtained}/{a.maxMarks}</span>
                      {a.mySubmission.feedback && <p className="text-[10px] text-slate-500 max-w-[150px]">{a.mySubmission.feedback}</p>}
                    </div>
                  ) : a.mySubmission?.status === "SUBMITTED" || a.mySubmission?.status === "LATE" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">{a.mySubmission.status}</span>
                  ) : (
                    <button onClick={() => setSubmittingAssignment(a)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Submit</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "exams" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exams.map((e: any) => (
              <div key={e.id} className="p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900 text-sm">{e.title}</p>
                <p className="text-slate-500 mt-1">{new Date(e.examDate).toLocaleDateString()} • {e.durationMinutes} min • {e.totalMarks} marks</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "results" && (
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]"><th className="p-3">Marks</th><th className="p-3">Percentage</th><th className="p-3">Grade</th><th className="p-3">Remarks</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r: any) => (
                <tr key={r.id}><td className="p-3 font-bold">{r.marksObtained}/{r.totalMarks}</td><td className="p-3">{r.percentage}%</td><td className="p-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">{r.grade}</span></td><td className="p-3 text-slate-500">{r.remarks}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "materials" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m: any) => (
              <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition block text-xs">
                <p className="font-bold text-slate-900">{m.title}</p>
                <p className="text-slate-500 mt-1">{m.description}</p>
                <span className="text-blue-600 font-bold mt-2 block">Open File →</span>
              </a>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length === 0 ? <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl col-span-3">No documents on file.</p> : documents.map((d: any) => (
              <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition block text-xs">
                <p className="font-bold text-slate-900">{d.title}</p>
                <span className="text-blue-600 font-bold mt-1 block">View →</span>
              </a>
            ))}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-xs text-center">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Tuition: ${student.courseFee}</p>
            <p className="text-slate-500 mt-1">Payments module architecture ready for Phase 3 Finance integration.</p>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-2 gap-4 text-xs max-w-xl">
            <div><span className="text-slate-500 block">Guardian</span><strong>{student.guardianName}</strong></div>
            <div><span className="text-slate-500 block">Guardian Phone</span><strong>{student.guardianPhone}</strong></div>
            <div><span className="text-slate-500 block">Admission Date</span><strong>{new Date(student.admissionDate).toLocaleDateString()}</strong></div>
            <div><span className="text-slate-500 block">Status</span><strong className="text-emerald-600">{student.status}</strong></div>
          </div>
        )}
      </div>

      {submittingAssignment && (
        <Modal isOpen={!!submittingAssignment} onClose={() => setSubmittingAssignment(null)} title={`Submit: ${submittingAssignment.title}`}>
          <form onSubmit={handleSubmitAssignment} className="space-y-4 text-xs">
            <FileUpload label="Upload Your Work" entityType="GENERAL" category="SUBMISSION" onSuccess={(url) => setSubmissionFile(url)} />
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Note (Optional)</label>
              <textarea rows={3} value={submissionNote} onChange={(e) => setSubmissionNote(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="Any comments for your instructor..." />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setSubmittingAssignment(null)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl">{submitting ? "Submitting..." : "Submit Assignment"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
