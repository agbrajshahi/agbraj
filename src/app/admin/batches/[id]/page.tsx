"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  ArrowLeft,
  Clock,
  Building,
  Users,
  GraduationCap,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const batchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/batches/${batchId}`);
      if (!res.ok) throw new Error("Failed to load batch");
      const result = await res.json();
      setData(result);
      setEditForm(result.batch);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast("Batch updated successfully", "success");
      setIsEditOpen(false);
      fetchBatch();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to cancel or delete this batch?")) return;
    try {
      const res = await fetch(`/api/batches/${batchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Batch deleted", "info");
      router.push("/admin/batches");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading batch roster...</p>
      </div>
    );
  }

  if (!data?.batch) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">Batch not found.</p>
        <Link href="/admin/batches" className="mt-3 inline-block text-xs text-amber-600 font-bold">
          ← Back to Batches
        </Link>
      </div>
    );
  }

  const { batch, students = [], attendance = [] } = data;

  const tabs = [
    { id: "overview", label: "Overview & Schedule" },
    { id: "students", label: `Enrolled Students (${students.length})` },
    { id: "attendance", label: `Recent Attendance (${attendance.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/batches"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {batch.name}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {batch.batchCode}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {batch.courseName} • {batch.branchName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Edit className="w-3.5 h-3.5 inline mr-1" /> Edit Batch
          </button>
          <button
            onClick={handleDelete}
            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remove
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-amber-600 text-amber-700 bg-amber-50/20"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">
                Classroom Logistics
              </span>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-800">{batch.schedule}</span>
              </p>
              <p className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{batch.branchName} • {batch.room}</span>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Started: {new Date(batch.startDate).toLocaleDateString()}</span>
              </p>
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span className="text-slate-500">Cohort Status</span>
                <strong className="text-blue-600">{batch.status}</strong>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 uppercase block mb-1">Assigned Instructor</span>
                {batch.teacherName ? (
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {batch.teacherName.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900">{batch.teacherName}</strong>
                      <p className="text-slate-500">{batch.teacherEmail} • {batch.teacherPhone}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No teacher assigned yet.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black text-slate-900">{students.length}</span>
                  <span className="block text-slate-500 mt-1">Enrolled / Cap ({batch.capacity})</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black text-emerald-600">
                    {Math.round((students.length / (batch.capacity || 1)) * 100)}%
                  </span>
                  <span className="block text-slate-500 mt-1">Seat Occupancy</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Student Cohort</h3>
            {students.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No students enrolled in this batch yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map((s: any) => (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <Link href={`/admin/students/${s.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                        {s.name}
                      </Link>
                      <span className="text-slate-400 font-mono ml-2">({s.studentIdCode})</span>
                      <p className="text-slate-500 text-[11px]">Level: {s.currentLevel} • Guardian: {s.guardianName}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Attendance Sessions</h3>
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No attendance logs for this batch yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((rec: any) => (
                    <tr key={rec.id}>
                      <td className="p-3 font-medium text-slate-800">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{rec.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Batch Information">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch Name</label>
            <input
              type="text"
              required
              value={editForm.name || ""}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Schedule</label>
            <input
              type="text"
              required
              value={editForm.schedule || ""}
              onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room</label>
              <input
                type="text"
                value={editForm.room || ""}
                onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacity</label>
              <input
                type="number"
                value={editForm.capacity || ""}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
            <select
              value={editForm.status || "ONGOING"}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="ONGOING">ONGOING</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
