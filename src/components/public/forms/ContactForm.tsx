"use client";
import React, { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: defaultSubject, message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle"); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("sending"); setErr("");
    const res = await fetch("/api/public/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json();
    if (res.ok) setState("done"); else { setErr(d.error || "Failed"); setState("error"); }
  };
  if (state === "done") return <div className="py-12 text-center space-y-3"><div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8" /></div><h3 className="text-xl font-bold text-slate-900">Message Sent</h3><p className="text-sm text-slate-600">Thank you — our team will respond within 24 hours.</p><button onClick={() => { setState("idle"); setF({ name: "", email: "", phone: "", subject: "", message: "" }); }} className="mt-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Send another</button></div>;
  const cls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm";
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input required placeholder="Your name *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={cls} /><input required type="email" placeholder="Email *" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={cls} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={cls} /><input placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={cls} /></div>
      <textarea required rows={5} placeholder="How can we help? *" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={cls} />
      <button type="submit" disabled={state === "sending"} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">{state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}</button>
    </form>
  );
}
