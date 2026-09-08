"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  Award,
  CalendarDays,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ParentDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parent/dashboard");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load dashboard");
      setData(result);
      if (result.children?.length) setSelectedChildId(result.children[0].id);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" /></div>;
  if (!data || data.children?.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800">No linked children found on your account.</p>
        <p className="text-xs text-slate-500 mt-1">Please contact your branch administrator to link your child's profile.</p>
      </div>
    );
  }

  const child = data.children.find((c: any) => c.id === selectedChildId) || data.children[0];

  const tabs = [
    { id: "overview", label: "Academic Overview", icon: GraduationCap },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "exams", label: "Exams", icon: FileSpreadsheet },
    { id: "results", label: "Results", icon: Award },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "materials", label: "Study Materials", icon: FolderOpen },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Parent Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Monitor your children's academic performance and progress</p>
      </div>

      {/* Children Selector */}
      <div className="flex gap-3 flex-wrap">
        {data.children.map((c: any) => (
          <button key={c.id} onClick={() => setSelectedChildId(c.id)} className={`flex items-center gap-3 p-3 rounded-2xl border transition ${selectedChildId === c.id ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"}`}>
            <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center overflow-hidden ${selectedChildId === c.id ? "bg-white/20" : "bg-emerald-100 text-emerald-700"}`}>
              {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover" /> : c.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold">{c.name}</p>
              <p className={`text-[10px] ${selectedChildId === c.id ? "text-white/80" : "text-slate-500"}`}>{c.currentLevel}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-2 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100"><span className="text-xs font-bold text-emerald-900 uppercase block">Attendance</span><p className="text-2xl font-black text-emerald-700 mt-1">{child.attendancePercentage}%</p></div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100"><span className="text-xs font-bold text-blue-900 uppercase block">Course</span><p className="text-sm font-black text-blue-700 mt-2">{child.courseName}</p></div>
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-100"><span className="text-xs font-bold text-teal-900 uppercase block">Assignments</span><p className="text-2xl font-black text-teal-700 mt-1">{child.assignments.length}</p></div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100"><span className="text-xs font-bold text-amber-900 uppercase block">Results Published</span><p className="text-2xl font-black text-amber-700 mt-1">{child.results.length}</p></div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="max-w-md">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700">Overall Attendance</span><span className="font-black text-emerald-600">{child.attendancePercentage}%</span></div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden"><div className="bg-emerald-600 h-full rounded-full" style={{ width: `${child.attendancePercentage}%` }} /></div>
              <p className="text-slate-500 mt-2">{child.attendanceTotal} sessions recorded</p>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-3">
            {child.assignments.length === 0 ? <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl">No assignments posted.</p> : child.assignments.map((a: any) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{a.title}</p>
                <p className="text-slate-500 mt-1">Due {new Date(a.deadline).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "exams" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {child.exams.length === 0 ? <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl col-span-2">No published exams.</p> : child.exams.map((e: any) => (
              <div key={e.id} className="p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{e.title}</p>
                <p className="text-slate-500 mt-1">{new Date(e.examDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "results" && (
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]"><th className="p-3">Marks</th><th className="p-3">Percentage</th><th className="p-3">Grade</th><th className="p-3">Remarks</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {child.results.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-slate-500">No published results yet.</td></tr> : child.results.map((r: any) => (
                <tr key={r.id}><td className="p-3 font-bold">{r.marksObtained}/{r.totalMarks}</td><td className="p-3">{r.percentage}%</td><td className="p-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">{r.grade}</span></td><td className="p-3 text-slate-500">{r.remarks}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-3">
            {child.schedule.length === 0 ? <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl">No classes scheduled.</p> : child.schedule.map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="font-bold text-slate-900">{new Date(s.date).toLocaleDateString()} • {s.startTime}-{s.endTime}</span>
                <span className="text-slate-500">{s.room}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "materials" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {child.materials.length === 0 ? <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl col-span-3">No materials available.</p> : child.materials.map((m: any) => (
              <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition block text-xs">
                <p className="font-bold text-slate-900">{m.title}</p>
                <span className="text-emerald-600 font-bold mt-2 block">Open File →</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
