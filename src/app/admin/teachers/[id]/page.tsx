"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  Calendar,
  Building,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Activity,
  Edit,
  Trash2,
  Loader2,
  CalendarDays,
  Upload,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const teacherId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  useEffect(() => {
    fetchTeacher();
  }, [teacherId]);

  const fetchTeacher = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teachers/${teacherId}`);
      if (!res.ok) throw new Error("Failed to load instructor");
      const result = await res.json();
      setData(result);
      setEditForm(result.teacher);
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
      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast("Instructor updated successfully", "success");
      setIsEditOpen(false);
      fetchTeacher();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this instructor?")) return;
    try {
      const res = await fetch(`/api/teachers/${teacherId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Instructor removed", "info");
      router.push("/admin/teachers");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Retrieving instructor profile...</p>
      </div>
    );
  }

  if (!data?.teacher) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">Instructor not found.</p>
        <Link href="/admin/teachers" className="mt-3 inline-block text-xs text-indigo-600 font-bold">
          ← Back to Teachers
        </Link>
      </div>
    );
  }

  const { teacher, batches = [], documents = [], activity = [] } = data;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "personal", label: "Personal" },
    { id: "batches", label: `Assigned Batches (${batches.length})` },
    { id: "documents", label: `Documents (${documents.length})` },
    { id: "activity", label: `Activity (${activity.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/teachers"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {teacher.name}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {teacher.teacherIdCode}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {teacher.qualification || "Instructor"} • {teacher.branchName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition"
          >
            <Edit className="w-3.5 h-3.5 inline mr-1" /> Edit Profile
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
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
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
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div className="w-24 h-24 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-2xl flex items-center justify-center border-2 border-white shadow-md overflow-hidden mb-4">
                {teacher.photoUrl ? (
                  <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  teacher.name.charAt(0)
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">{teacher.name}</h2>
              <span className="text-xs font-mono text-slate-400 mt-0.5">{teacher.teacherIdCode}</span>
              <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {teacher.status}
              </span>

              <div className="w-full mt-6 pt-4 border-t border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch:</span>
                  <span className="font-semibold text-slate-800">{teacher.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Experience:</span>
                  <span className="font-semibold text-slate-800">{teacher.experience || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Qualifications & Bio
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">{teacher.qualification}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {teacher.bio || "Senior Soroban abacus instructor dedicated to mental arithmetic excellence."}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Email</span>
                    <strong className="text-slate-800">{teacher.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <strong className="text-slate-800">{teacher.phone}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Address</span>
                    <strong className="text-slate-800">{teacher.address || "Branch Registered Address"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "personal" && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Personal & Employment Record</h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-slate-500 block">Joining Date</span>
                <span className="font-semibold text-slate-900">
                  {new Date(teacher.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Experience</span>
                <span className="font-semibold text-slate-900">{teacher.experience}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="font-semibold text-slate-900">{teacher.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="font-semibold text-slate-900">{teacher.phone}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "batches" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Assigned Batches</h3>
            {batches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No active batches currently assigned to this instructor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {batches.map((b: any) => (
                  <div key={b.id} className="p-4 border border-slate-200 rounded-xl bg-white text-xs">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-900 text-sm">{b.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">{b.schedule}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Room: {b.room}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Certificates & Verification Files</h3>
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                <Upload className="w-3.5 h-3.5 inline mr-1" /> Upload Document
              </button>
            </div>
            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No documents uploaded.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 border border-slate-200 rounded-xl flex items-start space-x-3 bg-white">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div className="truncate flex-1 text-xs">
                      <p className="font-bold text-slate-900 truncate">{doc.title}</p>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-[11px] font-bold hover:underline">
                        View Document →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>
            {activity.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No activity records found.
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((act: any) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800">
                      {act.userName || "System"} • <span className="text-indigo-600 uppercase font-mono">{act.action}</span>
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{act.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Instructor Details"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name</label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qualification</label>
            <input
              type="text"
              value={editForm.qualification || ""}
              onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bio</label>
            <textarea
              rows={2}
              value={editForm.bio || ""}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl">
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Instructor Document"
      >
        <FileUpload
          entityType="TEACHER"
          entityId={parseInt(teacherId)}
          category="CERTIFICATE"
          onSuccess={() => {
            toast("Document saved", "success");
            setIsDocModalOpen(false);
            fetchTeacher();
          }}
        />
      </Modal>
    </div>
  );
}
