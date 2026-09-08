import type { Metadata } from "next";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { TeacherCard } from "@/components/public/TeacherCarousel";
import { Reveal } from "@/components/public/Reveal";
import { getTeachers, SITE_URL } from "@/lib/public/data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Instructors", description: "Meet certified Soroban master educators guiding young minds to arithmetic excellence.", alternates: { canonical: `${SITE_URL}/teachers` } };
export default async function TeachersPage() {
  const teachers = await getTeachers();
  return (
    <PublicLayout>
      <PageHero tone="indigo" eyebrow="Instructional Faculty" title="Certified Mental Math Educators" text="Every trainer is a certified master abacus practitioner with pedagogical expertise in early childhood focus and visualization." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teachers.map((t, i) => <Reveal key={t.id} delay={i * 60}><TeacherCard t={t} /></Reveal>)}
      </div>
    </PublicLayout>
  );
}
