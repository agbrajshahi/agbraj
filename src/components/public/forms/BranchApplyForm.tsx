"use client";
import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
export function BranchApplyForm() {
  const [f, setF] = useState({ applicantName: "", organization: "", phone: "", email: "", address: "", city: "", experience: "", expectedCapacity: "", message: "", logoUrl: "", documentUrls: [] as string[] });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle"); const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("sending");
    const res = await fetch("/api/public/branch-apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json();
    if (res.ok) { setMsg(d.applicationCode); setState("done"); } else { setMsg(d.error); setState("error"); }
  };
  if (state === "done") return <div className="py-12 text-center space-y-3"><div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8" /></div><h3 className="text-xl font-bold text-slate-900">Application Submitted</h3><p className="text-sm text-slate-600">Reference <strong className="font-mono">{msg}</strong>. Our franchise team reviews applications within 5 business days.</p></div>;
  const cls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"; const L = ({ t }: { t: string }) => <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">{t}</label>;
  return (
    <form onSubmit={submit} className="space-y-4">
      {state === "error" && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{msg}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><L t="Applicant Name *" /><input required value={f.applicantName} onChange={(e) => setF({ ...f, applicantName: e.target.value })} className={cls} /></div>
        <div><L t="Organization" /><input value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} className={cls} /></div>
        <div><L t="Phone *" /><input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={cls} /></div>
        <div><L t="Email *" /><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={cls} /></div>
        <div><L t="City" /><input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={cls} /></div>
        <div><L t="Expected Student Capacity" /><input type="number" min="10" value={f.expectedCapacity} onChange={(e) => setF({ ...f, expectedCapacity: e.target.value })} className={cls} /></div>
        <div className="sm:col-span-2"><L t="Proposed Address" /><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={cls} /></div>
        <div className="sm:col-span-2"><L t="Relevant Experience" /><textarea rows={3} value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} placeholder="Education, business, or franchise experience..." className={cls} /></div>
        <div className="sm:col-span-2"><L t="Message" /><textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={cls} /></div>
        <div><FileUpload label="Logo / Photo" entityType="GENERAL" category="LOGO" accept="image/*" onSuccess={(url) => setF({ ...f, logoUrl: url })} /></div>
        <div><FileUpload label="Supporting Document (PDF)" entityType="GENERAL" category="BRANCH_DOC" accept="application/pdf,image/*" onSuccess={(url) => url && setF({ ...f, documentUrls: [...f.documentUrls, url] })} />{f.documentUrls.length > 0 && <p className="text-[10px] text-emerald-600 mt-1">{f.documentUrls.length} document(s) attached</p>}</div>
      </div>
      <button type="submit" disabled={state === "sending"} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">{state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Branch Application"}</button>
    </form>
  );
}
