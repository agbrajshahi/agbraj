# ABACUSUP — Phase 1: Foundation + Core Education Management System (EMS)

ABACUSUP is a professional full-stack Education Management SaaS platform designed specifically for Soroban abacus academies, learning franchises, instructors, and student cohorts.

---

## 🚀 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Server Components, API Route Handlers, Edge-ready architecture
- **Database**: PostgreSQL
- **ORM / Schema**: Drizzle ORM (`drizzle-kit`)
- **Authentication**: Secure Session-based Authentication with bcrypt password hashing and HTTP-only cookies
- **File Uploads**: Foundation supporting student portraits, teacher photos, branch logos, course thumbnails, and certificates with strict MIME and size validations

---

## 🏛 Database Schema & Entities

The relational database architecture is defined in `src/db/schema.ts` and includes:
1. `roles`: Pre-seeded with 8 system roles (`SUPER_ADMIN`, `ADMIN`, `BRANCH_MANAGER`, `TEACHER`, `ACCOUNTANT`, `CONTENT_MANAGER`, `STUDENT`, `PARENT`)
2. `permissions` & `role_permissions`: Granular matrix (`students.*`, `teachers.*`, `branches.*`, `courses.*`, `batches.*`, `users.*`, `reports.view`, `settings.manage`) with `SUPER_ADMIN` automatic bypass
3. `users`: Multi-tenant staff directory with bcrypt hashed passwords, status flags (`ACTIVE`, `INACTIVE`), and branch affiliations
4. `branches`: Physical campuses with coordinates, manager references, student capacity, and operational statistics
5. `teachers`: Instructor qualifications, biometric/portrait metadata, experience, and branch assignments
6. `students`: Full student profile, date of birth, emergency contacts, parent/guardian info, current level, course, and batch allocation
7. `courses`: 4-Tier structured curriculum hierarchy: `courses` → `course_levels` → `course_modules` → `course_lessons`
8. `batches`: Class cohorts, schedules, assigned teachers, room numbers, and capacity limits
9. `enrollments`: Association of students to course batches
10. `attendance`: Session records with `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED` status flags
11. `documents`: Entity document registry for uploaded certificates, identity proofs, and assets
12. `notifications`: In-app notification center with read/unread tracking
13. `activity_logs`: Audit trail tracking `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `PASSWORD_CHANGE`
14. `settings`: General, Appearance, and Security system configuration
15. `sessions` & `password_reset_tokens`: Session lifecycle and forgot/reset password tokens

---

## 🔐 Authentication & Security

- **Password Hashing**: Salted bcrypt hashing (never stored in plaintext)
- **Session Management**: Random 64-character cryptographically secure token stored in PostgreSQL `sessions` and passed via `httpOnly`, `sameSite: lax` cookies
- **Role-Based Access Control (RBAC)**: Permission verification on all protected endpoints (`hasPermission(user, permissionCode)`)
- **Branch Manager Isolation**: Branch Managers are scoped strictly to their assigned campus
- **Audit Logging**: Every sensitive mutation and session action writes to `activity_logs`
- **File Validation**: Max 5MB file size limit and strict MIME validation (JPEG, PNG, WebP, SVG, PDF, DOCX)

---

## ⚡ Development & Seed Data

The database has been seeded with realistic data:
- **1 Super Admin**: `superadmin@abacusup.com` (Password: `AbacusUp@2026!`)
- **1 Admin**: `admin@abacusup.com` (Password: `AbacusUp@2026!`)
- **1 Branch Manager**: `manager.downtown@abacusup.com` (Password: `AbacusUp@2026!`)
- **5 Instructors**: `sarah.lin@abacusup.com`, `david.kim@abacusup.com`, `priya.sharma@abacusup.com`, `michael.chen@abacusup.com`, `elena.rostova@abacusup.com`
- **2 Branches**: Downtown Central Campus (`BR-DWT-01`) and North Valley Learning Center (`BR-NVL-02`)
- **20 Realistic Students**: Enrolled in batches with guardian details and attendance records
- **4 Comprehensive Courses**: Foundation Soroban, Mental Arithmetic (Anzan), Speed Calculation Pro, Advanced Vedic Math with levels, modules, and lessons
- **4 Cohort Batches**: With rooms, schedules, and capacities

---

## 🛠 Local Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit DATABASE_URL and AUTH_SECRET in .env

# 3. Apply schema to PostgreSQL
npx drizzle-kit push

# 4. Seed database
npx tsx src/db/run-seed.ts

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public marketing academy website, and [http://localhost:3000/login](http://localhost:3000/login) for the EMS management portal.

---

## 📋 Implemented Phase 1 Features

### Public Website
- **Home (`/`)**: Hero, About Pedagogy, Course Previews, Certified Teachers, Campus Locations, Testimonials, CTA, Footer
- **About (`/about`)**: Cognitive science of dual-hemisphere Soroban calculation
- **Curriculum (`/courses`)**: Catalog of course syllabi, fees, and durations
- **Teachers (`/teachers`)**: Instructor profiles, certifications, and experience
- **Campuses (`/branches`)**: Campus details, facilities, and contact points
- **Contact (`/contact`)**: Assessment scheduling form and inquiry system

### EMS Administrative Portal (`/admin`)
- **Overview Dashboard (`/admin`)**: Metric cards (Total & Active Students, Teachers, Branches, Courses, Batches), branch capacity distribution, curriculum enrollment distribution, live activity audit stream
- **Student Management (`/admin/students`)**: Search, filter by branch/course/status, CSV export, student registration modal with photo upload, and student profile (`/admin/students/[id]`) with 8 tabs:
  1. Overview
  2. Personal
  3. Guardian
  4. Academic
  5. Attendance
  6. Payments-ready section
  7. Documents
  8. Activity
- **Teacher Management (`/admin/teachers`)**: Instructor directory, onboarding modal with photo upload, profile view with assigned batches and documents (`/admin/teachers/[id]`)
- **Branch Management (`/admin/branches`)**: Campus directory, campus creation, detailed facility view with student rosters and capacity utilization (`/admin/branches/[id]`)
- **Course Management (`/admin/courses`)**: Syllabus management, creation modal, and 4-tier hierarchy viewer (`Course → Level → Module → Lesson`) (`/admin/courses/[id]`)
- **Batch Management (`/admin/batches`)**: Timetables, cohort scheduling, room assignment, instructor mapping, and batch roster (`/admin/batches/[id]`)
- **User Accounts (`/admin/users`)**: Staff account directory, role assignment, branch mapping, instant activation/deactivation, password resets
- **Roles & Permissions (`/admin/roles`)**: 8-role matrix view with granular permission checklists and Super Admin bypass
- **Reports (`/admin/reports`)**: Student retention, instructor ratios, batch occupancy, campus performance breakdown
- **Activity Logs (`/admin/activity-logs`)**: Filterable audit trail of administrative events
- **Settings (`/admin/settings`)**: General branding, appearance color palette, session security, password change tool
- **In-App Notifications**: Header drawer with unread count and mark-as-read functionality
- **Password Reset Architecture (`/forgot-password`, `/reset-password`)**: Token generation and password reset flow

---

## 🔄 Phase 2 Handoff & Extensibility

The codebase is prepared for Phase 2, 3, 4, and 5 expansion:
1. **Cloud File Storage**: `src/app/api/upload/route.ts` is configured with metadata abstraction ready for AWS S3 / Cloudflare R2 adapters.
2. **Payment Gateway**: `/api/students/[id]` and schema include payment entities ready for Stripe/Razorpay webhook listeners.
3. **Email & SMS Notifications**: `src/db/schema.ts` `notifications` table has in-app status and is ready for Twilio/SendGrid dispatcher services.
4. **Interactive Practice Engine**: Course Levels and Lessons are structured to attach gamified Soroban flash-card engines in future phases.

---

## 📚 PHASE 2 — Academic Management System

Phase 2 extends the Phase 1 foundation with a complete academic operations layer. All Phase 1 features, data, authentication, and UI conventions are fully preserved.

### New Database Entities (`src/db/schema.ts`)
- `studentParents`: Many-to-many linking of students to parent/guardian accounts
- `classSchedules`: Daily/weekly/monthly class sessions with conflict detection (teacher & room double-booking prevention)
- `questions`: Question Bank (MCQ, Multiple Choice, Written, Short Answer) with difficulty levels and course/level tagging
- `exams`: Draft → Published → Completed lifecycle exams scoped to a batch
- `examQuestions`: Exam-to-question bank mapping with ordering
- `examAttempts`: Architecture for future timed online exam-taking
- `results`: Auto-calculated percentage & letter grade, Draft/Published visibility gating
- `assignments` & `submissions`: Homework lifecycle (Pending → Submitted/Late → Reviewed) with feedback and marks
- `studyMaterials`: Course/Level/Module/Lesson/Batch scoped learning resources (PDF, Document, Image, Video, Other)

### New Permissions
`attendance.view`, `attendance.mark`, `schedule.view`, `schedule.manage`, `exams.view`, `exams.manage`, `questions.view`, `questions.manage`, `results.view`, `results.manage`, `assignments.view`, `assignments.manage`, `materials.view`, `materials.manage` — all wired into the existing granular RBAC engine with SUPER_ADMIN bypass.

### New Admin Modules (`/admin/...`)
- **Attendance** (`/admin/attendance`): Mark by batch/date, browse historical records, and view Student/Batch/Branch/Teacher attendance percentage reports
- **Class Schedule** (`/admin/schedule`): Daily/Weekly/Monthly views with automatic teacher & room conflict prevention
- **Exams** (`/admin/exams`, `/admin/exams/[id]`): Create drafts, assign questions from the bank, and publish to notify students
- **Question Bank** (`/admin/question-bank`): Searchable, filterable repository of MCQ/Written/Short-Answer questions with difficulty tagging
- **Results** (`/admin/results`): Enter marks per exam, auto-calculated percentage & grade, Draft/Publish workflow with student notifications
- **Assignments** (`/admin/assignments`, `/admin/assignments/[id]`): Post homework, track submission status, grade with feedback
- **Study Materials** (`/admin/materials`): Upload and categorize PDFs, documents, images, and videos scoped to courses/batches

### New Role-Based Portals
- **Student Portal** (`/student`): Overview, My Courses & Batch, Schedule, Attendance, Assignments (with submission upload), Exams, Results (published only), Study Materials, Documents, Payments-ready, Profile
- **Teacher Portal** (`/teacher`): Overview, My Classes & Batches, My Students, Attendance marking, Assignments, Exams & Question Bank shortcuts, Schedule, Profile — automatically scoped to the teacher's own batches only
- **Parent Portal** (`/parent`): Multi-child selector, Academic Overview, Attendance %, Assignments, Exams, Results, Schedule, Study Materials — strictly scoped to linked children via `studentParents`

### Security Enforcement (Phase 2)
- Students can only view their own attendance/exams/results/assignments — never edit results or grades
- Parents are read-only and strictly scoped to their linked children via the `studentParents` junction table
- Teachers can only mark attendance / manage assignments & exams for batches they are assigned to
- Branch Managers are scoped to their branch across all new academic modules
- Results remain invisible to students/parents until explicitly `PUBLISHED` by a teacher/admin

### Phase 2 Seed Data (`src/db/seed-phase2.ts`)
Run after the Phase 1 seed:
```bash
npx tsx src/db/run-seed-phase2.ts
```
This seeds: new permissions, student & parent portal login accounts (password: `AbacusUp@2026!`), 6 class sessions per batch, a 5-question bank, 2 sample exams (1 published with results, 1 draft), 2 assignments with mixed submission states, and 2 study materials.

**Quick Portal Test Logins** (all use password `AbacusUp@2026!`):
- Student: `liam.anderson.portal@abacusup.com`
- Teacher: `sarah.lin@abacusup.com`
- Parent: `robert.anderson@example.com`

### Phase 3 Readiness
Schema and UI are structured so Phase 3 (Finance, Payments, Invoices, Accounting, Admission, Enrollment) can build directly on top of `courses.fee`, the Payments-ready tabs already present in the Student Portal and Student Profile, and the `enrollments` table without any breaking changes.

---

## 💰 PHASE 3 — Admission + Finance + Payment + Accounting

Phase 3 adds the complete revenue and admissions layer while preserving every Phase 1 and Phase 2 feature.

### New Database Entities (`src/db/schema.ts`)
- `admissions`: Application workflow with codes, guardian details, branch/course/level/batch preferences, and status lifecycle (PENDING → APPROVED → ACTIVE, or REJECTED/CANCELLED)
- `enrollments` (extended): now tracks `levelId`, `branchId`, `startDate`, and `endDate` alongside existing student/course/batch links
- `feeStructures`: Templates for ADMISSION, COURSE, MONTHLY, EXAM, MATERIAL, and OTHER fees
- `invoices` & `invoiceItems`: Numbered professional invoices with subtotal/discount/total/paid/due tracking
- `payments`: Payment codes, methods (CASH, BANK, MOBILE_BANKING, ONLINE), references, receiver, and unique gateway transaction IDs (duplicate-safe)
- `expenses`: RENT, SALARY, UTILITIES, MATERIALS, MARKETING, TRANSPORT, OTHER categories with attachments
- `paymentGatewayConfigs`: Replaceable gateway registry (MANUAL, BKASH, NAGAD, SSLCOMMERZ, STRIPE) — secrets never stored here

### New Permissions
`admissions.view/create/edit`, `enrollments.view/create/edit`, `fees.view/manage`, `invoices.view/create/manage`, `payments.view/create`, `expenses.view/manage`, `finance.reports` — with ACCOUNTANT receiving a restricted finance-only subset (no admissions, no student/teacher management).

### New Admin Modules (`/admin/...`)
- **Admissions**: Submit applications (photo upload), search/filter by status, Approve → Activate workflow that auto-creates the linked student record and course/batch enrollment
- **Enrollments**: Enroll students into course/level/batch/branch with start/end dates and ACTIVE/COMPLETED/DROPPED status
- **Fees**: Fee structure CRUD with type/course templates
- **Invoices**: Generate professional multi-item invoices with fee templates, discounts/scholarships, due dates; detail page shows payment history
- **Payments**: Record cash/bank/mobile/online payments (transaction-safe, duplicate gateway IDs ignored); online payments route through the gateway abstraction
- **Due Management**: Due list and overdue list with branch filter, search, and CSV export
- **Expenses**: Full expense CRUD with category, branch, attachment upload
- **Accounting**: Collection/expense/due KPI dashboard with recent collections feed
- **Financial Reports**: Daily/monthly/yearly trends, branch revenue, method breakdown, due/overdue, expense categories, net revenue — with date/branch/method filters and CSV export
- **Receipts** (`/admin/receipts/[paymentId]`): Branded, printable payment receipts

### Payment Gateway Architecture (`src/lib/payments/gateway.ts`)
- Replaceable provider abstraction implementing `createPaymentIntent` + `verifyCallback` with HMAC signature verification when secrets are configured
- Providers: MANUAL (sandbox/offline), BKASH, NAGAD, SSLCOMMERZ, STRIPE
- Secrets are read exclusively from `process.env` (see `.env.example`); the DB stores only merchant metadata and sandbox flags
- Webhook endpoint `/api/payments/gateway/callback` is idempotent: identical `gatewayTransactionId` callbacks are safely ignored, and payment + invoice updates run inside a single DB transaction

### Accountant Role & Portal
- New demo user: `accountant@abacusup.com` (password `AbacusUp@2026!`) → lands on the restricted `/accountant` portal dashboard (today's/monthly/yearly collections, due, overdue, expenses) with links to finance tools
- API-level enforcement verified: accountant gets 403 on admissions/fee-management endpoints while retaining full finance operations

### Phase 3 Seed (`src/db/seed-phase3.ts`)
```bash
npx tsx src/db/run-seed-phase3.ts
```
Seeds finance permissions, 6 fee structures, 5 gateway configs, 6 invoices (PAID/DUE/OVERDUE mix with items), matching cash payments, and 6 branch expenses.

### Phase 4 Readiness
The public website, CMS, gallery, blog, events, branch-application, and communication modules planned for Phase 4 build on the untouched Phase 1 public site, the `documents` asset store, and the `branches` entity — no Phase 3 breaking changes.

---

## 🌐 PHASE 4 — Public Website + CMS + Media + Communication

Phase 4 delivers the complete public-facing website, a no-code CMS, media management, communication architecture, and SEO — with all Phase 1–3 features preserved.

### New Database Entities (`src/db/schema.ts`)
`cmsContents` (key/value JSON blocks), `banners`, `galleryItems`, `videos` (URL/YouTube/Vimeo now; `storageProvider` ready for S3/R2), `events`, `blogPosts` (slug, SEO title/description, Draft/Published), `faqs`, `testimonials` (Pending/Approved/Rejected), `contactMessages` (New/Read/Replied/Closed), `branchApplications` (Pending → Under Review → Contacted → Approved/Rejected; approved apps can create a branch).

### Public Website (`/`)
Home (Hero · Banners · Statistics · About · Why AbacusUp · Courses · Levels · Teacher carousel · Branches · Gallery · Events · Testimonials · FAQ · CTA · Footer), `/about`, `/courses`, `/teachers` + `/teachers/[id]`, `/branches` + `/branches/[id]` (courses, teachers, student count, batches, gallery, manager, contact), `/gallery` (lightbox, category filter, lazy loading, videos), `/events` + `/events/[slug]`, `/blog` + `/blog/[slug]`, `/faq` (accordion), `/contact`, `/admission` (online admission → PENDING application), `/apply-branch` (franchise application). Subtle scroll-reveal motion only.

### Admin CMS (`/admin/cms` + sidebar "Website & CMS")
CMS Overview (content-block editor for hero, about, why, stats, CTA, about page, contact info, footer, social links) · Banners · Gallery (publish/unpublish, sort) · Videos · Events · Blog · FAQ · Testimonials (approval) · Contact Messages (status workflow + notes) · Branch Applications (review, notes, approve → creates branch) · Notification Center (filter, mark read, mark all read).
Built on a config-driven `ResourceManager` component and a `createCrudHandlers` API factory (`src/lib/api/crud.ts`) — every resource gets list/create/update/delete with permission checks and audit logging.

### Communication Architecture
- **Notifications** (`src/lib/notifications/notify.ts`): `notifyUsers` / `notifyRoles` for ADMISSION, PAYMENT, DUE, ATTENDANCE, EXAM, RESULT, ASSIGNMENT, BRANCH_APPLICATION, CONTACT, SYSTEM. Header shows unread count with "Mark all read"; `/api/notifications/mark-all-read`.
- **Email** (`src/lib/email/service.ts`): swappable provider via `EMAIL_PROVIDER` (console | smtp | resend | sendgrid). Branded templates: WELCOME, PASSWORD_RESET, PAYMENT_RECEIPT, PAYMENT_DUE, ADMISSION, EXAM, RESULT, ASSIGNMENT, BRANCH_APPLICATION, CONTACT_RECEIVED.
- **SMS** (`src/lib/sms/service.ts`): swappable via `SMS_PROVIDER` (console | twilio | bulksmsbd | ssl_wireless | greenweb — Bangladesh providers prepared). All credentials from `.env`.

### Search
- Public: `/api/public/search` (courses, teachers, branches, blog, events) wired into the navbar.
- Admin: `/api/admin/search` (students, teachers, branches, invoices, payments, users — permission-scoped) wired into the admin header with a live dropdown.

### SEO & Performance
Dynamic titles/descriptions, canonical URLs, OpenGraph, `metadataBase`, `sitemap.xml` (static + blog/events/teachers/branches), `robots.txt` (portals & API disallowed), JSON-LD (EducationalOrganization, Person, Event, BlogPosting, FAQPage). Images use `loading="lazy"`; public rate-limit on the contact endpoint.

### Phase 4 Seed
```bash
npx tsx src/db/run-seed-phase4.ts
```
Seeds `cms.view`/`cms.manage` permissions (ADMIN, CONTENT_MANAGER; view for BRANCH_MANAGER), 9 CMS blocks, 2 banners, 6 gallery photos, 2 videos, 3 events, 3 blog posts, 6 FAQs, 4 testimonials.

### Phase 5 Readiness
Production hardening, security review, advanced analytics, audit export, backup, performance tuning, deployment, and final QA can proceed on top of the existing `activityLogs`, settings, and service abstractions without breaking changes.
