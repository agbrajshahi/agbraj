import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { getFaqs, SITE_URL } from "@/lib/public/data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAQ", description: "Answers to common questions about admissions, curriculum, fees, and the parent portal.", alternates: { canonical: `${SITE_URL}/faq` } };
export default async function FaqPage() {
  const items = await getFaqs();
  const cats = Array.from(new Set(items.map((f) => f.category || "General")));
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }) }} />
      <PageHero tone="indigo" eyebrow="Help Center" title="Frequently Asked Questions" text="Everything parents ask before enrolling." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {cats.map((c) => <section key={c}><h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">{c}</h2><FaqAccordion items={items.filter((f) => (f.category || "General") === c)} /></section>)}
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-200"><p className="font-bold text-slate-900">Still have questions?</p><Link href="/contact" className="inline-flex mt-3 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Contact Us</Link></div>
      </div>
    </PublicLayout>
  );
}
