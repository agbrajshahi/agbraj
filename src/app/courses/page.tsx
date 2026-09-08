import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { Reveal } from "@/components/public/Reveal";
import { getCourses, getLevels, SITE_URL } from "@/lib/public/data";
import { ArrowRight } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Curriculum & Courses", description: "Structured Soroban mental arithmetic courses for ages 5–16 with levels, modules, and lessons.", alternates: { canonical: `${SITE_URL}/courses` } };
export default async function CoursesPage() {
  const [courses, levels] = await Promise.all([getCourses(), getLevels()]);
  return (
    <PublicLayout>
      <PageHero tone="teal" eyebrow="Curriculum Architecture" title="Our Structured Course Programs" text="From foundational bead placement to lightning Anzan visualization and competitive speed arithmetic." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        {courses.map((c, i) => {
          const cl = levels.filter((l) => l.courseId === c.id);
          return (
            <Reveal key={c.id} delay={i * 80} className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                {c.thumbnailUrl && <img src={c.thumbnailUrl} alt={c.name} loading="lazy" className="w-full h-40 object-cover rounded-2xl mb-5" />}
                <div className="flex items-center justify-between mb-3"><span className="text-xs font-mono font-bold uppercase text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">{c.code}</span><span className="text-xs font-bold text-slate-500">Age {c.targetAge}</span></div>
                <h2 className="text-2xl font-bold text-slate-900">{c.name}</h2><p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.description}</p>
                {cl.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{cl.map((l) => <span key={l.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">L{l.levelNumber}: {l.name.replace(/^Level \d+:\s*/, "")}</span>)}</div>}
                <div className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 text-xs"><div><span className="text-slate-400 block text-[11px]">Duration</span><strong className="text-slate-900 text-sm">{c.duration}</strong></div><div><span className="text-slate-400 block text-[11px]">Tuition</span><strong className="text-teal-700 text-sm font-bold">${c.fee}</strong></div></div>
              </div>
              <div className="mt-6 flex items-center justify-between"><span className="text-xs text-slate-400">Max 15 students / batch</span><Link href={`/admission?courseId=${c.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold">Enroll <ArrowRight className="w-3.5 h-3.5" /></Link></div>
            </Reveal>
          );
        })}
      </div>
    </PublicLayout>
  );
}
