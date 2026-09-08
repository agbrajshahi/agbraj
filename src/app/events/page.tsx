import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { Reveal } from "@/components/public/Reveal";
import { getAllEvents, SITE_URL } from "@/lib/public/data";
import { CalendarDays, MapPin, Clock } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events", description: "Open houses, competitions, and workshops at AbacusUp campuses.", alternates: { canonical: `${SITE_URL}/events` } };
export default async function EventsPage() {
  const all = await getAllEvents(); const now = Date.now() - 86400000;
  const upcoming = all.filter((e) => new Date(e.eventDate).getTime() >= now).reverse(); const past = all.filter((e) => new Date(e.eventDate).getTime() < now);
  const Card = ({ e, i }: { e: any; i: number }) => (
    <Reveal delay={i * 60}><Link href={`/events/${e.slug}`} className="block bg-white rounded-3xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition h-full">
      {e.imageUrl ? <img src={e.imageUrl} alt={e.title} loading="lazy" className="w-full h-44 object-cover" /> : <div className="w-full h-44 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"><CalendarDays className="w-10 h-10 text-amber-500" /></div>}
      <div className="p-5"><p className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(e.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p><h3 className="text-base font-bold text-slate-900 mt-1">{e.title}</h3><p className="text-xs text-slate-500 mt-1 line-clamp-2">{e.description}</p><div className="flex gap-3 text-[11px] text-slate-500 mt-3"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.eventTime}</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span></div></div>
    </Link></Reveal>
  );
  return (
    <PublicLayout>
      <PageHero tone="amber" eyebrow="Community" title="Events & Workshops" text="Join open houses, speed calculation championships, and parent workshops." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-14">
        <section><h2 className="text-2xl font-extrabold text-slate-950 mb-6">Upcoming</h2>{upcoming.length === 0 ? <p className="text-sm text-slate-500 p-8 bg-white rounded-2xl border text-center">No upcoming events. Check back soon!</p> : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{upcoming.map((e, i) => <Card key={e.id} e={e} i={i} />)}</div>}</section>
        {past.length > 0 && <section><h2 className="text-2xl font-extrabold text-slate-950 mb-6">Past Events</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">{past.map((e, i) => <Card key={e.id} e={e} i={i} />)}</div></section>}
      </div>
    </PublicLayout>
  );
}
