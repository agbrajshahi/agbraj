"use client";
import { CalendarDays } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function EventsAdminPage() {
  return <ResourceManager title="Events" description="Open houses, competitions, workshops shown on the public site" icon={CalendarDays} endpoint="/api/cms/events" accent="amber" createLabel="New Event"
    defaultValues={{ title: "", description: "", imageUrl: "", eventDate: new Date().toISOString().slice(0, 10), eventTime: "10:00 AM – 12:00 PM", location: "", branchId: "", status: "PUBLISHED" }}
    fields={[{ name: "title", label: "Title", required: true, colSpan: 2 }, { name: "description", label: "Description", type: "textarea", rows: 4 }, { name: "eventDate", label: "Date", type: "date", required: true }, { name: "eventTime", label: "Time" }, { name: "location", label: "Location" }, { name: "branchId", label: "Branch ID (optional)", type: "number" }, { name: "status", label: "Status", type: "select", options: ["PUBLISHED", "DRAFT", "CANCELLED", "COMPLETED"], required: true }, { name: "imageUrl", label: "Event Image", type: "image" }]}
    columns={[{ key: "title", label: "Event", render: (r) => <div><p className="font-bold text-slate-900">{r.title}</p><p className="text-[10px] text-slate-400">/events/{r.slug}</p></div> }, { key: "eventDate", label: "Date", render: (r) => <span>{new Date(r.eventDate).toLocaleDateString()} · {r.eventTime}</span> }, { key: "location", label: "Location" }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]}
    filterOptions={{ key: "status", label: "Status", options: ["PUBLISHED", "DRAFT", "CANCELLED", "COMPLETED"] }} />;
}
