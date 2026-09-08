"use client";
import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
export function GalleryGrid({ items, showFilter = true }: { items: any[]; showFilter?: boolean }) {
  const [cat, setCat] = useState("ALL");
  const [idx, setIdx] = useState<number | null>(null);
  const cats = ["ALL", ...Array.from(new Set(items.map((i) => i.category)))];
  const list = cat === "ALL" ? items : items.filter((i) => i.category === cat);
  const close = () => setIdx(null);
  const step = (d: number) => setIdx((i) => (i === null ? null : (i + d + list.length) % list.length));
  return (
    <div>
      {showFilter && cats.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-6">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${cat === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{c}</button>)}</div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {list.map((g, i) => (
          <button key={g.id} onClick={() => setIdx(i)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={g.imageUrl} alt={g.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-left opacity-0 group-hover:opacity-100 transition"><p className="text-white text-xs font-bold">{g.title}</p><p className="text-white/70 text-[10px] uppercase">{g.category}</p></div>
          </button>
        ))}
      </div>
      {idx !== null && list[idx] && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={close}>
          <button onClick={close} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 sm:left-6 p-2 text-white/70 hover:text-white"><ChevronLeft className="w-8 h-8" /></button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={list[idx].imageUrl} alt={list[idx].title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
            <div className="text-center mt-4"><p className="text-white font-bold">{list[idx].title}</p><p className="text-white/60 text-xs mt-1">{list[idx].caption}</p></div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 sm:right-6 p-2 text-white/70 hover:text-white"><ChevronRight className="w-8 h-8" /></button>
        </div>
      )}
    </div>
  );
}
