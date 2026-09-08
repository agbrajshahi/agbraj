import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { Reveal } from "@/components/public/Reveal";
import { getContent, SITE_URL } from "@/lib/public/data";
import { Brain, Award, Shield, Users, Target, Eye } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About Us", description: "AbacusUp's cognitive-science approach to mental arithmetic, certified Soroban pedagogy, and academic excellence.", alternates: { canonical: `${SITE_URL}/about` } };
export default async function AboutPage() {
  const c = (await getContent()).about_page || {};
  return (
    <PublicLayout>
      <PageHero eyebrow="Our Mission & Pedagogy" title={c.title || "Nurturing Young Minds Through Brain-Balanced Calculation"} text={c.intro} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Reveal className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm"><div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4"><Target className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-900">Our Mission</h2><p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.mission}</p></Reveal>
          <Reveal delay={100} className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm"><div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4"><Eye className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-900">Our Vision</h2><p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.vision}</p></Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <Reveal className="space-y-4"><span className="text-xs font-bold text-teal-600 uppercase tracking-wider">The Soroban Science</span><h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">Beyond Mechanical Calculation</h2><p className="text-sm text-slate-600 leading-relaxed">Traditional mathematics emphasizes rote memorization. The Soroban method requires children to physically manipulate beads with precise finger coordination, then progress to Anzan — mental visualization that activates the right hemisphere responsible for spatial awareness and photographic memory.</p></Reveal>
          <Reveal delay={100} className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Brain className="w-5 h-5" /></div><h3 className="font-bold text-slate-900">Dual Brain Synchronization</h3></div><div className="space-y-3 text-xs text-slate-600"><div className="p-3 bg-slate-50 rounded-xl"><strong className="text-slate-900 block">Left Brain (Logic):</strong> Sequential rules of complements, carrying, and arithmetic sutras.</div><div className="p-3 bg-slate-50 rounded-xl"><strong className="text-slate-900 block">Right Brain (Visualization):</strong> Instant spatial bead images, cultivating photographic recall.</div></div></Reveal>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[{ I: Award, t: "Excellence in Pedagogy", d: "Certified trainers following structured 4-tier milestone standards.", c: "blue" }, { I: Users, t: "Small Cohort Batches", d: "Maximum 15 students per class for personalized attention.", c: "indigo" }, { I: Shield, t: "Transparent Progress", d: "Real-time portal access for guardians to review attendance and milestones.", c: "teal" }].map((v, i) => <Reveal key={v.t} delay={i * 80} className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2"><div className={`w-12 h-12 bg-${v.c}-50 text-${v.c}-600 rounded-xl flex items-center justify-center mx-auto mb-3`}><v.I className="w-6 h-6" /></div><h3 className="font-bold text-sm text-slate-900">{v.t}</h3><p className="text-xs text-slate-500 leading-relaxed">{v.d}</p></Reveal>)}
        </div>
        <div className="text-center"><Link href="/admission" className="inline-flex px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg">Apply for Admission</Link></div>
      </div>
    </PublicLayout>
  );
}
