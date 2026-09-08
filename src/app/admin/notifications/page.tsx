"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const load = () => fetch("/api/notifications").then((r) => r.json()).then((d) => setItems(d.notifications || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => { await fetch(`/api/notifications/${id}/read`, { method: "POST" }); load(); };
  const markAll = async () => { await fetch("/api/notifications/mark-all-read", { method: "POST" }); toast("All notifications marked as read", "success"); load(); };

  const filtered = filter === "UNREAD" ? items.filter((n) => !n.isRead) : items;
  const typeColor: Record<string, string> = { SUCCESS: "bg-emerald-50 text-emerald-600", WARNING: "bg-amber-50 text-amber-600", ALERT: "bg-rose-50 text-rose-600", INFO: "bg-blue-50 text-blue-600" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><Bell className="w-7 h-7 text-blue-600" /> Notification Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Admissions, payments, dues, attendance, exams, results, assignments, applications, contact and system events</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex gap-1">
            {(["ALL", "UNREAD"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === f ? "bg-blue-600 text-white" : "text-slate-600"}`}>{f}</button>)}
          </div>
          <button onClick={markAll} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"><CheckCheck className="w-4 h-4" /> Mark All Read</button>
        </div>
      </div>
      {loading ? <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div> : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">You're all caught up</h3></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
          {filtered.map((n) => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${n.isRead ? "" : "bg-blue-50/30"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[n.type] || typeColor.INFO}`}><Bell className="w-4 h-4" /></div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-slate-900">{n.title}</p>
                <p className="text-slate-600 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  {n.link && <Link href={n.link} className="text-blue-600 font-bold">Open →</Link>}
                  {!n.isRead && <button onClick={() => markRead(n.id)} className="text-emerald-600 font-bold">Mark read</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
