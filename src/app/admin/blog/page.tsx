"use client";
import { Newspaper } from "lucide-react";
import { ResourceManager, statusBadge } from "@/components/admin/ResourceManager";
export default function BlogAdminPage() {
  return <ResourceManager title="Blog" description="Articles with SEO metadata — draft and publish" icon={Newspaper} endpoint="/api/cms/blog" accent="teal" createLabel="New Post"
    defaultValues={{ title: "", slug: "", excerpt: "", content: "", featuredImageUrl: "", authorName: "", category: "General", seoTitle: "", seoDescription: "", status: "DRAFT" }}
    fields={[{ name: "title", label: "Title", required: true }, { name: "slug", label: "Slug (auto from title if blank)", placeholder: "my-post-slug" }, { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2 }, { name: "content", label: "Content (Markdown-friendly)", type: "textarea", rows: 10, required: true }, { name: "authorName", label: "Author Name" }, { name: "category", label: "Category" }, { name: "seoTitle", label: "SEO Title" }, { name: "seoDescription", label: "SEO Description" }, { name: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"], required: true }, { name: "featuredImageUrl", label: "Featured Image", type: "image" }]}
    columns={[{ key: "title", label: "Post", render: (r) => <div><p className="font-bold text-slate-900">{r.title}</p><p className="text-[10px] text-slate-400">/blog/{r.slug} · {r.category}</p></div> }, { key: "authorName", label: "Author" }, { key: "publishedAt", label: "Published", render: (r) => <span>{r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : "—"}</span> }, { key: "status", label: "Status", render: (r) => statusBadge(r.status) }]}
    filterOptions={{ key: "status", label: "Status", options: ["DRAFT", "PUBLISHED"] }} />;
}
