import { db } from "./index";
import { roles, permissions, rolePermissions, cmsContents, banners, galleryItems, videos, events, blogPosts, faqs, testimonials, branches } from "./schema";
import { eq } from "drizzle-orm";

export async function seedPhase4() {
  console.log("Seeding Phase 4 — Public Website + CMS + Media + Communication...");
  const existing = await db.select().from(permissions).where(eq(permissions.code, "cms.view"));
  if (existing.length) { console.log("Phase 4 already seeded. Skipping."); return; }

  const allRoles = await db.select().from(roles);
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));

  const perms = await db.insert(permissions).values([
    { code: "cms.view", module: "cms", description: "View CMS content, media, messages and applications" },
    { code: "cms.manage", module: "cms", description: "Edit website content, media, events, blog, FAQ, testimonials" },
  ]).returning();
  for (const roleName of ["ADMIN", "CONTENT_MANAGER"]) {
    const rid = roleMap.get(roleName);
    if (rid) await db.insert(rolePermissions).values(perms.map((p) => ({ roleId: rid, permissionId: p.id })));
  }
  const bm = roleMap.get("BRANCH_MANAGER");
  if (bm) await db.insert(rolePermissions).values([{ roleId: bm, permissionId: perms[0].id }]);
  console.log("CMS permissions seeded.");

  const allBranches = await db.select().from(branches);
  const b1 = allBranches[0]; const b2 = allBranches[1];

  await db.insert(cmsContents).values([
    { key: "home_hero", section: "HOME", title: "Homepage Hero", content: { badge: "Premium Mental Arithmetic Academy", headline: "Unleash Child Genius Through Mental Abacus Mastery.", subheadline: "ABACUSUP is a premier education technology academy cultivating lightning calculation, photographic memory, and lifelong mathematical confidence.", primaryCta: "Explore Curriculum", primaryLink: "/courses", secondaryCta: "Apply for Admission", secondaryLink: "/admission" } },
    { key: "home_about", section: "HOME", title: "Homepage About", content: { eyebrow: "Cognitive Science & Pedagogy", title: "Why Soroban Mental Arithmetic Transforms Young Minds", body: "Dual-hand Soroban calculation engages both the analytical left hemisphere and creative right visual hemisphere simultaneously — building memory, focus, and speed." } },
    { key: "home_why", section: "HOME", title: "Why AbacusUp", content: { items: [
      { title: "Certified Master Trainers", text: "Every instructor holds Soroban Level 10+ certification and early-childhood pedagogy training." },
      { title: "4-Tier Structured Curriculum", text: "Course → Level → Module → Lesson progression with measurable milestones and graded assessments." },
      { title: "Small Cohort Batches", text: "Maximum 15 students per batch for personalized attention and individualized pacing." },
      { title: "Transparent Parent Portal", text: "Real-time attendance, results, assignments, and invoices for every guardian." },
    ] } },
    { key: "home_stats", section: "HOME", title: "Statistics", content: { items: [{ label: "Students Trained", value: "1,200+" }, { label: "Certified Instructors", value: "25+" }, { label: "Campus Locations", value: "2" }, { label: "Olympiad Medals", value: "40+" }] } },
    { key: "home_cta", section: "HOME", title: "CTA", content: { title: "Ready to Accelerate Your Child's Mathematical Potential?", text: "Book an introductory placement assessment at any campus today.", buttonText: "Apply for Admission", buttonLink: "/admission" } },
    { key: "about_page", section: "ABOUT", title: "About Page", content: { title: "Nurturing Young Minds Through Brain-Balanced Calculation", intro: "Founded with the belief that every child possesses extraordinary cognitive potential, AbacusUp transforms mathematical learning into a joyful, confidence-building journey.", mission: "To make world-class mental arithmetic education accessible through certified instructors, structured curriculum, and technology-enabled transparency.", vision: "A generation of confident, focused, mathematically fluent young learners." } },
    { key: "contact_info", section: "CONTACT", title: "Contact Info", content: { address: "100 Innovation Way, Suite 400, Metro City", phone: "+1 (800) 555-ABACUS", email: "admissions@abacusup.com", hours: "Mon – Sat, 9:00 AM – 7:00 PM" } },
    { key: "footer", section: "FOOTER", title: "Footer", content: { tagline: "Empowering youth cognitive agility, photographic visualization, and lightning-fast mathematical mastery through modern Soroban methods.", copyright: "ABACUSUP. All rights reserved." } },
    { key: "social_links", section: "SOCIAL", title: "Social Links", content: { facebook: "https://facebook.com/abacusup", instagram: "https://instagram.com/abacusup", youtube: "https://youtube.com/@abacusup", linkedin: "https://linkedin.com/company/abacusup" } },
  ]);

  await db.insert(banners).values([
    { title: "Admissions Open — Spring 2026 Cohort", subtitle: "Limited seats in Foundation Soroban and Mental Anzan batches.", ctaText: "Apply Now", ctaLink: "/admission", sortOrder: 1 },
    { title: "National Mental Math Olympiad Prep", subtitle: "Speed calculation bootcamp for ages 9–15 starts next month.", ctaText: "View Courses", ctaLink: "/courses", sortOrder: 2 },
  ]);

  await db.insert(galleryItems).values([
    { title: "Foundation Class in Session", imageUrl: "https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&w=1200", caption: "Students practicing bead manipulation", category: "CLASSES", branchId: b1?.id, sortOrder: 1 },
    { title: "Annual Speed Calculation Contest", imageUrl: "https://images.pexels.com/photos/8535230/pexels-photo-8535230.jpeg?auto=compress&w=1200", caption: "Regional competition finals", category: "COMPETITIONS", branchId: b1?.id, sortOrder: 2 },
    { title: "Downtown Campus Smart Lab", imageUrl: "https://images.pexels.com/photos/8471894/pexels-photo-8471894.jpeg?auto=compress&w=1200", caption: "Interactive learning environment", category: "BRANCHES", branchId: b1?.id, sortOrder: 3 },
    { title: "Parents' Day Celebration", imageUrl: "https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&w=1200", caption: "Families celebrating student milestones", category: "EVENTS", branchId: b2?.id, sortOrder: 4 },
    { title: "Instructor Training Workshop", imageUrl: "https://images.pexels.com/photos/8617843/pexels-photo-8617843.jpeg?auto=compress&w=1200", caption: "Continuous professional development", category: "TEACHERS", sortOrder: 5 },
    { title: "Level 3 Graduates", imageUrl: "https://images.pexels.com/photos/8535214/pexels-photo-8535214.jpeg?auto=compress&w=1200", caption: "Certificate ceremony", category: "STUDENTS", branchId: b2?.id, sortOrder: 6 },
  ]);

  await db.insert(videos).values([
    { title: "What is Anzan? Mental Visualization Explained", description: "A short introduction to how children move from physical beads to mental images.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", category: "CLASSES", storageProvider: "YOUTUBE", sortOrder: 1 },
    { title: "Campus Tour — Downtown Central", description: "A walk-through of our flagship smart lab.", videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U", category: "BRANCHES", storageProvider: "YOUTUBE", sortOrder: 2 },
  ]);

  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);
  await db.insert(events).values([
    { title: "Spring Open House & Free Assessment Day", slug: "spring-open-house-2026", description: "Meet our instructors, tour the smart labs, and get a complimentary placement assessment for your child. Live Anzan demonstrations every hour.", imageUrl: "https://images.pexels.com/photos/8613312/pexels-photo-8613312.jpeg?auto=compress&w=1200", eventDate: d(12), eventTime: "10:00 AM – 2:00 PM", location: "Downtown Central Campus", branchId: b1?.id },
    { title: "Inter-Branch Speed Calculation Championship", slug: "speed-calculation-championship-2026", description: "Students from all campuses compete in flash anzan, multi-digit addition, and mental multiplication rounds. Trophies and certificates for top performers.", imageUrl: "https://images.pexels.com/photos/8535227/pexels-photo-8535227.jpeg?auto=compress&w=1200", eventDate: d(30), eventTime: "9:00 AM – 4:00 PM", location: "North Valley Learning Center", branchId: b2?.id },
    { title: "Parent Workshop: Supporting Practice at Home", slug: "parent-workshop-home-practice", description: "Practical strategies for guardians to reinforce daily abacus practice, build routines, and track progress through the Parent Portal.", eventDate: d(-15), eventTime: "6:00 PM – 7:30 PM", location: "Online (Zoom)", status: "COMPLETED" },
  ]);

  await db.insert(blogPosts).values([
    { title: "5 Ways Abacus Training Boosts Concentration in Young Learners", slug: "5-ways-abacus-boosts-concentration", excerpt: "Research-backed reasons why bead-based arithmetic strengthens attention span and working memory.", content: "## Focus is a trainable skill\n\nSoroban practice requires sustained visual attention, precise finger movement, and rapid recall — a combination that builds executive function.\n\n### 1. Bilateral hand coordination\nUsing both hands stimulates cross-hemispheric communication.\n\n### 2. Visualization drills\nAnzan practice trains the mind's eye to hold and manipulate images.\n\n### 3. Timed repetition\nShort, timed sets improve processing speed without fatigue.\n\n### 4. Immediate feedback\nStudents self-correct in real time, reinforcing accuracy.\n\n### 5. Progressive mastery\nLevel-based milestones create intrinsic motivation.", featuredImageUrl: "https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&w=1200", authorName: "Sarah Lin", category: "Learning Science", seoTitle: "How Abacus Training Boosts Concentration | AbacusUp", seoDescription: "Discover five research-backed ways Soroban abacus training improves focus and memory in children.", status: "PUBLISHED", publishedAt: d(-5) },
    { title: "Choosing the Right Starting Level for Your Child", slug: "choosing-the-right-starting-level", excerpt: "A guide to our placement assessment and what each level teaches.", content: "Our Foundation program begins with bead basics for ages 5–8, while Mental Arithmetic suits 7–12 year olds with number sense. A 30-minute assessment determines the ideal entry point.", authorName: "Priya Sharma", category: "Admissions", status: "PUBLISHED", publishedAt: d(-12) },
    { title: "Inside Our Instructor Certification Program", slug: "instructor-certification-program", excerpt: "How AbacusUp trains and certifies every master trainer.", content: "Draft content — publishing soon.", authorName: "Eleanor Vance", category: "Academy", status: "DRAFT" },
  ]);

  await db.insert(faqs).values([
    { question: "What age is best to start abacus training?", answer: "Children typically start between ages 5 and 8, once they can count to 10 and hold a pencil. Our placement assessment determines readiness.", category: "Admissions", sortOrder: 1 },
    { question: "How long does each course take?", answer: "Foundation Soroban runs 16 weeks; Mental Arithmetic runs 24 weeks. Each level includes graded assessments before progression.", category: "Curriculum", sortOrder: 2 },
    { question: "How many students are in a batch?", answer: "Batches are capped at 12–15 students to ensure individualized attention.", category: "Curriculum", sortOrder: 3 },
    { question: "Can parents track progress online?", answer: "Yes. The Parent Portal shows attendance, results, assignments, class schedules, study materials, and invoices in real time.", category: "Portal", sortOrder: 4 },
    { question: "What payment methods do you accept?", answer: "Cash, bank transfer, mobile banking (bKash/Nagad), and online card payments. Installment plans are available.", category: "Fees", sortOrder: 5 },
    { question: "How do I open an AbacusUp franchise branch?", answer: "Submit the Branch Application form. Our team reviews within 5 business days and schedules a call with qualified applicants.", category: "Franchise", sortOrder: 6 },
  ]);

  await db.insert(testimonials).values([
    { name: "Marcus Vance", role: "Parent of Leo (Age 8)", message: "Within 4 months at AbacusUp Downtown, Leo calculates three-digit numbers faster than a calculator. His focus and school math scores skyrocketed.", rating: 5, status: "APPROVED" },
    { name: "Dr. Serena Patel", role: "Cognitive Neuroscientist & Parent", message: "The bilateral tactile bead manipulation at AbacusUp noticeably trains spatial memory and executive function. Exceptional pedagogy.", rating: 5, status: "APPROVED" },
    { name: "Jonathan Wright", role: "Parent of Chloe (Age 10)", message: "The instructors are patient and inspiring. The portal tracking attendance and academic levels makes progress so transparent.", rating: 5, status: "APPROVED" },
    { name: "Amina Rahman", role: "Parent", message: "My daughter looks forward to every class. Highly recommended!", rating: 4, status: "PENDING" },
  ]);

  console.log("Phase 4 seed completed successfully.");
}
