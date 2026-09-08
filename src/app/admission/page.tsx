import type { Metadata } from "next";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { AdmissionForm } from "@/components/public/forms/AdmissionForm";
import { SITE_URL } from "@/lib/public/data";
import { CheckCircle2 } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Apply for Admission", description: "Submit an online admission application to AbacusUp mental arithmetic academy.", alternates: { canonical: `${SITE_URL}/admission` } };
export default async function AdmissionPage({ searchParams }: { searchParams: Promise<{ branchId?: string; courseId?: string }> }) {
  const sp = await searchParams;
  return (
    <PublicLayout>
      <PageHero eyebrow="Admissions Open" title="Apply for Admission" text="Complete the form below. Our team schedules a free 30-minute placement assessment for every applicant." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-xs space-y-3"><h3 className="font-bold text-slate-900 text-sm">How it works</h3>{["Submit the online application", "Receive a call within 2 business days", "Attend a free placement assessment", "Get your level and batch recommendation", "Confirm enrollment & receive invoice"].map((s, i) => <p key={s} className="flex items-start gap-2 text-slate-600"><span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">{i + 1}</span>{s}</p>)}</div>
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-xs space-y-2"><h3 className="font-bold text-blue-900 text-sm">What's included</h3>{["Certified instructor", "Practice kit & worksheets", "Parent portal access", "Term assessments & reports"].map((s) => <p key={s} className="flex items-center gap-2 text-blue-800"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> {s}</p>)}</div>
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm"><AdmissionForm branchId={sp.branchId || ""} courseId={sp.courseId || ""} /></div>
      </div>
    </PublicLayout>
  );
}
