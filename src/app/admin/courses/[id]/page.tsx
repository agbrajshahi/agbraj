"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Layers,
  FolderOpen,
  FileCode,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) throw new Error("Failed to load course details");
      const result = await res.json();
      setData(result);
      setEditForm(result.course);

      // Auto expand first level
      if (result.curriculum?.length > 0) {
        setExpandedLevels({ [result.curriculum[0].id]: true });
      }
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
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");
      toast("Course updated successfully", "success");
      setIsEditOpen(false);
      fetchCourse();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast("Course deleted", "info");
      router.push("/admin/courses");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const toggleLevel = (id: number) => {
    setExpandedLevels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading curriculum tree...</p>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-600">Course not found.</p>
        <Link href="/admin/courses" className="mt-3 inline-block text-xs text-teal-600 font-bold">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  const { course, curriculum = [] } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/courses"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {course.name}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {course.code}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {course.duration} • ${course.fee} Tuition • Target: {course.targetAge}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition"
          >
            <Edit className="w-3.5 h-3.5 inline mr-1" /> Edit Course
          </button>
          <button
            onClick={handleDelete}
            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remove
          </button>
        </div>
      </div>

      {/* Course Overview Banner */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
          Course Synopsis
        </span>
        <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>
      </div>

      {/* Curriculum Hierarchy: Course -> Level -> Module -> Lesson */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" /> Curriculum Hierarchy Tree
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured learning syllabus: Course → Levels → Modules → Lessons
          </p>
        </div>

        {curriculum.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No curriculum levels initialized for this course.
          </div>
        ) : (
          <div className="space-y-4">
            {curriculum.map((level: any) => {
              const isExpanded = !!expandedLevels[level.id];
              return (
                <div key={level.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Level Header */}
                  <div
                    onClick={() => toggleLevel(level.id)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 font-black text-xs flex items-center justify-center">
                        L{level.levelNumber}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {level.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {level.durationWeeks} Weeks • {level.modules?.length || 0} Modules
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Modules & Lessons */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-white divide-y divide-slate-100">
                      {level.modules?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No modules configured.</p>
                      ) : (
                        level.modules.map((mod: any) => (
                          <div key={mod.id} className="pt-3 first:pt-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FolderOpen className="w-4 h-4 text-amber-500" />
                              <span className="font-bold text-xs text-slate-800">
                                {mod.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-3 ml-6">{mod.description}</p>

                            {/* Lessons List */}
                            <div className="ml-6 space-y-2">
                              {mod.lessons?.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">No lessons in this module.</p>
                              ) : (
                                mod.lessons.map((lesson: any) => (
                                  <div
                                    key={lesson.id}
                                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start justify-between text-xs"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <FileCode className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-semibold text-slate-900">{lesson.title}</p>
                                        <p className="text-slate-500 text-[11px] mt-0.5">{lesson.content}</p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 flex-shrink-0 ml-3">
                                      {lesson.durationMinutes} mins
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Curriculum Course">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Name</label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration</label>
              <input
                type="text"
                required
                value={editForm.duration || ""}
                onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee ($)</label>
              <input
                type="number"
                required
                value={editForm.fee || ""}
                onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Age</label>
            <input
              type="text"
              value={editForm.targetAge || ""}
              onChange={(e) => setEditForm({ ...editForm, targetAge: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={3}
              value={editForm.description || ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
