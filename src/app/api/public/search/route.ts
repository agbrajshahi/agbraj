import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, teachers, branches, blogPosts, events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const m = (s?: string | null) => (s || "").toLowerCase().includes(q);
  const [c, t, b, p, e] = await Promise.all([
    db.select().from(courses), db.select().from(teachers), db.select().from(branches),
    db.select().from(blogPosts).where(eq(blogPosts.status, "PUBLISHED")), db.select().from(events).where(eq(events.status, "PUBLISHED")),
  ]);
  const results = [
    ...c.filter((x) => m(x.name) || m(x.description)).map((x) => ({ type: "Course", title: x.name, subtitle: x.duration, href: "/courses" })),
    ...t.filter((x) => m(x.name) || m(x.qualification)).map((x) => ({ type: "Teacher", title: x.name, subtitle: x.qualification, href: `/teachers/${x.id}` })),
    ...b.filter((x) => m(x.name) || m(x.city)).map((x) => ({ type: "Branch", title: x.name, subtitle: x.city, href: `/branches/${x.id}` })),
    ...p.filter((x) => m(x.title) || m(x.excerpt)).map((x) => ({ type: "Blog", title: x.title, subtitle: x.category, href: `/blog/${x.slug}` })),
    ...e.filter((x) => m(x.title) || m(x.location)).map((x) => ({ type: "Event", title: x.title, subtitle: x.location, href: `/events/${x.slug}` })),
  ].slice(0, 30);
  return NextResponse.json({ results });
}
