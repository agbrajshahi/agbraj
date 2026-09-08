import { db } from "@/db";
import { cmsContents, banners, galleryItems, videos, events, blogPosts, faqs, testimonials, courses, teachers, branches, students, batches } from "@/db/schema";
import { eq, desc, asc, and, gte } from "drizzle-orm";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getContent(): Promise<Record<string, any>> {
  const rows = await db.select().from(cmsContents);
  const map: Record<string, any> = {};
  rows.forEach((r) => (map[r.key] = r.content));
  return map;
}

export const getBanners = () => db.select().from(banners).where(eq(banners.status, "PUBLISHED")).orderBy(asc(banners.sortOrder));
export const getGallery = (limit?: number) => { const q = db.select().from(galleryItems).where(eq(galleryItems.status, "PUBLISHED")).orderBy(asc(galleryItems.sortOrder), desc(galleryItems.id)); return limit ? q.limit(limit) : q; };
export const getVideos = () => db.select().from(videos).where(eq(videos.status, "PUBLISHED")).orderBy(asc(videos.sortOrder));
export const getUpcomingEvents = (limit?: number) => { const q = db.select().from(events).where(and(eq(events.status, "PUBLISHED"), gte(events.eventDate, new Date(Date.now() - 86400000)))).orderBy(asc(events.eventDate)); return limit ? q.limit(limit) : q; };
export const getAllEvents = () => db.select().from(events).where(eq(events.status, "PUBLISHED")).orderBy(desc(events.eventDate));
export const getEventBySlug = async (slug: string) => (await db.select().from(events).where(eq(events.slug, slug)).limit(1))[0] || null;
export const getPosts = (limit?: number) => { const q = db.select().from(blogPosts).where(eq(blogPosts.status, "PUBLISHED")).orderBy(desc(blogPosts.publishedAt)); return limit ? q.limit(limit) : q; };
export const getPostBySlug = async (slug: string) => (await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "PUBLISHED"))).limit(1))[0] || null;
export const getFaqs = () => db.select().from(faqs).where(eq(faqs.status, "PUBLISHED")).orderBy(asc(faqs.sortOrder));
export const getTestimonials = (limit?: number) => { const q = db.select().from(testimonials).where(eq(testimonials.status, "APPROVED")).orderBy(desc(testimonials.id)); return limit ? q.limit(limit) : q; };
export const getCourses = () => db.select().from(courses).where(eq(courses.status, "ACTIVE"));
export const getTeachers = () => db.select({ id: teachers.id, name: teachers.name, qualification: teachers.qualification, experience: teachers.experience, bio: teachers.bio, photoUrl: teachers.photoUrl, branchId: teachers.branchId, branchName: branches.name }).from(teachers).leftJoin(branches, eq(teachers.branchId, branches.id)).where(eq(teachers.status, "ACTIVE"));
export const getTeacherById = async (id: number) => (await getTeachers()).find((t) => t.id === id) || null;
export const getBranches = () => db.select().from(branches);
export const getBranchById = async (id: number) => (await db.select().from(branches).where(eq(branches.id, id)).limit(1))[0] || null;
export const countStudentsByBranch = async (branchId: number) => (await db.select({ id: students.id }).from(students).where(eq(students.branchId, branchId))).length;
export const getBatchesByBranch = (branchId: number) => db.select({ id: batches.id, name: batches.name, schedule: batches.schedule, courseName: courses.name, status: batches.status }).from(batches).leftJoin(courses, eq(batches.courseId, courses.id)).where(eq(batches.branchId, branchId));
export const getGalleryByBranch = (branchId: number) => db.select().from(galleryItems).where(and(eq(galleryItems.status, "PUBLISHED"), eq(galleryItems.branchId, branchId)));
import { courseLevels } from "@/db/schema";
export const getLevels = () => db.select({ id: courseLevels.id, name: courseLevels.name, description: courseLevels.description, durationWeeks: courseLevels.durationWeeks, courseId: courseLevels.courseId, levelNumber: courseLevels.levelNumber }).from(courseLevels).orderBy(asc(courseLevels.courseId), asc(courseLevels.levelNumber));
