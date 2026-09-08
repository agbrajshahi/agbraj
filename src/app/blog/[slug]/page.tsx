import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/public/PublicLayout";
import { getPostBySlug, getPosts, SITE_URL } from "@/lib/public/data";
import { ArrowLeft } from "lucide-react";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const p = await getPostBySlug(slug);
  return { title: p?.seoTitle || p?.title || "Article", description: p?.seoDescription || p?.excerpt || undefined, alternates: { canonical: `${SITE_URL}/blog/${slug}` }, openGraph: { type: "article", title: p?.seoTitle || p?.title, description: p?.seoDescription || p?.excerpt || undefined, images: p?.featuredImageUrl ? [p.featuredImageUrl] : [] } };
}
/** Minimal markdown → blocks: headings (#, ##, ###), paragraphs, line breaks. */
function renderContent(md: string) {
  return md.split(/\n{2,}/).map((block, i) => {
    const t = block.trim(); if (!t) return null;
    if (t.startsWith("### ")) return <h3 key={i} className="text-lg font-bold text-slate-900 mt-6">{t.slice(4)}</h3>;
    if (t.startsWith("## ")) return <h2 key={i} className="text-2xl font-extrabold text-slate-950 mt-8">{t.slice(3)}</h2>;
    if (t.startsWith("# ")) return <h1 key={i} className="text-3xl font-black text-slate-950 mt-8">{t.slice(2)}</h1>;
    return <p key={i} className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">{t}</p>;
  });
}
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const p = await getPostBySlug(slug);
  if (!p) notFound();
  const related = (await getPosts(4)).filter((x) => x.id !== p.id).slice(0, 3);
  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.excerpt, image: p.featuredImageUrl, author: { "@type": "Person", name: p.authorName }, publisher: { "@type": "Organization", name: "ABACUSUP" }, datePublished: p.publishedAt, mainEntityOfPage: `${SITE_URL}/blog/${p.slug}` }) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> All Articles</Link>
        <header className="space-y-3"><span className="text-[10px] font-bold uppercase text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">{p.category}</span><h1 className="text-3xl sm:text-5xl font-black text-slate-950 leading-tight">{p.title}</h1><p className="text-sm text-slate-500">By <strong className="text-slate-800">{p.authorName}</strong> · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : ""}</p></header>
        {p.featuredImageUrl && <img src={p.featuredImageUrl} alt={p.title} className="w-full h-72 sm:h-96 object-cover rounded-3xl shadow-lg" />}
        {p.excerpt && <p className="text-base text-slate-600 italic border-l-4 border-teal-500 pl-4">{p.excerpt}</p>}
        <div className="space-y-4">{renderContent(p.content)}</div>
        {related.length > 0 && <div className="pt-10 border-t border-slate-200"><h2 className="text-lg font-bold text-slate-900 mb-4">More Articles</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{related.map((r) => <Link key={r.id} href={`/blog/${r.slug}`} className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition"><span className="text-[10px] font-bold text-teal-600 uppercase">{r.category}</span><p className="text-sm font-bold text-slate-900 mt-1">{r.title}</p></Link>)}</div></div>}
      </article>
    </PublicLayout>
  );
}
