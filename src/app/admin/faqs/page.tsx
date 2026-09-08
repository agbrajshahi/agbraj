"use client";
import { HelpCircle } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function FaqAdminPage() {
  return <ResourceManager title="FAQ" description="Frequently asked questions shown as an accordion on the website" icon={HelpCircle} endpoint="/api/cms/faqs" accent="blue" createLabel="New FAQ" searchKeys={["question", "category"]}
    defaultValues={{ question: "", answer: "", category: "General", sortOrder: "0", status: "PUBLISHED" }}
    fields={[{ name: "question", label: "Question", required: true, colSpan: 2 }, { name: "answer", label: "Answer", type: "textarea", rows: 4, required: true }, { name: "category", label: "Category" }, { name: "sortOrder", label: "Sort Order", type: "number" }, { name: "status", label: "Status", type: "select", options: ["PUBLISHED", "DRAFT"], required: true }]}
    columns={[{ key: "question", label: "Question", render: (r) => <div><p className="font-bold text-slate-900">{r.question}</p><p className="text-[10px] text-slate-400 line-clamp-1 max-w-md">{r.answer}</p></div> }, { key: "category", label: "Category" }, { key: "sortOrder", label: "Order" }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]} />;
}
