"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutTemplate, Save, Loader2, Image as ImageIcon, Images, Video, CalendarDays, Newspaper, HelpCircle, Quote, Mail, Building2, Users, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Block = { key: string; section: string; title: string; content: any };

const BLOCK_DEFS: { key: string; section: string; title: string; fields: { name: string; label: string; type?: "textarea" }[]; list?: { name: string; fields: string[] } }[] = [
  { key: "home_hero", section: "HOME", title: "Homepage — Hero", fields: [{ name: "badge", label: "Badge" }, { name: "headline", label: "Headline" }, { name: "subheadline", label: "Sub-headline", type: "textarea" }, { name: "primaryCta", label: "Primary Button" }, { name: "primaryLink", label: "Primary Link" }, { name: "secondaryCta", label: "Secondary Button" }, { name: "secondaryLink", label: "Secondary Link" }] },
  { key: "home_about", section: "HOME", title: "Homepage — About", fields: [{ name: "eyebrow", label: "Eyebrow" }, { name: "title", label: "Title" }, { name: "body", label: "Body", type: "textarea" }] },
  { key: "home_why", section: "HOME", title: "Homepage — Why AbacusUp", fields: [], list: { name: "items", fields: ["title", "text"] } },
  { key: "home_stats", section: "HOME", title: "Homepage — Statistics", fields: [], list: { name: "items", fields: ["label", "value"] } },
  { key: "home_cta", section: "HOME", title: "Homepage — CTA", fields: [{ name: "title", label: "Title" }, { name: "text", label: "Text", type: "textarea" }, { name: "buttonText", label: "Button Text" }, { name: "buttonLink", label: "Button Link" }] },
  { key: "about_page", section: "ABOUT", title: "About Page", fields: [{ name: "title", label: "Title" }, { name: "intro", label: "Intro", type: "textarea" }, { name: "mission", label: "Mission", type: "textarea" }, { name: "vision", label: "Vision", type: "textarea" }] },
  { key: "contact_info", section: "CONTACT", title: "Contact Information", fields: [{ name: "address", label: "Address" }, { name: "phone", label: "Phone" }, { name: "email", label: "Email" }, { name: "hours", label: "Hours" }] },
  { key: "footer", section: "FOOTER", title: "Footer", fields: [{ name: "tagline", label: "Tagline", type: "textarea" }, { name: "copyright", label: "Copyright" }] },
  { key: "social_links", section: "SOCIAL", title: "Social Links", fields: [{ name: "facebook", label: "Facebook" }, { name: "instagram", label: "Instagram" }, { name: "youtube", label: "YouTube" }, { name: "linkedin", label: "LinkedIn" }] },
];

const MODULES = [
  { name: "Banners", href: "/admin/banners", icon: ImageIcon }, { name: "Gallery", href: "/admin/gallery", icon: Images }, { name: "Videos", href: "/admin/videos", icon: Video },
  { name: "Events", href: "/admin/events", icon: CalendarDays }, { name: "Blog", href: "/admin/blog", icon: Newspaper }, { name: "FAQ", href: "/admin/faqs", icon: HelpCircle },
  { name: "Testimonials", href: "/admin/testimonials", icon: Quote }, { name: "Contact Messages", href: "/admin/contact-messages", icon: Mail },
  { name: "Branch Applications", href: "/admin/branch-applications", icon: Building2 }, { name: "Teachers (site profiles)", href: "/admin/teachers", icon: Users }, { name: "Courses (site catalog)", href: "/admin/courses", icon: BookOpen }, { name: "Branches (site pages)", href: "/admin/branches", icon: Building2 },
];

export default function CmsPage() {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(BLOCK_DEFS[0].key);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/cms/content").then((r) => r.json()).then((d) => {
      const map: Record<string, any> = {};
      (d.items || []).forEach((b: Block) => (map[b.key] = b.content));
      setBlocks(map);
    }).finally(() => setLoading(false));
  }, []);

  const def = BLOCK_DEFS.find((b) => b.key === active)!;
  const content = blocks[active] || {};
  const set = (name: string, val: any) => setBlocks({ ...blocks, [active]: { ...content, [name]: val } });

  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/cms/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: def.key, section: def.section, title: def.title, content }) });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast("Content published to website", "success");
    } catch (e: any) { toast(e.message, "error"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><LayoutTemplate className="w-7 h-7 text-indigo-600" /> Website CMS</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage every public-facing section without touching code</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {MODULES.map((m) => { const I = m.icon; return <Link key={m.href} href={m.href} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition flex items-center gap-2 text-xs font-bold text-slate-800"><I className="w-4 h-4 text-indigo-600" /> {m.name}</Link>; })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-1 mb-2">Content Blocks</p>
          {BLOCK_DEFS.map((b) => <button key={b.key} onClick={() => setActive(b.key)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${active === b.key ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{b.title}</button>)}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          {loading ? <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div> : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div><h2 className="text-sm font-bold text-slate-900">{def.title}</h2><p className="text-[10px] font-mono text-slate-400">{def.key} · {def.section}</p></div>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"><Save className="w-4 h-4" /> {saving ? "Publishing..." : "Publish"}</button>
              </div>
              {def.fields.map((f) => (
                <div key={f.name}>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{f.label}</label>
                  {f.type === "textarea" ? <textarea rows={3} value={content[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /> : <input value={content[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />}
                </div>
              ))}
              {def.list && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><label className="font-bold text-slate-700 uppercase">Items</label><button onClick={() => set(def.list!.name, [...(content[def.list!.name] || []), Object.fromEntries(def.list!.fields.map((k) => [k, ""]))])} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold">+ Add Item</button></div>
                  {(content[def.list.name] || []).map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                      {def.list!.fields.map((k) => <div key={k}><label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">{k}</label><input value={item[k] || ""} onChange={(e) => { const arr = [...content[def.list!.name]]; arr[idx] = { ...arr[idx], [k]: e.target.value }; set(def.list!.name, arr); }} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white" /></div>)}
                      <button onClick={() => set(def.list!.name, content[def.list!.name].filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 text-sm">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
