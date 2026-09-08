import type { MetadataRoute } from "next";
import { db } from "@/db";
import { blogPosts, events, teachers, branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/public/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/about", "/courses", "/teachers", "/branches", "/gallery", "/events", "/blog", "/faq", "/contact", "/admission", "/apply-branch"];
  const [posts, evs, tchs, brs] = await Promise.all([
    db.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt }).from(blogPosts).where(eq(blogPosts.status, "PUBLISHED")),
    db.select({ slug: events.slug, updatedAt: events.updatedAt }).from(events).where(eq(events.status, "PUBLISHED")),
    db.select({ id: teachers.id, updatedAt: teachers.updatedAt }).from(teachers),
    db.select({ id: branches.id, updatedAt: branches.updatedAt }).from(branches),
  ]);
  return [
    ...staticPages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...evs.map((e) => ({ url: `${SITE_URL}/events/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...tchs.map((t) => ({ url: `${SITE_URL}/teachers/${t.id}`, lastModified: t.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...brs.map((b) => ({ url: `${SITE_URL}/branches/${b.id}`, lastModified: b.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
