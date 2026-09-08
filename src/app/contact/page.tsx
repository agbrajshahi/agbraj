import type { Metadata } from "next";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { ContactForm } from "@/components/public/forms/ContactForm";
import { getContent, getBranches, SITE_URL } from "@/lib/public/data";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with AbacusUp for admissions, assessments, and campus tours.", alternates: { canonical: `${SITE_URL}/contact` } };
export default async function ContactPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const sp = await searchParams; const [c, branches] = await Promise.all([getContent(), getBranches()]); const info = c.contact_info || {};
  return (
    <PublicLayout>
      <PageHero eyebrow="Inquiries & Support" title="Contact AbacusUp" text="Questions about admissions, curriculum, or franchising — we respond within one business day." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider block">Head Office</span>
            <p className="flex items-start gap-2.5 text-slate-600"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> {info.address}</p><p className="flex items-center gap-2.5 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /> {info.phone}</p><p className="flex items-center gap-2.5 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> {info.email}</p><p className="flex items-center gap-2.5 text-slate-600"><Clock className="w-4 h-4 text-slate-400" /> {info.hours}</p>
          </div>
          {branches.map((b) => <div key={b.id} className="bg-white p-5 rounded-3xl border border-slate-200 text-xs"><p className="font-bold text-slate-900">{b.name}</p><p className="text-slate-500 mt-1">{b.address}, {b.city}</p><p className="text-slate-500">{b.phone}</p></div>)}
        </div>
        <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm"><ContactForm defaultSubject={sp.subject || ""} /></div>
      </div>
    </PublicLayout>
  );
}
