"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  CalendarDays,
  UserCheck,
  ShieldAlert,
  BarChart3,
  Settings,
  History,
  Sparkles,
  ExternalLink,
  ClipboardCheck,
  CalendarClock,
  FileQuestion,
  FileSpreadsheet,
  Award,
  ClipboardList,
  FolderOpen,
  UserPlus,
  BookOpenCheck,
  DollarSign,
  Receipt,
  CreditCard,
  AlertTriangle,
  Wallet,
  Calculator,
  LayoutTemplate,
  Image as ImageIcon,
  Images,
  Video,
  Newspaper,
  HelpCircle,
  Quote,
  Mail,
  Bell,
} from "lucide-react";

interface AdminSidebarProps {
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ userRole = "ADMIN", isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Students", href: "/admin/students", icon: GraduationCap },
    { name: "Teachers", href: "/admin/teachers", icon: Users },
    { name: "Branches", href: "/admin/branches", icon: Building2 },
    { name: "Courses", href: "/admin/courses", icon: BookOpen },
    { name: "Batches", href: "/admin/batches", icon: CalendarDays },
  ];

  const academicNavigation = [
    { name: "Attendance", href: "/admin/attendance", icon: ClipboardCheck },
    { name: "Class Schedule", href: "/admin/schedule", icon: CalendarClock },
    { name: "Exams", href: "/admin/exams", icon: FileSpreadsheet },
    { name: "Question Bank", href: "/admin/question-bank", icon: FileQuestion },
    { name: "Results", href: "/admin/results", icon: Award },
    { name: "Assignments", href: "/admin/assignments", icon: ClipboardList },
    { name: "Study Materials", href: "/admin/materials", icon: FolderOpen },
  ];

  const financeNavigation = [
    { name: "Admissions", href: "/admin/admissions", icon: UserPlus },
    { name: "Enrollments", href: "/admin/enrollments", icon: BookOpenCheck },
    { name: "Fee Structures", href: "/admin/fees", icon: DollarSign },
    { name: "Invoices", href: "/admin/invoices", icon: Receipt },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Due Management", href: "/admin/due", icon: AlertTriangle },
    { name: "Expenses", href: "/admin/expenses", icon: Wallet },
    { name: "Accounting", href: "/admin/accounting", icon: Calculator },
    { name: "Financial Reports", href: "/admin/financial-reports", icon: BarChart3 },
  ];

  const cmsNavigation = [
    { name: "CMS Overview", href: "/admin/cms", icon: LayoutTemplate },
    { name: "Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Gallery", href: "/admin/gallery", icon: Images },
    { name: "Videos", href: "/admin/videos", icon: Video },
    { name: "Events", href: "/admin/events", icon: CalendarDays },
    { name: "Blog", href: "/admin/blog", icon: Newspaper },
    { name: "FAQ", href: "/admin/faqs", icon: HelpCircle },
    { name: "Testimonials", href: "/admin/testimonials", icon: Quote },
    { name: "Contact Messages", href: "/admin/contact-messages", icon: Mail },
    { name: "Branch Applications", href: "/admin/branch-applications", icon: Building2 },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
  ];

  const systemNavigation = [
    { name: "Users", href: "/admin/users", icon: UserCheck },
    { name: "Roles & Permissions", href: "/admin/roles", icon: ShieldAlert },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Activity Logs", href: "/admin/activity-logs", icon: History },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="overflow-y-auto flex-1">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg">
              A
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ABACUS<span className="text-blue-400">UP</span>
              </span>
              <span className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase block -mt-1">
                EduCore Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        {[
          { label: "Main Management", items: navigation },
          { label: "Academic Management", items: academicNavigation },
          { label: "Admission & Finance", items: financeNavigation },
          { label: "Website & CMS", items: cmsNavigation },
          { label: "System & Administration", items: systemNavigation },
        ].map((group) => (
          <div className="py-4 px-3 space-y-1" key={group.label}>
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer link to public website & role badge */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Phase 4 Active</span>
            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
              v4.0-EMS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Role: <span className="text-teal-400 font-semibold">{userRole}</span>
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> View Public Site
          </span>
          <span className="text-[10px] text-slate-500">Live</span>
        </Link>
      </div>
    </aside>
  );
}
