import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/public/PublicLayout";
import { getTeacherById, getTeachers, SITE_URL } from "@/lib/public/data";
import { Briefcase, Building, ArrowLeft, GraduationCap } from "lucide-react";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const t = await getTeacherById(parseInt(id));
  return { title: t ? `${t.name} — Instructor` : "Instructor", description: t?.bio || undefined, alternates: { canonical: `${SITE_URL}/teachers/${id}` } };
}
export default async function TeacherDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const t = await getTeacherById(parseInt(id));
  if (!t) notFound();
  const others = (await getTeachers()).filter((x) => x.id !== t.id).slice(0, 3);
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: t.name, jobTitle: t.qualification, worksFor: { "@type": "EducationalOrganization", name: "ABACUSUP" }, description: t.bio }) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <Link href="/teachers" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> All Instructors</Link>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center"><div className="w-40 h-40 rounded-3xl bg-indigo-100 text-indigo-700 font-black text-5xl flex items-center justify-center mx-auto overflow-hidden border-4 border-white shadow-lg">{t.photoUrl ? <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" /> : t.name.charAt(0)}</div></div>
          <div className="md:col-span-2 space-y-4">
            <div><span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Certified Instructor</span><h1 className="text-3xl font-black text-slate-950 mt-1">{t.name}</h1><p className="text-sm font-semibold text-slate-600 mt-1">{t.qualification}</p></div>
            <div className="flex flex-wrap gap-3 text-xs"><span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg font-semibold text-slate-700"><Briefcase className="w-3.5 h-3.5" /> {t.experience} experience</span>{t.branchName && <Link href={`/branches/${t.branchId}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold"><Building className="w-3.5 h-3.5" /> {t.branchName}</Link>}</div>
            <p className="text-sm text-slate-600 leading-relaxed">{t.bio}</p>
            <Link href="/admission" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"><GraduationCap className="w-4 h-4" /> Apply to Learn with {t.name.split(" ")[0]}</Link>
          </div>
        </div>
        {others.length > 0 && <div><h2 className="text-lg font-bold text-slate-900 mb-4">Other Instructors</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{others.map((o) => <Link key={o.id} href={`/teachers/${o.id}`} className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center overflow-hidden">{o.photoUrl ? <img src={o.photoUrl} className="w-full h-full object-cover" /> : o.name.charAt(0)}</div><div><p className="text-sm font-bold text-slate-900">{o.name}</p><p className="text-[11px] text-slate-500 line-clamp-1">{o.qualification}</p></div></Link>)}</div></div>}
      </div>
    </PublicLayout>
  );
}
