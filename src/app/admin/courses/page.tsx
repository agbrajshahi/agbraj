"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Layers,
  Clock,
  DollarSign,
  ChevronRight,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export default function CoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "16 Weeks",
    fee: "480",
    targetAge: "5-14 years",
    status: "ACTIVE",
    thumbnailUrl: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      toast("Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create course");

      toast("Course added successfully!", "success");
      setIsCreateOpen(false);
      fetchCourses();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-teal-600" /> Curriculum & Course Modules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage 4-tier structured curriculum: Course → Level → Module → Lesson
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-600/20"
        >
          <Plus className="w-4 h-4" /> Add Curriculum Course
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading curriculum...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No courses defined</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {c.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.status}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 mt-3">{c.name}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Duration</span>
                    <strong className="text-slate-800">{c.duration}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tuition Fee</span>
                    <strong className="text-teal-700 font-bold">${c.fee}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Age</span>
                    <strong className="text-slate-800">{c.targetAge}</strong>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Structure: Course → {c.levelsCount || 3} Levels → Modules → Lessons</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-xl text-xs font-bold transition border border-teal-200"
                >
                  Curriculum Hierarchy <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Curriculum Course"
        description="Define program syllabus, pricing, and duration"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Master Anzan Speed Drills"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Duration *
              </label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 16 Weeks"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Fee ($) *
              </label>
              <input
                type="number"
                required
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                placeholder="480"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Target Age Group
            </label>
            <input
              type="text"
              value={formData.targetAge}
              onChange={(e) => setFormData({ ...formData, targetAge: e.target.value })}
              placeholder="e.g. 6-12 years"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Course Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed syllabus outline and cognitive skill takeaways..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <FileUpload
            label="Course Thumbnail / Banner"
            entityType="COURSE"
            category="THUMBNAIL"
            accept="image/*"
            onSuccess={(url) => setFormData({ ...formData, thumbnailUrl: url })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl"
            >
              {submitting ? "Saving..." : "Add Course"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
