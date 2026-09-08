"use client";
import { Quote, Star } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function TestimonialsAdminPage() {
  return <ResourceManager title="Testimonials" description="Parent & student testimonials — approve before they appear publicly" icon={Quote} endpoint="/api/cms/testimonials" accent="emerald" createLabel="Add Testimonial" searchKeys={["name", "role", "message"]}
    defaultValues={{ name: "", photoUrl: "", role: "", message: "", rating: "5", status: "APPROVED" }}
    fields={[{ name: "name", label: "Name", required: true }, { name: "role", label: "Role", placeholder: "Parent of Leo (Age 8)" }, { name: "message", label: "Message", type: "textarea", rows: 4, required: true }, { name: "rating", label: "Rating (1-5)", type: "number" }, { name: "status", label: "Status", type: "select", options: ["PENDING", "APPROVED", "REJECTED"], required: true }, { name: "photoUrl", label: "Photo", type: "image" }]}
    columns={[{ key: "name", label: "Author", render: (r) => <div><p className="font-bold text-slate-900">{r.name}</p><p className="text-[10px] text-slate-400">{r.role}</p></div> }, { key: "message", label: "Message", render: (r) => <p className="text-slate-600 line-clamp-2 max-w-md">{r.message}</p> }, { key: "rating", label: "Rating", render: (r) => <span className="flex text-amber-400">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}</span> }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]}
    filterOptions={{ key: "status", label: "Status", options: ["PENDING", "APPROVED", "REJECTED"] }}
    extraActions={(row, refresh) => row.status !== "APPROVED" ? <button onClick={async () => { await fetch(`/api/cms/testimonials/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" }) }); refresh(); }} className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]">Approve</button> : null} />;
}
