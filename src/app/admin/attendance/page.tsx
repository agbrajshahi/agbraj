"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Save,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export default function AttendancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mark" | "records" | "reports">("mark");

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<any[]>([]);
  const [markState, setMarkState] = useState<Record<number, { status: string; remarks: string }>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [reports, setReports] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    fetchBatches();
    fetchRecords();
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedBatch) fetchBatchStudents(selectedBatch);
  }, [selectedBatch]);

  const fetchBatches = async () => {
    const res = await fetch("/api/batches");
    const data = await res.json();
    setBatches(data.batches || []);
    if (data.batches?.length > 0) setSelectedBatch(data.batches[0].id.toString());
  };

  const fetchBatchStudents = async (batchId: string) => {
    try {
      setLoadingStudents(true);
      const res = await fetch(`/api/batches/${batchId}`);
      const data = await res.json();
      setStudents(data.students || []);
      const initial: Record<number, { status: string; remarks: string }> = {};
      (data.students || []).forEach((s: any) => {
        initial[s.id] = { status: "PRESENT", remarks: "" };
      });
      setMarkState(initial);
    } catch {
      toast("Failed to load batch roster", "error");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoadingRecords(true);
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setRecords(data.attendance || []);
    } catch {
      toast("Failed to load attendance records", "error");
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch("/api/attendance/reports");
      const data = await res.json();
      setReports(data);
    } catch {
      toast("Failed to load attendance reports", "error");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatch || students.length === 0) {
      toast("Select a batch with enrolled students first", "error");
      return;
    }
    try {
      setSaving(true);
      const entries = students.map((s) => ({
        studentId: s.id,
        status: markState[s.id]?.status || "PRESENT",
        remarks: markState[s.id]?.remarks || "",
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: selectedBatch, date: selectedDate, records: entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save attendance");

      toast(`Attendance recorded for ${entries.length} students!`, "success");
      fetchRecords();
      fetchReports();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ABSENT": return "bg-rose-50 text-rose-700 border-rose-200";
      case "LATE": return "bg-amber-50 text-amber-700 border-amber-200";
      case "EXCUSED": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const tabs = [
    { id: "mark", label: "Mark Attendance" },
    { id: "records", label: `Records (${records.length})` },
    { id: "reports", label: "Reports & Percentages" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <ClipboardCheck className="w-7 h-7 text-blue-600" /> Attendance Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Mark daily attendance by batch, review historical records, and analyze percentages
        </p>
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? "border-blue-600 text-blue-600 bg-blue-50/20" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {/* MARK ATTENDANCE TAB */}
        {activeTab === "mark" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} — {b.branchName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Session Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {loadingStudents ? (
              <div className="p-10 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No students enrolled in this batch.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                      <th className="p-3">Student</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{s.studentIdCode}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                onClick={() =>
                                  setMarkState((prev) => ({ ...prev, [s.id]: { ...prev[s.id], status: opt } }))
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  markState[s.id]?.status === opt
                                    ? statusColor(opt)
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Optional remarks..."
                            value={markState[s.id]?.remarks || ""}
                            onChange={(e) =>
                              setMarkState((prev) => ({ ...prev, [s.id]: { ...prev[s.id], remarks: e.target.value } }))
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {students.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === "records" && (
          <div className="space-y-4">
            {loadingRecords ? (
              <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /></div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">No attendance records found.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.slice(0, 100).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-900">{r.studentName} <span className="text-slate-400 font-mono text-[10px]">({r.studentCode})</span></td>
                      <td className="p-3 text-slate-700">{r.batchName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="p-3 text-slate-500">{r.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-8">
            {loadingReports ? (
              <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /></div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-blue-600" /> Student Attendance %</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reports?.studentStats?.filter((s: any) => s.totalSessions > 0).map((s: any) => (
                      <div key={s.studentId} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{s.studentName}</span>
                          <span className={`font-black ${s.attendancePercentage >= 75 ? "text-emerald-600" : "text-rose-600"}`}>{s.attendancePercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${s.attendancePercentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-indigo-600" /> Batch Attendance %</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reports?.batchStats?.map((b: any) => (
                      <div key={b.batchId} className="p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-xs">{b.batchName}</span>
                        <span className="font-black text-indigo-600 text-xs">{b.attendancePercentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Branch Attendance %</h3>
                    <div className="space-y-2">
                      {reports?.branchStats?.map((b: any) => (
                        <div key={b.branchId} className="p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                          <span className="font-bold text-slate-800">{b.branchName}</span>
                          <span className="font-black text-emerald-600">{b.attendancePercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Teacher Attendance %</h3>
                    <div className="space-y-2">
                      {reports?.teacherStats?.map((t: any) => (
                        <div key={t.teacherId} className="p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                          <span className="font-bold text-slate-800">{t.teacherName}</span>
                          <span className="font-black text-amber-600">{t.attendancePercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
