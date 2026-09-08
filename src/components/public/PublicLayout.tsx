import React from "react";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
export function PageHero({ eyebrow, title, text, tone = "blue" }: { eyebrow: string; title: string; text?: string; tone?: string }) {
  const tones: Record<string, string> = { blue: "from-blue-50/70", teal: "from-teal-50/70", indigo: "from-indigo-50/70", emerald: "from-emerald-50/70", amber: "from-amber-50/70", purple: "from-purple-50/70", rose: "from-rose-50/70" };
  const eyebrowTone: Record<string, string> = { blue: "text-blue-600", teal: "text-teal-600", indigo: "text-indigo-600", emerald: "text-emerald-600", amber: "text-amber-600", purple: "text-purple-600", rose: "text-rose-600" };
  return (
    <div className={`bg-gradient-to-b ${tones[tone] || tones.blue} to-white py-16 border-b border-slate-200`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className={`text-xs font-bold uppercase tracking-wider ${eyebrowTone[tone] || eyebrowTone.blue}`}>{eyebrow}</span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">{title}</h1>
        {text && <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">{text}</p>}
      </div>
    </div>
  );
}
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
