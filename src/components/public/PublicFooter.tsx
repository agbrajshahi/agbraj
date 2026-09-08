import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Shield, Sparkles } from "lucide-react";
import { getContent } from "@/lib/public/data";

export async function PublicFooter() {
  const c = await getContent();
  const footer = c.footer || {}; const social = c.social_links || {}; const contact = c.contact_info || {};
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center space-x-3"><div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white font-black text-lg">A</div><span className="text-lg font-black tracking-tight text-white">ABACUS<span className="text-blue-400">UP</span></span></Link>
          <p className="leading-relaxed">{footer.tagline || "Empowering youth cognitive agility through modern Soroban methods."}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[["facebook", "Fb"], ["instagram", "Ig"], ["youtube", "Yt"], ["linkedin", "In"]].map(([k, l]) => social[k] ? <a key={k} href={social[k]} target="_blank" rel="noreferrer" aria-label={k} className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white text-[10px] font-black flex items-center justify-center transition">{l}</a> : null)}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Academy</span>
          <ul className="space-y-2">{[["/about", "About Us"], ["/courses", "Curriculum"], ["/teachers", "Instructors"], ["/branches", "Campuses"], ["/gallery", "Gallery"], ["/events", "Events"]].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white transition">{l}</Link></li>)}</ul>
        </div>
        <div>
          <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Get Started</span>
          <ul className="space-y-2">{[["/admission", "Apply for Admission"], ["/apply-branch", "Open a Franchise Branch"], ["/blog", "Blog & Insights"], ["/faq", "FAQ"], ["/contact", "Contact Us"]].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white transition">{l}</Link></li>)}</ul>
        </div>
        <div>
          <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Headquarters</span>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" /><span>{contact.address || "100 Innovation Way, Metro City"}</span></li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /><span>{contact.phone || "+1 (800) 555-ABACUS"}</span></li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /><span>{contact.email || "admissions@abacusup.com"}</span></li>
            <li className="pt-2"><Link href="/login" className="inline-flex items-center gap-1.5 text-blue-400 font-bold hover:underline"><Shield className="w-3.5 h-3.5" /> Staff & Parent Portal →</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-900"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
        <p>&copy; {new Date().getFullYear()} {footer.copyright || "ABACUSUP. All rights reserved."}</p>
        <span className="flex items-center gap-1.5 text-teal-500 font-semibold"><Sparkles className="w-3.5 h-3.5" /> Education Management Platform · Phase 4</span>
      </div></div>
    </footer>
  );
}
