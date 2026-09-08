import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { Reveal } from "@/components/public/Reveal";
import { getPosts, SITE_URL } from "@/lib/public/data";
import { Newspaper } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog & Insights", description: "Articles on mental arithmetic, learning science, and parenting from AbacusUp.", alternates: { canonical: `${SITE_URL}/blog` } };
export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <PublicLayout>
      <PageHero tone="teal" eyebrow="Insights" title="Blog & Learning Resources" text="Research-backed articles on focus, memory, and mathematical confidence." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? <p className="text-sm text-slate-500 p-8 bg-white rounded-2xl border text-center">No articles published yet.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p, i) => <Reveal key={p.id} delay={i * 60}><Link href={`/blog/${p.slug}`} className="block bg-white rounded-3xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition h-full">
              {p.featuredImageUrl ? <img src={p.featuredImageUrl} alt={p.title} loading="lazy" className="w-full h-48 object-cover" /> : <div className="w-full h-48 bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center"><Newspaper className="w-10 h-10 text-teal-500" /></div>}
              <div className="p-6"><span className="text-[10px] font-bold uppercase text-teal-600">{p.category}</span><h2 className="text-lg font-bold text-slate-900 mt-1 leading-snug">{p.title}</h2><p className="text-xs text-slate-500 mt-2 line-clamp-3">{p.excerpt}</p><p className="text-[11px] text-slate-400 mt-4">{p.authorName} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}</p></div>
            </Link></Reveal>)}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
