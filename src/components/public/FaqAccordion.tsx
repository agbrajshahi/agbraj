"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
export function FaqAccordion({ items }: { items: any[] }) {
  const [open, setOpen] = useState<number | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white overflow-hidden">
      {items.map((f) => (
        <div key={f.id}>
          <button onClick={() => setOpen(open === f.id ? null : f.id)} className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition">
            <span className="text-sm font-bold text-slate-900">{f.question}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open === f.id ? "rotate-180" : ""}`} />
          </button>
          <div className={`grid transition-all duration-300 ${open === f.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><p className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed">{f.answer}</p></div></div>
        </div>
      ))}
    </div>
  );
}
