import type { Metadata } from "next";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { BranchApplyForm } from "@/components/public/forms/BranchApplyForm";
import { SITE_URL } from "@/lib/public/data";
import { BookOpen, Users, LayoutDashboard, Megaphone } from "lucide-react";
export const metadata: Metadata = { title: "Open a Franchise Branch", description: "Apply to open an AbacusUp mental arithmetic franchise branch in your city.", alternates: { canonical: `${SITE_URL}/apply-branch` } };
export default function ApplyBranchPage() {
  return (
    <PublicLayout>
      <PageHero tone="emerald" eyebrow="Franchise Partnership" title="Open an AbacusUp Branch" text="Bring certified mental arithmetic education to your community with our complete curriculum, training, and management platform." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[{ I: BookOpen, t: "Proven Curriculum", d: "4-tier course structure with assessments, question bank, and study materials." }, { I: Users, t: "Instructor Training", d: "Certification program for your teaching staff." }, { I: LayoutDashboard, t: "Management Platform", d: "Admissions, attendance, exams, invoicing, and parent portal — included." }, { I: Megaphone, t: "Marketing Support", d: "Brand assets, website presence, and launch campaigns." }].map((b) => <div key={b.t} className="bg-white p-5 rounded-3xl border border-slate-200 flex gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><b.I className="w-5 h-5" /></div><div><p className="text-sm font-bold text-slate-900">{b.t}</p><p className="text-xs text-slate-500 mt-1">{b.d}</p></div></div>)}
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm"><BranchApplyForm /></div>
      </div>
    </PublicLayout>
  );
}
