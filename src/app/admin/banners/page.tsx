"use client";
import { Image as ImageIcon } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function BannersPage() {
  return <ResourceManager title="Hero Banners" description="Rotating hero banners displayed on the public homepage" icon={ImageIcon} endpoint="/api/cms/banners" accent="indigo" createLabel="New Banner"
    defaultValues={{ title: "", subtitle: "", imageUrl: "", ctaText: "Learn More", ctaLink: "/courses", sortOrder: "0", status: "PUBLISHED" }}
    fields={[{ name: "title", label: "Title", required: true, colSpan: 2 }, { name: "subtitle", label: "Subtitle", type: "textarea", rows: 2 }, { name: "ctaText", label: "Button Text" }, { name: "ctaLink", label: "Button Link", placeholder: "/admission" }, { name: "sortOrder", label: "Sort Order", type: "number" }, { name: "status", label: "Status", type: "select", options: ["PUBLISHED", "DRAFT"], required: true }, { name: "imageUrl", label: "Banner Image", type: "image" }]}
    columns={[{ key: "title", label: "Banner", render: (r) => <div className="flex items-center gap-3">{r.imageUrl && <img src={r.imageUrl} className="w-14 h-9 object-cover rounded-lg" />}<div><p className="font-bold text-slate-900">{r.title}</p><p className="text-[10px] text-slate-400 truncate max-w-xs">{r.subtitle}</p></div></div> }, { key: "ctaText", label: "CTA", render: (r) => <span>{r.ctaText} → {r.ctaLink}</span> }, { key: "sortOrder", label: "Order" }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]}
    filterOptions={{ key: "status", label: "Status", options: ["PUBLISHED", "DRAFT"] }} />;
}
