"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  Activity,
  Edit,
  Trash2,
  Loader2,
  BookOpen,
  Upload,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Document Upload State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) throw new Error("Failed to load student details");
      const result = await res.json();
      setData(result);
      setEditForm(result.student);
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
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");
      toast("Student profile updated successfully", "success");
      setIsEditOpen(false);
      fetchStudent();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this student record?")) return;
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast("Student deleted", "info");
      router.push("/admin/students");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Retrieving student profile...</p>
      </div>
    );
  }

  if (!data?.student) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">Student not found.</p>
        <Link href="/admin/students" className="mt-3 inline-block text-xs text-blue-600 font-bold">
          ← Back to Students
        </Link>
      </div>
    );
  }

  const { student, attendance = [], documents = [], activity = [], payments = [] } = data;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "personal", label: "Personal" },
    { id: "guardian", label: "Guardian" },
    { id: "academic", label: "Academic" },
    { id: "attendance", label: `Attendance (${attendance.length})` },
    { id: "payments", label: "Payments" },
    { id: "documents", label: `Documents (${documents.length})` },
    { id: "activity", label: `Activity (${activity.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/students"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {student.name}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {student.studentIdCode}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Enrolled in {student.courseName || "Abacus Program"} • {student.branchName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Profile
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" /> Archive
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-blue-50/20"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div className="w-24 h-24 rounded-2xl bg-blue-100 text-blue-700 font-black text-2xl flex items-center justify-center border-2 border-white shadow-md overflow-hidden mb-4">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  student.name.charAt(0)
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">{student.name}</h2>
              <span className="text-xs font-mono text-slate-400 mt-0.5">{student.studentIdCode}</span>
              <span
                className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  student.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {student.status}
              </span>

              <div className="w-full mt-6 pt-4 border-t border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-semibold text-slate-800">{student.gender || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admitted:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch:</span>
                  <span className="font-semibold text-slate-800">{student.branchName}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Current Course
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{student.courseName || "General Soroban"}</p>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{student.currentLevel}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Batch & Timings
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{student.batchName || "Unassigned"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{student.batchSchedule || "Schedule TBD"}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Guardian Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Guardian Name</span>
                    <strong className="text-slate-800">{student.guardianName} ({student.guardianRelation})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <strong className="text-slate-800">{student.guardianPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email</span>
                    <strong className="text-slate-800">{student.guardianEmail || "None"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Emergency Contact</span>
                    <strong className="text-slate-800">{student.emergencyContact || student.guardianPhone}</strong>
                  </div>
                </div>
              </div>

              {student.notes && (
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 text-xs">
                  <span className="font-bold text-blue-900 block mb-1">Instructional Notes</span>
                  <p className="text-slate-700 leading-relaxed">{student.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PERSONAL TAB */}
        {activeTab === "personal" && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Personal Demographics</h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-slate-500 block">Date of Birth</span>
                <span className="font-semibold text-slate-900">
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Gender</span>
                <span className="font-semibold text-slate-900">{student.gender || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Student Contact Email</span>
                <span className="font-semibold text-slate-900">{student.email || "No direct email"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Residential Address</span>
                <span className="font-semibold text-slate-900">{student.address || "Unspecified"}</span>
              </div>
            </div>
          </div>
        )}

        {/* GUARDIAN TAB */}
        {activeTab === "guardian" && (
          <div className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Parent / Legal Guardian Details</h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-slate-500 block">Name</span>
                <span className="font-semibold text-slate-900">{student.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Relationship</span>
                <span className="font-semibold text-slate-900">{student.guardianRelation}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Primary Contact Phone</span>
                <span className="font-semibold text-slate-900">{student.guardianPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-900">{student.guardianEmail || "None"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC TAB */}
        {activeTab === "academic" && (
          <div className="space-y-4 max-w-3xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Academic Progression & Batch Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Curriculum Program</span>
                <strong className="text-sm text-slate-900">{student.courseName}</strong>
                <span className="text-slate-500 block mt-1">{student.courseDuration}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Current Milestone</span>
                <strong className="text-sm text-blue-600">{student.currentLevel}</strong>
                <span className="text-slate-500 block mt-1">Passing Grade: A</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Assigned Batch</span>
                <strong className="text-sm text-slate-900">{student.batchName || "N/A"}</strong>
                <span className="text-slate-500 block mt-1">{student.batchRoom || "Room Alpha"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Attendance Log</h3>
              <span className="text-xs text-slate-500">Total sessions recorded: {attendance.length}</span>
            </div>

            {attendance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No attendance logs found for this student.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((rec: any) => (
                    <tr key={rec.id}>
                      <td className="p-3 font-medium text-slate-800">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
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

        {/* PAYMENTS-READY SECTION */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Tuition & Fee Ledger</h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Phase 1 Financial Architecture
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono text-slate-800">{p.id}</td>
                    <td className="p-3 text-slate-800 font-medium">{p.description}</td>
                    <td className="p-3 font-bold text-slate-900">${p.amount}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(p.paidDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Student Documents & Verification</h3>
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 border border-slate-200 rounded-xl flex items-start space-x-3 bg-white">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate flex-1 text-xs">
                      <p className="font-bold text-slate-900 truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{doc.category}</p>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 block"
                      >
                        View File →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Entity Audit Trail</h3>
            {activity.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No activity records found for this student.
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((act: any) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 text-xs">
                    <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {act.userName || "System"} •{" "}
                        <span className="font-mono text-blue-600 uppercase text-[10px]">
                          {act.action}
                        </span>
                      </p>
                      <p className="text-slate-600 text-[11px] mt-0.5">{act.details}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Student Information"
        description="Update profile, guardian contacts, or academic status"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guardian Name</label>
              <input
                type="text"
                required
                value={editForm.guardianName || ""}
                onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guardian Phone</label>
              <input
                type="text"
                required
                value={editForm.guardianPhone || ""}
                onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Level</label>
              <input
                type="text"
                value={editForm.currentLevel || ""}
                onChange={(e) => setEditForm({ ...editForm, currentLevel: e.target.value })}
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
                <option value="GRADUATED">GRADUATED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
            <textarea
              rows={3}
              value={editForm.notes || ""}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Student Document"
        description="Upload ID proofs, birth certificates, or progress evaluations"
      >
        <FileUpload
          entityType="STUDENT"
          entityId={parseInt(studentId)}
          category="CERTIFICATE"
          onSuccess={() => {
            toast("Document saved to student record", "success");
            setIsDocModalOpen(false);
            fetchStudent();
          }}
        />
      </Modal>
    </div>
  );
}
