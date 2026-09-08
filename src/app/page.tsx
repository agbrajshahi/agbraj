import Link from "next/link";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Reveal } from "@/components/public/Reveal";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { TeacherCarousel } from "@/components/public/TeacherCarousel";
import { getContent, getBanners, getCourses, getLevels, getTeachers, getBranches, getGallery, getUpcomingEvents, getTestimonials, getFaqs, SITE_URL } from "@/lib/public/data";
import { Brain, Zap, Target, ArrowRight, Sparkles, CheckCircle2, Star, ShieldCheck, ChevronRight, CalendarDays, MapPin, Layers, Award, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ABACUSUP — Mental Arithmetic Academy & Education Management Platform",
  description: "Premier Soroban mental arithmetic academy for ages 5–16. Certified instructors, structured curriculum, transparent parent portal.",
  alternates: { canonical: SITE_URL },
  openGraph: { title: "ABACUSUP — Mental Arithmetic Academy", description: "Unleash child genius through mental abacus mastery.", url: SITE_URL, type: "website" },
};

const whyIcons = [Award, Layers, Users, ShieldCheck];

export default async function HomePage() {
  const [c, bannersList, courses, levels, teachers, branches, gallery, events, testimonials, faqs] = await Promise.all([
    getContent(), getBanners(), getCourses(), getLevels(), getTeachers(), getBranches(), getGallery(8), getUpcomingEvents(3), getTestimonials(3), getFaqs(),
  ]);
  const hero = c.home_hero || {}; const about = c.home_about || {}; const why = c.home_why?.items || []; const stats = c.home_stats?.items || []; const cta = c.home_cta || {};

  const jsonLd = {
    "@context": "https://schema.org", "@type": "EducationalOrganization", name: "ABACUSUP", url: SITE_URL,
    description: metadata.description, address: branches.map((b) => ({ "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city })),
    telephone: c.contact_info?.phone, email: c.contact_info?.email,
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/70 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <Reveal className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold border border-blue-200"><Sparkles className="w-4 h-4 text-blue-600" /> {hero.badge || "Premium Mental Arithmetic Academy"}</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">{hero.headline || "Unleash Child Genius Through Mental Abacus Mastery."}</h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">{hero.subheadline}</p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Link href={hero.primaryLink || "/courses"} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5">{hero.primaryCta || "Explore Curriculum"} <ArrowRight className="w-4 h-4" /></Link>
              <Link href={hero.secondaryLink || "/admission"} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-sm transition">{hero.secondaryCta || "Apply for Admission"}</Link>
            </div>
          </Reveal>
          <Reveal delay={150} className="lg:col-span-5">
            {bannersList.length > 0 ? (
              <div className="space-y-3">
                {bannersList.slice(0, 2).map((b, i) => (
                  <Link key={b.id} href={b.ctaLink || "/"} className={`block rounded-3xl p-6 border shadow-lg transition hover:-translate-y-0.5 ${i === 0 ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent" : "bg-white border-slate-200 text-slate-900"}`}>
                    {b.imageUrl && <img src={b.imageUrl} alt={b.title} loading="lazy" className="w-full h-32 object-cover rounded-2xl mb-4" />}
                    <p className="text-base font-black">{b.title}</p>
                    <p className={`text-xs mt-1 ${i === 0 ? "text-blue-100" : "text-slate-500"}`}>{b.subtitle}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-3 ${i === 0 ? "text-white" : "text-blue-600"}`}>{b.ctaText || "Learn more"} <ChevronRight className="w-3.5 h-3.5" /></span>
                  </Link>
                ))}
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* STATISTICS */}
      {stats.length > 0 && (
        <section className="bg-slate-950 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s: any, i: number) => <Reveal key={i} delay={i * 80} className="text-center"><p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">{s.value}</p><p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">{s.label}</p></Reveal>)}
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{about.eyebrow}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{about.title}</h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{about.body}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{ I: Brain, t: "Photographic Memory", d: "Students visualize the abacus in their mind's eye, strengthening retention and spatial pattern recognition.", c: "blue" }, { I: Zap, t: "Lightning Rapid Anzan", d: "Complex multi-digit arithmetic in seconds — eliminating math anxiety and building confidence.", c: "teal" }, { I: Target, t: "Laser Focus & Endurance", d: "Timed drill routines build sustained attention spans critical for academic excellence.", c: "indigo" }].map((f, i) => (
              <Reveal key={f.t} delay={i * 100} className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${f.c}-100 text-${f.c}-700`}><f.I className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.t}</h3><p className="text-sm text-slate-600 leading-relaxed">{f.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY ABACUSUP */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12"><span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Why AbacusUp</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">The Difference Is In The Method</h2></Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {why.map((w: any, i: number) => { const I = whyIcons[i % whyIcons.length]; return <Reveal key={i} delay={i * 80} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"><div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4"><I className="w-5 h-5" /></div><h3 className="text-sm font-bold text-slate-900">{w.title}</h3><p className="text-xs text-slate-500 mt-2 leading-relaxed">{w.text}</p></Reveal>; })}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div><span className="text-xs font-bold text-teal-600 uppercase tracking-wider block mb-1">Structured Programs</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Academic Curriculum</h2></div>
            <Link href="/courses" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">Full Course Catalog <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.slice(0, 4).map((co, i) => (
              <Reveal key={co.id} delay={i * 80} className="bg-slate-50 rounded-3xl border border-slate-200/80 p-6 hover:bg-white hover:shadow-md transition flex flex-col justify-between">
                <div><span className="text-[10px] font-mono font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">{co.code}</span><h3 className="text-base font-bold text-slate-900 mt-3">{co.name}</h3><p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{co.description}</p></div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs"><div><span className="text-[10px] text-slate-400 block">Tuition</span><strong className="text-sm font-black text-teal-700">${co.fee}</strong></div><div className="text-right"><span className="text-[10px] text-slate-400 block">Duration</span><strong className="text-slate-800">{co.duration}</strong></div></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LEVELS */}
      {levels.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12"><span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Progression Path</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">Level-by-Level Mastery</h2></Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {levels.slice(0, 6).map((l, i) => <Reveal key={l.id} delay={i * 60} className="bg-white p-5 rounded-2xl border border-slate-200/80 flex gap-4"><div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center flex-shrink-0">L{l.levelNumber}</div><div><p className="text-sm font-bold text-slate-900">{l.name}</p><p className="text-xs text-slate-500 mt-1 line-clamp-2">{l.description}</p><p className="text-[10px] text-indigo-600 font-bold mt-2">{l.durationWeeks} weeks</p></div></Reveal>)}
            </div>
          </div>
        </section>
      )}

      {/* TEACHERS CAROUSEL */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div><span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">Instructional Faculty</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Certified Master Instructors</h2></div>
            <Link href="/teachers" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600">All Instructors <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <TeacherCarousel teachers={teachers} />
        </div>
      </section>

      {/* BRANCHES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12"><span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Campuses</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">Modern Learning Centers</h2></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {branches.map((b, i) => (
              <Reveal key={b.id} delay={i * 100}>
                <Link href={`/branches/${b.id}`} className="block bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4"><span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">{b.branchCode}</span><span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {b.status}</span></div>
                  <h3 className="text-xl font-bold text-slate-900">{b.name}</h3><p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">{b.description}</p>
                  <p className="text-xs text-slate-600 mt-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.address}, {b.city}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-4">Campus details <ChevronRight className="w-3.5 h-3.5" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="py-20 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10"><div><span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Life at AbacusUp</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Gallery</h2></div><Link href="/gallery" className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></Link></div>
            <GalleryGrid items={gallery} showFilter={false} />
          </div>
        </section>
      )}

      {/* EVENTS */}
      {events.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10"><div><span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">What's Next</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Upcoming Events</h2></div><Link href="/events" className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">All events <ChevronRight className="w-4 h-4" /></Link></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((e, i) => (
                <Reveal key={e.id} delay={i * 80}><Link href={`/events/${e.slug}`} className="block bg-white rounded-3xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition h-full">
                  {e.imageUrl ? <img src={e.imageUrl} alt={e.title} loading="lazy" className="w-full h-44 object-cover" /> : <div className="w-full h-44 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"><CalendarDays className="w-10 h-10 text-amber-500" /></div>}
                  <div className="p-5"><p className="text-[10px] font-bold text-amber-700 uppercase">{new Date(e.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {e.eventTime}</p><h3 className="text-base font-bold text-slate-900 mt-1">{e.title}</h3><p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</p></div>
                </Link></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12"><span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Family Testimonials</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">Trusted by Hundreds of Parents</h2></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => <Reveal key={t.id} delay={i * 100} className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 flex flex-col justify-between"><div><div className="flex space-x-1 text-amber-400 mb-4">{Array.from({ length: t.rating }).map((_, k) => <Star key={k} className="w-4 h-4 fill-amber-400" />)}</div><p className="text-sm text-slate-700 leading-relaxed italic">"{t.message}"</p></div><div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">{t.photoUrl && <img src={t.photoUrl} alt={t.name} className="w-9 h-9 rounded-full object-cover" />}<div><strong className="text-xs font-bold text-slate-900 block">{t.name}</strong><span className="text-[11px] text-slate-500">{t.role}</span></div></div></Reveal>)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-10"><span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Questions</span><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">Frequently Asked Questions</h2></Reveal>
            <FaqAccordion items={faqs.slice(0, 5)} />
            <div className="text-center mt-6"><Link href="/faq" className="text-xs font-bold text-blue-600">See all FAQs →</Link></div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white">
        <Reveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{cta.title || "Ready to Accelerate Your Child's Mathematical Potential?"}</h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">{cta.text}</p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={cta.buttonLink || "/admission"} className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm rounded-2xl shadow-lg transition">{cta.buttonText || "Apply for Admission"} <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/apply-branch" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition">Open a Franchise Branch</Link>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
