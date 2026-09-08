"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck, Search, ChevronDown } from "lucide-react";

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => fetch(`/api/public/search?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setResults(d.results || [])).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q]);

  const navLinks = [
    { name: "Home", href: "/" }, { name: "About", href: "/about" }, { name: "Courses", href: "/courses" }, { name: "Teachers", href: "/teachers" },
    { name: "Branches", href: "/branches" }, { name: "Gallery", href: "/gallery" }, { name: "Events", href: "/events" }, { name: "Blog", href: "/blog" }, { name: "FAQ", href: "/faq" }, { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white font-black text-xl">A</div>
          <div><span className="text-xl font-extrabold tracking-tight text-slate-900">ABACUS<span className="text-blue-600">UP</span></span><span className="text-[10px] tracking-wider font-bold text-slate-400 uppercase block -mt-1">Mental Arithmetic Academy</span></div>
        </Link>

        <nav className="hidden xl:flex items-center space-x-0.5 text-[13px] font-semibold text-slate-600">
          {navLinks.map((l) => <Link key={l.href} href={l.href} className={`px-3 py-2 rounded-xl transition ${pathname === l.href ? "text-blue-600 bg-blue-50/80 font-bold" : "hover:text-slate-900 hover:bg-slate-50"}`}>{l.name}</Link>)}
        </nav>

        <div className="hidden md:flex items-center space-x-2">
          <div className="relative">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Search"><Search className="w-4 h-4" /></button>
            {searchOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses, teachers, branches, blog..." className="w-full px-4 py-3 text-xs border-b border-slate-100 focus:outline-none" />
                <div className="max-h-72 overflow-y-auto">
                  {results.length === 0 ? <p className="p-4 text-[11px] text-slate-400">{q.length < 2 ? "Type at least 2 characters" : "No results"}</p> : results.map((r, i) => <Link key={i} href={r.href} onClick={() => { setSearchOpen(false); setQ(""); }} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-xs border-b border-slate-50"><div><p className="font-bold text-slate-900">{r.title}</p><p className="text-[10px] text-slate-500">{r.subtitle}</p></div><span className="text-[10px] font-bold text-blue-600">{r.type}</span></Link>)}
                </div>
              </div>
            )}
          </div>
          <Link href="/admission" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20">Apply Now</Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"><ShieldCheck className="w-4 h-4 text-teal-400" /> Portal</Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="xl:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100" aria-label="Menu">{mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
      </div>

      {mobileOpen && (
        <div className="xl:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          {results.length > 0 && <div className="rounded-xl border border-slate-100 divide-y">{results.slice(0, 6).map((r, i) => <Link key={i} href={r.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-xs"><span className="font-bold">{r.title}</span> <span className="text-slate-400">· {r.type}</span></Link>)}</div>}
          <div className="grid grid-cols-2 gap-1">{navLinks.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">{l.name}</Link>)}</div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Link href="/admission" onClick={() => setMobileOpen(false)} className="py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold text-center">Apply Now</Link>
            <Link href="/apply-branch" onClick={() => setMobileOpen(false)} className="py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center">Open a Branch</Link>
            <Link href="/login" onClick={() => setMobileOpen(false)} className="col-span-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold text-center">Portal Sign In</Link>
          </div>
        </div>
      )}
    </header>
  );
}
