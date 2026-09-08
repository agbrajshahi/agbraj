import Link from "next/link";
import { db } from "@/db";
import {
  students,
  teachers,
  branches,
  courses,
  batches,
  activityLogs,
} from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  CalendarDays,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { payments, invoices, expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const allStudents = await db.select().from(students);
  const activeStudents = allStudents.filter((s) => s.status === "ACTIVE").length;

  const allTeachers = await db.select().from(teachers);
  const allBranches = await db.select().from(branches);
  const activeBranches = allBranches.filter((b) => b.status === "ACTIVE").length;

  const allCourses = await db.select().from(courses);
  const allBatches = await db.select().from(batches);

  const recentLogs = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.timestamp))
    .limit(6);

  // Phase 3 finance KPIs
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const allPayments = await db.select().from(payments);
  const allInvoices = await db.select().from(invoices);
  const allExpenses = await db.select().from(expenses);
  const todaysRevenue = allPayments.filter((p) => p.status === "SUCCESS" && new Date(p.paymentDate) >= startOfDay).reduce((s, p) => s + Number(p.amount), 0);
  const monthlyRevenue = allPayments.filter((p) => p.status === "SUCCESS" && new Date(p.paymentDate) >= startOfMonth).reduce((s, p) => s + Number(p.amount), 0);
  const monthlyExpenses = allExpenses.filter((e) => new Date(e.date) >= startOfMonth).reduce((s, e) => s + Number(e.amount), 0);
  const outstandingDue = allInvoices.filter((i) => i.status !== "CANCELLED" && (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) >= now).reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);
  const overdue = allInvoices.filter((i) => i.status !== "CANCELLED" && (i.status === "DUE" || i.status === "PARTIAL") && new Date(i.dueDate) < now).reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);

  const stats = [
    {
      title: "Total Students",
      value: allStudents.length,
      subValue: `${activeStudents} Active`,
      href: "/admin/students",
      icon: GraduationCap,
      color: "blue",
      badge: "+18% this month",
    },
    {
      title: "Total Teachers",
      value: allTeachers.length,
      subValue: "Certified Trainers",
      href: "/admin/teachers",
      icon: Users,
      color: "indigo",
      badge: "Full Capacity",
    },
    {
      title: "Total Branches",
      value: allBranches.length,
      subValue: `${activeBranches} Active Centers`,
      href: "/admin/branches",
      icon: Building2,
      color: "emerald",
      badge: "Operational",
    },
    {
      title: "Active Courses",
      value: allCourses.length,
      subValue: "Curriculum Modules",
      href: "/admin/courses",
      icon: BookOpen,
      color: "teal",
      badge: "Updated",
    },
    {
      title: "Total Batches",
      value: allBatches.length,
      subValue: "Scheduled classes",
      href: "/admin/batches",
      icon: CalendarDays,
      color: "amber",
      badge: "4 Active",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" /> AbacusUp Education Management Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Operations Center
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Welcome to Phase 1 Foundation. Oversee students, instructional staff, branch locations, and curriculum performance from one centralized control hub.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/30"
            >
              <UserPlus className="w-4 h-4" /> Manage Students
            </Link>
            <Link
              href="/admin/batches"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition border border-white/10"
            >
              <CalendarDays className="w-4 h-4" /> Batch Schedule
            </Link>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none hidden md:block"></div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.title}
              href={s.href}
              className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      s.color === "blue"
                        ? "bg-blue-50 text-blue-600"
                        : s.color === "indigo"
                        ? "bg-indigo-50 text-indigo-600"
                        : s.color === "emerald"
                        ? "bg-emerald-50 text-emerald-600"
                        : s.color === "teal"
                        ? "bg-teal-50 text-teal-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {s.title}
                </h3>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {s.value}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{s.subValue}</span>
                <span className="text-[11px] font-bold text-emerald-600">
                  {s.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Phase 3 Finance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Today's Revenue", value: todaysRevenue, icon: DollarSign, cls: "text-emerald-600 bg-emerald-50", href: "/admin/payments" },
          { label: "Monthly Revenue", value: monthlyRevenue, icon: TrendingUp, cls: "text-blue-600 bg-blue-50", href: "/admin/financial-reports" },
          { label: "Outstanding Due", value: outstandingDue, icon: AlertTriangle, cls: "text-amber-600 bg-amber-50", href: "/admin/due" },
          { label: "Overdue", value: overdue, icon: AlertTriangle, cls: "text-rose-600 bg-rose-50", href: "/admin/due" },
          { label: "Monthly Expenses", value: monthlyExpenses, icon: Wallet, cls: "text-purple-600 bg-purple-50", href: "/admin/expenses" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition group">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.cls}`}><Icon className="w-4 h-4" /></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700">{c.label}</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">${Number(c.value).toFixed(2)}</p>
            </Link>
          );
        })}
      </div>

      {/* Analytics & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Performance Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Branch Capacity & Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time student enrollment and teacher allocation per campus
              </p>
            </div>
            <Link
              href="/admin/branches"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Branches →
            </Link>
          </div>

          <div className="space-y-5">
            {allBranches.map((branch) => {
              const branchStudents = allStudents.filter((s) => s.branchId === branch.id);
              const branchTeachers = allTeachers.filter((t) => t.branchId === branch.id);
              const branchBatches = allBatches.filter((b) => b.branchId === branch.id);
              const percent = Math.min(100, Math.round((branchStudents.length / 15) * 100));

              return (
                <div key={branch.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900">{branch.name}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">({branch.branchCode})</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {branchStudents.length} Students
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>Instructors: <strong className="text-slate-800">{branchTeachers.length}</strong></span>
                      <span>Batches: <strong className="text-slate-800">{branchBatches.length}</strong></span>
                      <span>City: <strong className="text-slate-800">{branch.city}</strong></span>
                    </div>
                    <span className="text-emerald-600 font-semibold">{branch.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Course Breakdown */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Curriculum Enrollment Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allCourses.map((c) => {
                const count = allStudents.filter((s) => s.courseId === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.duration} • ${c.fee}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-blue-600">{count}</span>
                      <span className="block text-[10px] text-slate-400">enrolled</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> System Activity
              </h2>
              <Link
                href="/admin/activity-logs"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                All Logs →
              </Link>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Audit trail of logins, administrative modifications, and records
            </p>

            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-xs">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                    {log.action.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      {log.userName || "System"} •{" "}
                      <span className="text-blue-600 uppercase font-mono text-[10px]">
                        {log.action}
                      </span>{" "}
                      {log.entity}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                      {log.details || `Modified ${log.entity} #${log.entityId}`}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/admin/settings"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
            >
              System Security & Brand Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
