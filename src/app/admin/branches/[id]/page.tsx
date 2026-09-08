"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Users,
  CalendarDays,
  CheckCircle,
  BarChart3,
  Edit,
  Trash2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const branchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchBranch();
  }, [branchId]);

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/branches/${branchId}`);
      if (!res.ok) throw new Error("Failed to load branch details");
      const result = await res.json();
      setData(result);
      setEditForm(result.branch);
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
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update branch");
      toast("Branch updated successfully", "success");
      setIsEditOpen(false);
      fetchBranch();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to deactivate/delete this branch?")) return;
    try {
      const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete branch");
      toast("Branch deleted", "info");
      router.push("/admin/branches");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading branch operations...</p>
      </div>
    );
  }

  if (!data?.branch) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">Branch not found.</p>
        <Link href="/admin/branches" className="mt-3 inline-block text-xs text-emerald-600 font-bold">
          ← Back to Branches
        </Link>
      </div>
    );
  }

  const { branch, students = [], teachers = [], batches = [], courses = [], performance = {} } = data;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "students", label: `Students (${students.length})` },
    { id: "teachers", label: `Teachers (${teachers.length})` },
    { id: "batches", label: `Batches (${batches.length})` },
    { id: "courses", label: `Curriculum (${courses.length})` },
    { id: "performance", label: "Performance & Capacity" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/branches"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {branch.name}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {branch.branchCode}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {branch.city} Campus • Opened {new Date(branch.openingDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Edit className="w-3.5 h-3.5 inline mr-1" /> Edit Branch
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
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/20"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">
                Campus Profile
              </span>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-slate-700">{branch.address}, {branch.city}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{branch.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{branch.email}</span>
              </p>
              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-400 block text-[11px]">Facility Status</span>
                <span className="font-bold text-emerald-600">{branch.status}</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <span className="font-bold text-slate-900 uppercase block mb-1">Facility Description</span>
                <p className="text-slate-600 leading-relaxed">{branch.description || "Fully equipped smart mental abacus learning center."}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black text-slate-900">{students.length}</span>
                  <span className="block text-xs text-slate-500 mt-1">Students Enrolled</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black text-slate-900">{teachers.length}</span>
                  <span className="block text-xs text-slate-500 mt-1">Certified Instructors</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-2xl font-black text-slate-900">{batches.length}</span>
                  <span className="block text-xs text-slate-500 mt-1">Active Batches</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Students at {branch.name}</h3>
            {students.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No students enrolled in this branch yet.
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
                      <p className="text-slate-500 text-[11px]">Level: {s.currentLevel}</p>
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

        {activeTab === "teachers" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Branch Teaching Staff</h3>
            {teachers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No teachers assigned to this branch.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teachers.map((t: any) => (
                  <div key={t.id} className="p-4 border border-slate-200 rounded-xl bg-white text-xs">
                    <Link href={`/admin/teachers/${t.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600">
                      {t.name}
                    </Link>
                    <p className="text-slate-500 mt-0.5">{t.qualification}</p>
                    <p className="text-slate-400 text-[11px] mt-1">{t.email} • {t.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "batches" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Branch Batch Timetables</h3>
            {batches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No batches scheduled for this branch.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {batches.map((b: any) => (
                  <div key={b.id} className="p-4 border border-slate-200 rounded-xl bg-white text-xs">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{b.schedule}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Room: {b.room} • Cap: {b.capacity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "courses" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Curriculum Supported</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((c: any) => (
                <div key={c.id} className="p-4 border border-slate-200 rounded-xl bg-white text-xs">
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-slate-500 mt-1">{c.description}</p>
                  <p className="text-blue-600 font-bold mt-2">${c.fee} • {c.duration}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Capacity & Student Density</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Facility Seat Utilization</span>
                <span className="font-black text-slate-900 text-sm">
                  {performance.capacityUtilization || 65}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${performance.capacityUtilization || 65}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-2">
                <div>
                  <span className="block font-bold text-slate-900 text-sm">{performance.totalStudents}</span>
                  <span className="text-slate-500 text-[10px]">Total Students</span>
                </div>
                <div>
                  <span className="block font-bold text-emerald-600 text-sm">{performance.activeStudents}</span>
                  <span className="text-slate-500 text-[10px]">Active Students</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-900 text-sm">{performance.totalBatches}</span>
                  <span className="text-slate-500 text-[10px]">Batches</span>
                </div>
                <div>
                  <span className="block font-bold text-indigo-600 text-sm">{performance.totalTeachers}</span>
                  <span className="text-slate-500 text-[10px]">Teachers</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Branch Information">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branch Name</label>
            <input
              type="text"
              required
              value={editForm.name || ""}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
              <input
                type="text"
                required
                value={editForm.city || ""}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="tel"
                required
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
            <input
              type="text"
              required
              value={editForm.address || ""}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
            <select
              value={editForm.status || "ACTIVE"}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
