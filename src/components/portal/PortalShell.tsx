"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, X, LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import { ToastProvider, useToast } from "@/components/ui/Toast";

interface PortalShellProps {
  user: any;
  portalName: string;
  basePath: string;
  accentColor: "blue" | "indigo" | "emerald";
  children: React.ReactNode;
}

function PortalShellInner({ user, portalName, basePath, accentColor, children }: PortalShellProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Logged out successfully", "info");
    router.push("/login");
    router.refresh();
  };

  const accentClasses = {
    blue: "from-blue-600 to-indigo-600",
    indigo: "from-indigo-600 to-purple-600",
    emerald: "from-emerald-600 to-teal-600",
  }[accentColor];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className={`bg-gradient-to-r ${accentClasses} text-white sticky top-0 z-30 shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href={basePath} className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-black text-lg">A</div>
            <div>
              <span className="text-base font-black tracking-tight block leading-tight">ABACUSUP</span>
              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider block -mt-0.5">{portalName}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="p-2 hover:bg-white/10 rounded-lg relative transition">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 text-slate-900">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700">Notifications</span>
                    <button onClick={() => setShowNotif(false)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 text-center">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 text-xs ${n.isRead ? "" : "bg-blue-50/40"}`}>
                          <p className="font-bold text-slate-900">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                          {!n.isRead && <button onClick={() => markRead(n.id)} className="text-[10px] font-bold text-blue-600 mt-1">Mark read</button>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-semibold">{user?.name}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      <footer className="text-center text-[11px] text-slate-400 py-6 border-t border-slate-200 bg-white">
        &copy; 2026 ABACUSUP — {portalName} • Phase 2 Academic Management System
      </footer>
    </div>
  );
}

export function PortalShell(props: PortalShellProps) {
  return (
    <ToastProvider>
      <PortalShellInner {...props} />
    </ToastProvider>
  );
}
