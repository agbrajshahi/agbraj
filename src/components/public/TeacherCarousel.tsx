"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function TeacherCard({ t }: { t: any }) {
  return (
    <Link href={`/teachers/${t.id}`} className="block bg-white rounded-3xl border border-slate-200/80 p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all h-full">
      <div className="w-24 h-24 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-3xl flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">{t.photoUrl ? <img src={t.photoUrl} alt={t.name} loading="lazy" className="w-full h-full object-cover" /> : t.name.charAt(0)}</div>
      <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
      <p className="text-xs font-semibold text-indigo-600 mt-0.5 line-clamp-1">{t.qualification || "Abacus Master Trainer"}</p>
      <p className="text-[11px] text-slate-400 mt-1">{t.experience} · {t.branchName}</p>
      <p className="text-[11px] text-slate-500 mt-3 line-clamp-3 leading-relaxed">{t.bio}</p>
    </Link>
  );
}
export function TeacherCarousel({ teachers }: { teachers: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 320, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {teachers.map((t) => <div key={t.id} className="min-w-[280px] sm:min-w-[300px] snap-start"><TeacherCard t={t} /></div>)}
      </div>
      <div className="flex justify-center gap-2 mt-2">
        <button onClick={() => scroll(-1)} className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
        <button onClick={() => scroll(1)} className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
