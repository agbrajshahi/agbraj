"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  Building,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AdminHeaderProps {
  user: any;
  onToggleSidebar: () => void;
}

export function AdminHeader({ user, onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json()).then((d) => { setSearchResults(d.results || []); setShowSearch(true); }).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast("Logged out successfully", "info");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast("Error logging out", "error");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults[0]) {
      router.push(searchResults[0].href);
      setSearchQuery(""); setShowSearch(false);
    } else if (searchQuery.trim()) {
      router.push(`/admin/students?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Generate breadcrumb
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = "/" + pathSegments.slice(0, index + 1).join("/");
    const formatted = segment.replace(/-/g, " ");
    const title = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return { title, url, isLast: index === pathSegments.length - 1 };
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500">
          <Link href="/admin" className="hover:text-blue-600 transition">
            ABACUSUP
          </Link>
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc.url}>
              <span className="text-slate-300">/</span>
              {bc.isLast ? (
                <span className="text-slate-900 font-semibold">{bc.title}</span>
              ) : (
                <Link href={bc.url} className="hover:text-blue-600 transition">
                  {bc.title}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick Search, Notifications, User Menu */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <input
            type="text"
            placeholder="Quick search student, teacher, batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {searchResults.map((r, i) => (
                <Link key={i} href={r.href} onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-xs border-b border-slate-100 last:border-0">
                  <div><p className="font-bold text-slate-900">{r.title}</p><p className="text-[10px] text-slate-500">{r.subtitle}</p></div>
                  <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{r.type}</span>
                </Link>
              ))}
            </div>
          )}
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative transition"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in zoom-in-95 duration-100">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Notifications ({unreadCount} new)
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark all read</button>}
                  <Link href="/admin/notifications" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-slate-600 hover:underline">View all</Link>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 text-xs transition flex items-start gap-3 ${
                        n.isRead ? "bg-white" : "bg-blue-50/40"
                      }`}
                    >
                      <div className="mt-0.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            n.isRead ? "text-slate-300" : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] font-semibold text-blue-600 hover:underline flex-shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center border border-blue-200">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block text-left">
              <span className="block text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || "Administrator"}
              </span>
              <span className="block text-[10px] text-slate-500">
                {user?.roleDisplayName || user?.roleName || "Super Admin"}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in zoom-in-95 duration-100">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> {user?.roleName}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-1 text-xs">
                <Link
                  href="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" /> Account Settings
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" /> Public Website
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
