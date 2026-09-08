"use client";

import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export default function MaterialsPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "DOCUMENT",
    courseId: "",
    batchId: "",
    fileUrl: "",
    fileType: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resM, resC, resB] = await Promise.all([fetch("/api/materials"), fetch("/api/courses"), fetch("/api/batches")]);
      setMaterials((await resM.json()).materials || []);
      setCourses((await resC.json()).courses || []);
      setBatches((await resB.json()).batches || []);
    } catch {
      toast("Failed to load study materials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileUrl) {
      toast("Please upload a file first", "error");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload material");
      toast("Study material published!", "success");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this study material?")) return;
    try {
      await fetch(`/api/materials/${id}`, { method: "DELETE" });
      toast("Material removed", "info");
      fetchData();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const categoryIcon = (cat: string) => {
    if (cat === "VIDEO") return <Video className="w-5 h-5" />;
    if (cat === "IMAGE") return <ImageIcon className="w-5 h-5" />;
    if (cat === "PDF") return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-7 h-7 text-blue-600" /> Study Materials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload and organize learning resources by course, level, module, and batch
          </p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20">
          <Plus className="w-4 h-4" /> Upload Material
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No study materials uploaded yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">{categoryIcon(m.category)}</div>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-sm font-bold text-slate-900">{m.title}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                <p className="text-[11px] text-slate-400 mt-2">{m.courseName || "General"} {m.batchName ? `• ${m.batchName}` : ""}</p>
              </div>
              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:underline">
                Open File →
              </a>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Upload Study Material" description="Attach learning resources for students in a course or batch">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Title *</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Soroban Practice Sheet Level 1" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Course</label>
              <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                <option value="">All / General</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Batch</label>
              <select value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                <option value="">All Batches</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl">
              <option value="PDF">PDF</option>
              <option value="DOCUMENT">Document</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
          </div>
          <FileUpload
            label="Upload File *"
            entityType="GENERAL"
            category="STUDY_MATERIAL"
            accept="image/*,application/pdf,video/*,.doc,.docx"
            onSuccess={(url, doc) => setFormData({ ...formData, fileUrl: url, fileType: doc?.fileType || "" })}
          />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl">
              {submitting ? "Uploading..." : "Publish Material"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
