import { createCrudHandlers, h } from "./crud";
import { banners, galleryItems, videos, events, blogPosts, faqs, testimonials, contactMessages } from "@/db/schema";

export const bannersCrud = createCrudHandlers({
  table: banners, entity: "BANNER", viewPermission: "cms.view", managePermission: "cms.manage", orderBy: "sortOrder",
  toRow: (d) => ({ title: d.title, subtitle: h.nul(d.subtitle), imageUrl: h.nul(d.imageUrl), ctaText: h.nul(d.ctaText), ctaLink: h.nul(d.ctaLink), sortOrder: h.num(d.sortOrder), status: d.status }),
});

export const galleryCrud = createCrudHandlers({
  table: galleryItems, entity: "GALLERY", viewPermission: "cms.view", managePermission: "cms.manage", orderBy: "sortOrder",
  toRow: (d, u) => ({ title: d.title, imageUrl: d.imageUrl, caption: h.nul(d.caption), category: d.category, branchId: h.fk(d.branchId), sortOrder: h.num(d.sortOrder), status: d.status, uploadedBy: u.id }),
});

export const videosCrud = createCrudHandlers({
  table: videos, entity: "VIDEO", viewPermission: "cms.view", managePermission: "cms.manage", orderBy: "sortOrder",
  toRow: (d) => ({ title: d.title, description: h.nul(d.description), videoUrl: d.videoUrl, thumbnailUrl: h.nul(d.thumbnailUrl), category: d.category, storageProvider: d.videoUrl ? (d.videoUrl.includes("youtu") ? "YOUTUBE" : d.videoUrl.includes("vimeo") ? "VIMEO" : "URL") : undefined, sortOrder: h.num(d.sortOrder), status: d.status }),
});

export const eventsCrud = createCrudHandlers({
  table: events, entity: "EVENT", viewPermission: "cms.view", managePermission: "cms.manage",
  toRow: (d) => ({ title: d.title, slug: d.title ? `${h.slugify(d.title)}-${Date.now().toString(36)}` : undefined, description: h.nul(d.description), imageUrl: h.nul(d.imageUrl), eventDate: d.eventDate ? new Date(d.eventDate) : undefined, eventTime: h.nul(d.eventTime), location: h.nul(d.location), branchId: h.fk(d.branchId), status: d.status }),
  toUpdate: (d) => ({ title: d.title, description: h.nul(d.description), imageUrl: h.nul(d.imageUrl), eventDate: d.eventDate ? new Date(d.eventDate) : undefined, eventTime: h.nul(d.eventTime), location: h.nul(d.location), branchId: h.fk(d.branchId), status: d.status }),
});

export const blogCrud = createCrudHandlers({
  table: blogPosts, entity: "BLOG", viewPermission: "cms.view", managePermission: "cms.manage",
  toRow: (d, u) => ({ title: d.title, slug: d.slug ? h.slugify(d.slug) : d.title ? h.slugify(d.title) : undefined, excerpt: h.nul(d.excerpt), content: d.content, featuredImageUrl: h.nul(d.featuredImageUrl), authorId: u.id, authorName: d.authorName || u.name, category: d.category, seoTitle: h.nul(d.seoTitle), seoDescription: h.nul(d.seoDescription), status: d.status, publishedAt: d.status === "PUBLISHED" ? new Date() : null }),
  toUpdate: (d) => ({ title: d.title, slug: d.slug ? h.slugify(d.slug) : undefined, excerpt: h.nul(d.excerpt), content: d.content, featuredImageUrl: h.nul(d.featuredImageUrl), category: d.category, seoTitle: h.nul(d.seoTitle), seoDescription: h.nul(d.seoDescription), status: d.status, publishedAt: d.status === "PUBLISHED" ? new Date() : undefined }),
});

export const faqCrud = createCrudHandlers({
  table: faqs, entity: "FAQ", viewPermission: "cms.view", managePermission: "cms.manage", orderBy: "sortOrder",
  toRow: (d) => ({ question: d.question, answer: d.answer, category: d.category, sortOrder: h.num(d.sortOrder), status: d.status }),
});

export const testimonialsCrud = createCrudHandlers({
  table: testimonials, entity: "TESTIMONIAL", viewPermission: "cms.view", managePermission: "cms.manage",
  toRow: (d) => ({ name: d.name, photoUrl: h.nul(d.photoUrl), role: h.nul(d.role), message: d.message, rating: h.num(d.rating), status: d.status }),
});

export const contactCrud = createCrudHandlers({
  table: contactMessages, entity: "CONTACT_MESSAGE", viewPermission: "cms.view", managePermission: "cms.manage",
  toRow: (d) => ({ name: d.name, email: d.email, phone: h.nul(d.phone), subject: h.nul(d.subject), message: d.message, status: d.status, adminNotes: h.nul(d.adminNotes) }),
  toUpdate: (d) => ({ status: d.status, adminNotes: h.nul(d.adminNotes) }),
});
