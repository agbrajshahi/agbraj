import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/public/PublicLayout";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { TeacherCard } from "@/components/public/TeacherCarousel";
import { getBranchById, getTeachers, getCourses, countStudentsByBranch, getBatchesByBranch, getGalleryByBranch, SITE_URL } from "@/lib/public/data";
import { db } from "@/db"; import { users } from "@/db/schema"; import { eq } from "drizzle-orm";
import { MapPin, Phone, Mail, ArrowLeft, Users, GraduationCap, CalendarDays, User } from "lucide-react";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const b = await getBranchById(parseInt(id));
  return { title: b ? `${b.name} — Campus` : "Campus", description: b?.description || undefined, alternates: { canonical: `${SITE_URL}/branches/${id}` } };
}
export default async function BranchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const bid = parseInt(id); const b = await getBranchById(bid);
  if (!b) notFound();
  const [teachers, courses, studentCount, batches, gallery] = await Promise.all([getTeachers(), getCourses(), countStudentsByBranch(bid), getBatchesByBranch(bid), getGalleryByBranch(bid)]);
  const branchTeachers = teachers.filter((t) => t.branchId === bid);
  const manager = b.managerId ? (await db.select({ name: users.name }).from(users).where(eq(users.id, b.managerId)).limit(1))[0] : null;
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "EducationalOrganization", name: b.name, telephone: b.phone, email: b.email, address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city }, parentOrganization: { "@type": "Organization", name: "ABACUSUP" } }) }} />
      <div className="bg-gradient-to-b from-emerald-50/70 to-white border-b border-slate-200"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/branches" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6"><ArrowLeft className="w-4 h-4" /> All Campuses</Link>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-3xl flex items-center justify-center overflow-hidden border-4 border-white shadow">{b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="w-full h-full object-cover" /> : b.name.charAt(0)}</div>
          <div className="flex-1"><span className="text-xs font-mono font-bold text-emerald-700">{b.branchCode}</span><h1 className="text-3xl sm:text-4xl font-black text-slate-950">{b.name}</h1><p className="text-sm text-slate-600 mt-2 max-w-2xl">{b.description}</p></div>
        </div>
      </div></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ I: GraduationCap, l: "Students", v: studentCount }, { I: Users, l: "Instructors", v: branchTeachers.length }, { I: CalendarDays, l: "Active Batches", v: batches.length }, { I: User, l: "Manager", v: manager?.name || "Campus Team" }].map((s) => <div key={s.l} className="bg-white p-5 rounded-2xl border border-slate-200/80 text-center"><s.I className="w-5 h-5 text-emerald-600 mx-auto mb-2" /><p className="text-lg font-black text-slate-900">{s.v}</p><p className="text-[10px] font-bold text-slate-500 uppercase">{s.l}</p></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <section><h2 className="text-lg font-bold text-slate-900 mb-4">Courses Offered</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{courses.map((c) => <div key={c.id} className="p-4 bg-white rounded-2xl border border-slate-200"><p className="text-sm font-bold text-slate-900">{c.name}</p><p className="text-xs text-slate-500 mt-1">{c.duration} · ${c.fee}</p></div>)}</div></section>
            {batches.length > 0 && <section><h2 className="text-lg font-bold text-slate-900 mb-4">Class Batches</h2><div className="space-y-2">{batches.map((bt) => <div key={bt.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center text-xs"><div><p className="font-bold text-slate-900">{bt.name}</p><p className="text-slate-500">{bt.courseName} · {bt.schedule}</p></div><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">{bt.status}</span></div>)}</div></section>}
            {branchTeachers.length > 0 && <section><h2 className="text-lg font-bold text-slate-900 mb-4">Instructors at this Campus</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{branchTeachers.map((t) => <TeacherCard key={t.id} t={t} />)}</div></section>}
            {gallery.length > 0 && <section><h2 className="text-lg font-bold text-slate-900 mb-4">Campus Gallery</h2><GalleryGrid items={gallery} showFilter={false} /></section>}
          </div>
          <aside className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3 text-xs"><h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Contact</h3><p className="flex items-start gap-2 text-slate-700"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> {b.address}, {b.city}</p><p className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" /> {b.phone}</p><p className="flex items-center gap-2 text-slate-700"><Mail className="w-4 h-4 text-slate-400" /> {b.email}</p><p className="text-slate-500 pt-2 border-t border-slate-100">Open since {new Date(b.openingDate).toLocaleDateString()}</p></div>
            <Link href={`/admission?branchId=${b.id}`} className="block text-center px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold">Apply at this Campus</Link>
            <Link href="/contact" className="block text-center px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold">Schedule a Tour</Link>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
