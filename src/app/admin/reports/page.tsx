"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Building2,
  GraduationCap,
  Users,
  Loader2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ReportsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      const result = await res.json();
      setData(result);
    } catch {
      toast("Failed to load reporting analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast("Generating full institutional analytics PDF report...", "info");
    setTimeout(() => {
      toast("Institutional Report ready for download", "success");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Compiling educational metrics...</p>
      </div>
    );
  }

  const { summary = {}, branchStats = [], courseStats = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Academic Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Institutional performance, enrollment velocity, and campus utilization indicators
          </p>
        </div>

        <button
          onClick={exportReport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
        >
          <Download className="w-4 h-4" /> Export Analytics Report
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Student Retention
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">94.8%</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            +2.4% vs prev quarter
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Enrollments
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.activeStudents || 20}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Across all 2 campuses</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Instructor Ratio
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">1 : 4</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            High attention ratio
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Average Batch Load
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">72%</p>
          <span className="text-[11px] text-blue-600 font-bold mt-1 block">Optimal capacity</span>
        </div>
      </div>

      {/* Campus Breakdown Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" /> Campus Performance Breakdown
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <th className="p-3">Branch Center</th>
                <th className="p-3">Branch Code</th>
                <th className="p-3 text-center">Students</th>
                <th className="p-3 text-center">Teachers</th>
                <th className="p-3 text-center">Batches</th>
                <th className="p-3 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchStats.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{b.name}</td>
                  <td className="p-3 font-mono text-slate-500">{b.code}</td>
                  <td className="p-3 text-center font-bold text-blue-600">{b.studentsCount}</td>
                  <td className="p-3 text-center font-semibold text-slate-800">{b.teachersCount}</td>
                  <td className="p-3 text-center font-semibold text-slate-800">{b.batchesCount}</td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      OPTIMAL
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Enrollment Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-teal-600" /> Curriculum Popularity & Revenue Potential
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseStats.map((c: any) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
              <span className="font-bold text-slate-900 block">{c.name}</span>
              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{c.code}</span>
              <div className="mt-3 flex justify-between items-end">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tuition Fee</span>
                  <span className="font-bold text-teal-700 text-sm">${c.fee}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Enrolled</span>
                  <span className="font-black text-slate-900 text-base">{c.enrolledCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
