"use client";
import { Video } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function VideosPage() {
  return <ResourceManager title="Videos" description="Video library (YouTube / Vimeo / direct URL — cloud storage-ready)" icon={Video} endpoint="/api/cms/videos" accent="rose" createLabel="Add Video"
    defaultValues={{ title: "", description: "", videoUrl: "", thumbnailUrl: "", category: "CLASSES", sortOrder: "0", status: "PUBLISHED" }}
    fields={[{ name: "title", label: "Title", required: true, colSpan: 2 }, { name: "videoUrl", label: "Video URL", type: "url", required: true, colSpan: 2, placeholder: "https://youtube.com/watch?v=..." }, { name: "description", label: "Description", type: "textarea", rows: 2 }, { name: "category", label: "Category", type: "select", options: ["CLASSES", "EVENTS", "COMPETITIONS", "BRANCHES", "ACTIVITIES", "TEACHERS", "STUDENTS"], required: true }, { name: "sortOrder", label: "Sort Order", type: "number" }, { name: "status", label: "Status", type: "select", options: ["PUBLISHED", "DRAFT"], required: true }, { name: "thumbnailUrl", label: "Thumbnail", type: "image" }]}
    columns={[{ key: "title", label: "Video", render: (r) => <div><p className="font-bold text-slate-900">{r.title}</p><a href={r.videoUrl} target="_blank" className="text-[10px] text-blue-600 truncate block max-w-xs">{r.videoUrl}</a></div> }, { key: "storageProvider", label: "Source" }, { key: "category", label: "Category" }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]} />;
}
