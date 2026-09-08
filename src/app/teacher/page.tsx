"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  FileQuestion,
  Award,
  FolderOpen,
  CalendarDays,
  User,
  Loader2,
  Save,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [selectedBatch, setSelectedBatch] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [markState, setMarkState] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBatch) loadBatchStudents(selectedBatch);
  }, [selectedBatch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/dashboard");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load dashboard");
      setData(result);
      if (result.batches?.length) setSelectedBatch(result.batches[0].id.toString());
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadBatchStudents = async (batchId: string) => {
    const res = await fetch(`/api/batches/${batchId}`);
    const d = await res.json();
    setBatchStudents(d.students || []);
    const initial: Record<number, string> = {};
    (d.students || []).forEach((s: any) => (initial[s.id] = "PRESENT"));
    setMarkState(initial);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const records = batchStudents.map((s) => ({ studentId: s.id, status: markState[s.id] || "PRESENT" }));
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: selectedBatch, date: attendanceDate, records }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save attendance");
      toast("Attendance saved successfully!", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>;
  if (!data?.teacher) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">No teacher profile linked to your account.</p>
        <p className="text-xs text-slate-500 mt-1">Please contact your branch administrator.</p>
      </div>
    );
  }

  const { teacher, batches, students, assignments, exams, schedule, attendanceCount, pendingReviewCount } = data;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "classes", label: "My Classes & Batches", icon: CalendarDays },
    { id: "students", label: "My Students", icon: GraduationCap },
    { id: "attendance", label: "Mark Attendance", icon: ClipboardCheck },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "exams", label: "Exams & Question Bank", icon: FileSpreadsheet },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center overflow-hidden border-2 border-white shadow">
          {teacher.photoUrl ? <img src={teacher.photoUrl} className="w-full h-full object-cover" /> : teacher.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Welcome, {teacher.name.split(" ")[0]}!</h1>
          <p className="text-xs text-slate-500">{teacher.teacherIdCode} • {teacher.qualification}</p>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-2 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100"><span className="text-xs font-bold text-indigo-900 uppercase block">My Batches</span><p className="text-2xl font-black text-indigo-700 mt-1">{batches.length}</p></div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100"><span className="text-xs font-bold text-blue-900 uppercase block">My Students</span><p className="text-2xl font-black text-blue-700 mt-1">{students.length}</p></div>
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-100"><span className="text-xs font-bold text-teal-900 uppercase block">Assignments</span><p className="text-2xl font-black text-teal-700 mt-1">{assignments.length}</p></div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100"><span className="text-xs font-bold text-amber-900 uppercase block">Pending Reviews</span><p className="text-2xl font-black text-amber-700 mt-1">{pendingReviewCount}</p></div>
          </div>
        )}

        {activeTab === "classes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {batches.map((b: any) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900 text-sm">{b.name}</p>
                <p className="text-slate-500 mt-1">{b.courseName} • {b.branchName}</p>
                <p className="text-slate-400 mt-1">{b.schedule} • Room {b.room}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "students" && (
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]"><th className="p-3">Student</th><th className="p-3">Level</th><th className="p-3">Guardian</th><th className="p-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s: any) => (
                <tr key={s.id}><td className="p-3 font-bold text-slate-900">{s.name} <span className="text-slate-400 font-mono text-[10px]">({s.studentIdCode})</span></td><td className="p-3">{s.currentLevel}</td><td className="p-3">{s.guardianName}</td><td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{s.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch</label>
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl">
                  {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              </div>
            </div>
            {batchStudents.length > 0 && (
              <>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]"><th className="p-3">Student</th><th className="p-3">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchStudents.map((s) => (
                        <tr key={s.id}>
                          <td className="p-3 font-bold text-slate-900">{s.name}</td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              {STATUS_OPTIONS.map((opt) => (
                                <button key={opt} onClick={() => setMarkState((p) => ({ ...p, [s.id]: opt }))} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${markState[s.id] === opt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"}`}>{opt}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={handleSaveAttendance} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Attendance"}</button>
              </>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.map((a: any) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{a.title}</p>
                <p className="text-slate-500 mt-1">Due {new Date(a.deadline).toLocaleDateString()} • {a.maxMarks} marks</p>
                <a href={`/admin/assignments/${a.id}`} className="text-indigo-600 font-bold mt-2 inline-block">Review Submissions →</a>
              </div>
            ))}
          </div>
        )}

        {activeTab === "exams" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <a href="/admin/exams" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold">Manage Exams</a>
              <a href="/admin/question-bank" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold">Question Bank</a>
              <a href="/admin/results" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold">Grade Results</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exams.map((e: any) => (
                <div key={e.id} className="p-4 rounded-xl border border-slate-200 text-xs">
                  <p className="font-bold text-slate-900">{e.title}</p>
                  <p className="text-slate-500 mt-1">{new Date(e.examDate).toLocaleDateString()} • {e.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-3">
            {schedule.map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="font-bold text-slate-900">{new Date(s.date).toLocaleDateString()} • {s.startTime}-{s.endTime}</span>
                <span className="text-slate-500">{s.room}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-2 gap-4 text-xs max-w-xl">
            <div><span className="text-slate-500 block">Email</span><strong>{teacher.email}</strong></div>
            <div><span className="text-slate-500 block">Phone</span><strong>{teacher.phone}</strong></div>
            <div><span className="text-slate-500 block">Experience</span><strong>{teacher.experience}</strong></div>
            <div><span className="text-slate-500 block">Status</span><strong className="text-emerald-600">{teacher.status}</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
