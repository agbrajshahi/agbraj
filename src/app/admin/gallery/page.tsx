"use client";
import { Images } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
const CATS = ["CLASSES", "EVENTS", "COMPETITIONS", "BRANCHES", "ACTIVITIES", "TEACHERS", "STUDENTS"];
export default function GalleryPage() {
  return <ResourceManager title="Gallery" description="Photo gallery — upload, categorize, sort, publish/unpublish" icon={Images} endpoint="/api/cms/gallery" accent="purple" createLabel="Upload Photo"
    defaultValues={{ title: "", imageUrl: "", caption: "", category: "ACTIVITIES", branchId: "", sortOrder: "0", status: "PUBLISHED" }}
    fields={[{ name: "title", label: "Title", required: true }, { name: "category", label: "Category", type: "select", options: CATS, required: true }, { name: "caption", label: "Caption", type: "textarea", rows: 2 }, { name: "branchId", label: "Branch ID (optional)", type: "number" }, { name: "sortOrder", label: "Sort Order", type: "number" }, { name: "status", label: "Status", type: "select", options: ["PUBLISHED", "DRAFT"], required: true }, { name: "imageUrl", label: "Photo", type: "image" }]}
    columns={[{ key: "title", label: "Photo", render: (r) => <div className="flex items-center gap-3"><img src={r.imageUrl} loading="lazy" className="w-14 h-10 object-cover rounded-lg bg-slate-100" /><div><p className="font-bold text-slate-900">{r.title}</p><p className="text-[10px] text-slate-400">{r.caption}</p></div></div> }, { key: "category", label: "Category", render: (r) => <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">{r.category}</span> }, { key: "sortOrder", label: "Order" }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]}
    filterOptions={{ key: "category", label: "Categories", options: CATS }}
    extraActions={(row, refresh) => <button onClick={async () => { await fetch(`/api/cms/gallery/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }) }); refresh(); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[10px]">{row.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>} />;
}
