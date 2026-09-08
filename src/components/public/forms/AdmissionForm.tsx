"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
export function AdmissionForm({ branchId = "", courseId = "" }: { branchId?: string; courseId?: string }) {
  const [opts, setOpts] = useState<{ branches: any[]; courses: any[] }>({ branches: [], courses: [] });
  const [f, setF] = useState({ studentName: "", gender: "Male", dateOfBirth: "", phone: "", email: "", address: "", guardianName: "", guardianPhone: "", guardianEmail: "", branchId, courseId, notes: "", photoUrl: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle"); const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/public/admission").then((r) => r.json()).then((d) => { setOpts(d); if (!f.branchId && d.branches?.[0]) setF((p) => ({ ...p, branchId: String(d.branches[0].id) })); }); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("sending");
    const res = await fetch("/api/public/admission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json();
    if (res.ok) { setMsg(d.admissionCode); setState("done"); } else { setMsg(d.error); setState("error"); }
  };
  if (state === "done") return <div className="py-12 text-center space-y-3"><div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8" /></div><h3 className="text-xl font-bold text-slate-900">Application Received</h3><p className="text-sm text-slate-600">Your reference: <strong className="font-mono">{msg}</strong>. Our admissions team will contact the guardian within 2 business days.</p></div>;
  const cls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"; const L = ({ t }: { t: string }) => <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">{t}</label>;
  return (
    <form onSubmit={submit} className="space-y-5">
      {state === "error" && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{msg}</p>}
      <div><h3 className="text-sm font-bold text-slate-900 mb-3">Student Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><L t="Student Full Name *" /><input required value={f.studentName} onChange={(e) => setF({ ...f, studentName: e.target.value })} className={cls} /></div>
        <div><L t="Gender" /><select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className={cls}><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div><L t="Date of Birth" /><input type="date" value={f.dateOfBirth} onChange={(e) => setF({ ...f, dateOfBirth: e.target.value })} className={cls} /></div>
        <div className="sm:col-span-2"><L t="Home Address" /><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={cls} /></div>
      </div></div>
      <div><h3 className="text-sm font-bold text-slate-900 mb-3">Guardian Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><L t="Guardian Name *" /><input required value={f.guardianName} onChange={(e) => setF({ ...f, guardianName: e.target.value })} className={cls} /></div>
        <div><L t="Guardian Phone *" /><input required value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} className={cls} /></div>
        <div className="sm:col-span-2"><L t="Guardian Email" /><input type="email" value={f.guardianEmail} onChange={(e) => setF({ ...f, guardianEmail: e.target.value })} className={cls} /></div>
      </div></div>
      <div><h3 className="text-sm font-bold text-slate-900 mb-3">Program Preference</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><L t="Preferred Campus *" /><select required value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })} className={cls}>{opts.branches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}</select></div>
        <div><L t="Course" /><select value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })} className={cls}><option value="">Recommend after assessment</option>{opts.courses.map((c) => <option key={c.id} value={c.id}>{c.name} (${c.fee})</option>)}</select></div>
        <div className="sm:col-span-2"><L t="Notes" /><textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Prior experience, availability, questions..." className={cls} /></div>
        <div className="sm:col-span-2"><FileUpload label="Student Photo (optional)" entityType="GENERAL" category="AVATAR" accept="image/*" onSuccess={(url) => setF({ ...f, photoUrl: url })} /></div>
      </div></div>
      <button type="submit" disabled={state === "sending"} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">{state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Admission Application"}</button>
      <p className="text-[11px] text-slate-400 text-center">Submitting creates a PENDING application reviewed by our admissions team. No payment is required now.</p>
    </form>
  );
}
