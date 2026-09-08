import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/public/PublicLayout";
import { getEventBySlug, getBranchById, SITE_URL } from "@/lib/public/data";
import { ArrowLeft, CalendarDays, MapPin, Clock, Building } from "lucide-react";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const e = await getEventBySlug(slug);
  return { title: e?.title || "Event", description: e?.description?.slice(0, 160), alternates: { canonical: `${SITE_URL}/events/${slug}` }, openGraph: { title: e?.title, images: e?.imageUrl ? [e.imageUrl] : [] } };
}
export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const e = await getEventBySlug(slug);
  if (!e || e.status === "DRAFT") notFound();
  const branch = e.branchId ? await getBranchById(e.branchId) : null;
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Event", name: e.title, startDate: e.eventDate, description: e.description, location: { "@type": "Place", name: e.location, address: branch?.address }, organizer: { "@type": "Organization", name: "ABACUSUP" }, image: e.imageUrl }) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Link href="/events" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> All Events</Link>
        {e.imageUrl && <img src={e.imageUrl} alt={e.title} className="w-full h-72 sm:h-96 object-cover rounded-3xl shadow-lg" />}
        <div><span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${e.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{e.status === "COMPLETED" ? "Past event" : "Upcoming"}</span><h1 className="text-3xl sm:text-4xl font-black text-slate-950 mt-3">{e.title}</h1></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white rounded-2xl border border-slate-200"><CalendarDays className="w-4 h-4 text-amber-600 mb-2" /><p className="font-bold text-slate-900">{new Date(e.eventDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200"><Clock className="w-4 h-4 text-amber-600 mb-2" /><p className="font-bold text-slate-900">{e.eventTime || "TBA"}</p></div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200"><MapPin className="w-4 h-4 text-amber-600 mb-2" /><p className="font-bold text-slate-900">{e.location}</p>{branch && <Link href={`/branches/${branch.id}`} className="text-emerald-700 font-semibold flex items-center gap-1 mt-1"><Building className="w-3 h-3" /> {branch.name}</Link>}</div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{e.description}</div>
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4"><div><p className="font-black text-lg">Want to attend?</p><p className="text-xs text-amber-50">Register your interest and our campus team will confirm your seat.</p></div><Link href={`/contact?subject=${encodeURIComponent("Event: " + e.title)}`} className="px-5 py-2.5 bg-white text-amber-700 rounded-xl text-xs font-bold whitespace-nowrap">Register Interest</Link></div>
      </div>
    </PublicLayout>
  );
}
