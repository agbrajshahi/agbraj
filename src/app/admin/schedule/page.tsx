"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Plus,
  Clock,
  Building,
  Users,
  Loader2,
  Calendar,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function SchedulePage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    courseId: "",
    batchId: "",
    teacherId: "",
    branchId: "",
    room: "Room A1",
    date: new Date().toISOString().slice(0, 10),
    startTime: "16:00",
    endTime: "17:30",
    topic: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resSch, resBtc, resCrs, resTch, resBr] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/batches"),
        fetch("/api/courses"),
        fetch("/api/teachers"),
        fetch("/api/branches"),
      ]);
      setSchedules((await resSch.json()).schedules || []);
      const btcData = (await resBtc.json()).batches || [];
      setBatches(btcData);
      setCourses((await resCrs.json()).courses || []);
      setTeachers((await resTch.json()).teachers || []);
      const brData = (await resBr.json()).branches || [];
      setBranches(brData);

      if (btcData.length && !formData.batchId) {
        setFormData((prev) => ({
          ...prev,
          batchId: btcData[0].id.toString(),
          courseId: btcData[0].courseId.toString(),
          branchId: btcData[0].branchId.toString(),
          teacherId: btcData[0].teacherId?.toString() || "",
        }));
      }
    } catch {
      toast("Failed to load schedule data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create schedule");
      toast("Class session scheduled successfully!", "success");
      setIsCreateOpen(false);
      fetchAll();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Cancel this scheduled session?")) return;
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Session removed", "info");
      fetchAll();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  // Filter based on view mode
  const now = new Date();
  const getRangeEnd = () => {
    const end = new Date(now);
    if (viewMode === "daily") end.setDate(now.getDate() + 1);
    if (viewMode === "weekly") end.setDate(now.getDate() + 7);
    if (viewMode === "monthly") end.setMonth(now.getMonth() + 1);
    return end;
  };
  const rangeEnd = getRangeEnd();
  const filteredSchedules = schedules.filter((s) => {
    const d = new Date(s.date);
    return d >= new Date(now.toDateString()) && d <= rangeEnd;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-slate-100 text-slate-600";
      case "CANCELLED": return "bg-rose-50 text-rose-700";
      case "ONGOING": return "bg-amber-50 text-amber-700";
      default: return "bg-blue-50 text-blue-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-7 h-7 text-indigo-600" /> Class Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Coordinate teacher, room, and batch timings with automatic conflict prevention
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm inline-flex gap-1">
        {(["daily", "weekly", "monthly"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
              viewMode === v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {v} View
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>
      ) : filteredSchedules.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No sessions scheduled in this range</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
          {filteredSchedules.map((s) => (
            <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center flex-shrink-0 border border-indigo-100">
                  <span className="text-[10px] font-bold uppercase">{new Date(s.date).toLocaleDateString(undefined, { month: "short" })}</span>
                  <span className="text-base font-black">{new Date(s.date).getDate()}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{s.batchName} — {s.courseName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.topic || "Regular class session"}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.startTime} - {s.endTime}</span>
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {s.branchName} • {s.room}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.teacherName || "Unassigned"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor(s.status)}`}>{s.status}</span>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Schedule Class Session" description="Assign course, batch, instructor, room, and time slot">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Batch *</label>
              <select
                required
                value={formData.batchId}
                onChange={(e) => {
                  const batch = batches.find((b) => b.id.toString() === e.target.value);
                  setFormData({
                    ...formData,
                    batchId: e.target.value,
                    courseId: batch?.courseId?.toString() || "",
                    branchId: batch?.branchId?.toString() || "",
                    teacherId: batch?.teacherId?.toString() || "",
                    room: batch?.room || "Room A1",
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Instructor</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Room</label>
              <input type="text" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Start Time *</label>
              <input type="time" required value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">End Time *</label>
              <input type="time" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Session Topic</label>
            <input type="text" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g. Complement of 10 Drills" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl">
              {submitting ? "Scheduling..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
