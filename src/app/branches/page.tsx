import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { Reveal } from "@/components/public/Reveal";
import { getBranches, SITE_URL } from "@/lib/public/data";
import { MapPin, Phone, Mail, CheckCircle2, ArrowRight } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campus Locations", description: "Find an AbacusUp learning campus near you with smart interactive labs.", alternates: { canonical: `${SITE_URL}/branches` } };
export default async function BranchesPage() {
  const branches = await getBranches();
  return (
    <PublicLayout>
      <PageHero tone="emerald" eyebrow="Campus Centers" title="Our Physical Learning Facilities" text="Modern learning centers with digital soroban visualization tools and low student-teacher ratios." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        {branches.map((b, i) => (
          <Reveal key={b.id} delay={i * 80} className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm flex flex-col md:flex-row gap-8 justify-between items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">{b.logoUrl && <img src={b.logoUrl} alt={b.name} className="w-12 h-12 rounded-xl object-cover" />}<span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">{b.branchCode}</span><span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {b.status}</span></div>
              <h2 className="text-2xl font-bold text-slate-900">{b.name}</h2><p className="text-sm text-slate-600 leading-relaxed">{b.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2"><p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> {b.address}, {b.city}</p><p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {b.phone}</p><p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {b.email}</p></div>
            </div>
            <div className="w-full md:w-auto flex flex-col gap-3"><Link href={`/branches/${b.id}`} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold text-center inline-flex items-center justify-center gap-2">Campus Details <ArrowRight className="w-3.5 h-3.5" /></Link><Link href="/contact" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold text-center">Schedule Tour</Link></div>
          </Reveal>
        ))}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center"><h3 className="text-xl font-black">Want to bring AbacusUp to your city?</h3><p className="text-sm text-emerald-50 mt-2">Apply to open a franchise branch — we provide curriculum, training, and the full management platform.</p><Link href="/apply-branch" className="inline-flex mt-5 px-6 py-3 bg-white text-emerald-700 rounded-2xl text-xs font-bold">Branch Application →</Link></div>
      </div>
    </PublicLayout>
  );
}
