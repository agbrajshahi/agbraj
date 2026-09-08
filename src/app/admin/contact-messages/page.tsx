"use client";
import { Mail } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function ContactMessagesPage() {
  return <ResourceManager title="Contact Messages" description="Inbound inquiries from the public contact form" icon={Mail} endpoint="/api/cms/contact-messages" accent="slate" readOnlyCreate searchKeys={["name", "email", "subject", "message"]}
    defaultValues={{ status: "NEW", adminNotes: "" }}
    fields={[{ name: "name", label: "Name" }, { name: "email", label: "Email" }, { name: "phone", label: "Phone" }, { name: "subject", label: "Subject" }, { name: "message", label: "Message", type: "textarea", rows: 5 }, { name: "status", label: "Status", type: "select", options: ["NEW", "READ", "REPLIED", "CLOSED"], required: true }, { name: "adminNotes", label: "Internal Notes", type: "textarea", rows: 3 }]}
    columns={[{ key: "name", label: "From", render: (r) => <div><p className="font-bold text-slate-900">{r.name}</p><p className="text-[10px] text-slate-400">{r.email} · {r.phone || "—"}</p></div> }, { key: "subject", label: "Subject", render: (r) => <div><p className="font-semibold">{r.subject || "General"}</p><p className="text-[10px] text-slate-500 line-clamp-1 max-w-md">{r.message}</p></div> }, { key: "createdAt", label: "Received", render: (r) => <span>{new Date(r.createdAt).toLocaleString()}</span> }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]}
    filterOptions={{ key: "status", label: "Status", options: ["NEW", "READ", "REPLIED", "CLOSED"] }}
    extraActions={(row, refresh) => row.status === "NEW" ? <button onClick={async () => { await fetch(`/api/cms/contact-messages/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "READ" }) }); refresh(); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[10px]">Mark Read</button> : null} />;
}
