import type { Metadata } from "next";
import { PublicLayout, PageHero } from "@/components/public/PublicLayout";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { getGallery, getVideos, SITE_URL } from "@/lib/public/data";
import { PlayCircle } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery", description: "Photos and videos from AbacusUp classes, competitions, events, and campuses.", alternates: { canonical: `${SITE_URL}/gallery` } };
function embedUrl(url: string) {
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/); if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/); if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}
export default async function GalleryPage() {
  const [items, vids] = await Promise.all([getGallery(), getVideos()]);
  return (
    <PublicLayout>
      <PageHero tone="purple" eyebrow="Life at AbacusUp" title="Photo & Video Gallery" text="Classes, competitions, events, campuses, and student milestones." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <GalleryGrid items={items} />
        {vids.length > 0 && (
          <section><h2 className="text-2xl font-extrabold text-slate-950 mb-6 flex items-center gap-2"><PlayCircle className="w-6 h-6 text-rose-600" /> Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{vids.map((v) => <div key={v.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm"><div className="aspect-video bg-slate-900"><iframe src={embedUrl(v.videoUrl)} title={v.title} loading="lazy" allowFullScreen className="w-full h-full" /></div><div className="p-5"><span className="text-[10px] font-bold uppercase text-rose-600">{v.category}</span><h3 className="text-base font-bold text-slate-900 mt-1">{v.title}</h3><p className="text-xs text-slate-500 mt-1">{v.description}</p></div></div>)}</div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
