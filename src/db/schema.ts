import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  varchar,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";

// Roles & Permissions
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // e.g. SUPER_ADMIN, ADMIN, etc.
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // e.g. students.view, branches.edit
  module: varchar("module", { length: 50 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  permissionId: integer("permission_id")
    .references(() => permissions.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Branches
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  branchCode: varchar("branch_code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  logoUrl: text("logo_url"),
  managerId: integer("manager_id"), // User id of manager
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  openingDate: timestamp("opening_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, INACTIVE
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id")
    .references(() => roles.id)
    .notNull(),
  branchId: integer("branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),
  photoUrl: text("photo_url"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, INACTIVE, SUSPENDED
  customPermissions: jsonb("custom_permissions"), // override permissions array
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teachers
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  teacherIdCode: varchar("teacher_id_code", { length: 30 }).notNull().unique(), // e.g. TCH-2026-001
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address"),
  qualification: varchar("qualification", { length: 150 }),
  experience: varchar("experience", { length: 100 }), // e.g. "5 years"
  joiningDate: timestamp("joining_date").defaultNow().notNull(),
  branchId: integer("branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, ON_LEAVE, INACTIVE
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description").notNull(),
  duration: varchar("duration", { length: 50 }).notNull(), // e.g. "6 Months"
  fee: numeric("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  targetAge: varchar("target_age", { length: 50 }).default("5-14 years"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, DRAFT, ARCHIVED
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Levels (Course -> Level)
export const courseLevels = pgTable("course_levels", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  levelNumber: integer("level_number").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks").default(12).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Modules (Course Level -> Module)
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  levelId: integer("level_id")
    .references(() => courseLevels.id, { onDelete: "cascade" })
    .notNull(),
  moduleNumber: integer("module_number").notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lessons (Module -> Lesson)
export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id")
    .references(() => courseModules.id, { onDelete: "cascade" })
    .notNull(),
  lessonNumber: integer("lesson_number").notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  durationMinutes: integer("duration_minutes").default(45),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Batches
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchCode: varchar("batch_code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  branchId: integer("branch_id")
    .references(() => branches.id, { onDelete: "cascade" })
    .notNull(),
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  teacherId: integer("teacher_id").references(() => teachers.id, {
    onDelete: "set null",
  }),
  schedule: varchar("schedule", { length: 150 }).notNull(), // e.g. "Mon, Wed, Fri 4:00 PM - 5:30 PM"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  room: varchar("room", { length: 50 }).default("Room A1"),
  capacity: integer("capacity").default(15).notNull(),
  status: varchar("status", { length: 20 }).default("UPCOMING").notNull(), // UPCOMING, ONGOING, COMPLETED, CANCELLED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentIdCode: varchar("student_id_code", { length: 30 }).notNull().unique(), // e.g. STU-2026-001
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  photoUrl: text("photo_url"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 20 }), // Male, Female, Other
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  guardianName: varchar("guardian_name", { length: 150 }).notNull(),
  guardianPhone: varchar("guardian_phone", { length: 50 }).notNull(),
  guardianEmail: varchar("guardian_email", { length: 150 }),
  guardianRelation: varchar("guardian_relation", { length: 50 }).default("Parent"),
  emergencyContact: varchar("emergency_contact", { length: 50 }),
  branchId: integer("branch_id")
    .references(() => branches.id, { onDelete: "restrict" })
    .notNull(),
  courseId: integer("course_id").references(() => courses.id, {
    onDelete: "set null",
  }),
  batchId: integer("batch_id").references(() => batches.id, {
    onDelete: "set null",
  }),
  currentLevel: varchar("current_level", { length: 50 }).default("Foundation Level 1"),
  admissionDate: timestamp("admission_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, INACTIVE, SUSPENDED, GRADUATED
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parents
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address"),
  occupation: varchar("occupation", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  batchId: integer("batch_id")
    .references(() => batches.id, { onDelete: "cascade" })
    .notNull(),
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  levelId: integer("level_id").references(() => courseLevels.id, { onDelete: "set null" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, COMPLETED, DROPPED
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .references(() => batches.id, { onDelete: "cascade" })
    .notNull(),
  studentId: integer("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // PRESENT, ABSENT, LATE, EXCUSED
  remarks: text("remarks"),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(), // image/png, application/pdf, etc.
  fileSize: integer("file_size").notNull(), // bytes
  fileUrl: text("file_url").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // STUDENT, TEACHER, BRANCH, COURSE, GENERAL
  entityId: integer("entity_id"),
  category: varchar("category", { length: 50 }).default("GENERAL"), // ID_PROOF, CERTIFICATE, HOMEWORK, AVATAR, LOGO
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }), // null means broadcast
  title: varchar("title", { length: 150 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).default("INFO").notNull(), // INFO, SUCCESS, WARNING, ALERT
  link: varchar("link", { length: 255 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: varchar("user_name", { length: 150 }),
  action: varchar("action", { length: 50 }).notNull(), // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PASSWORD_CHANGE, ROLE_CHANGE
  entity: varchar("entity", { length: 50 }).notNull(), // USER, STUDENT, TEACHER, BRANCH, COURSE, BATCH, SETTINGS
  entityId: varchar("entity_id", { length: 50 }),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // GENERAL, APPEARANCE, SECURITY
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PHASE 2 — ACADEMIC MANAGEMENT SYSTEM
// ============================================================

// Student <-> Parent linking (many-to-many, supports multiple guardians/children)
export const studentParents = pgTable("student_parents", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  parentId: integer("parent_id")
    .references(() => parents.id, { onDelete: "cascade" })
    .notNull(),
  relation: varchar("relation", { length: 50 }).default("Parent"),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Class Schedule
export const classSchedules = pgTable("class_schedules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  batchId: integer("batch_id").references(() => batches.id, { onDelete: "cascade" }).notNull(),
  teacherId: integer("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "cascade" }).notNull(),
  room: varchar("room", { length: 50 }).default("Room A1"),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(), // "16:00"
  endTime: varchar("end_time", { length: 10 }).notNull(), // "17:30"
  status: varchar("status", { length: 20 }).default("SCHEDULED").notNull(), // SCHEDULED, ONGOING, COMPLETED, CANCELLED
  topic: varchar("topic", { length: 200 }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Question Bank
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  type: varchar("type", { length: 30 }).notNull(), // MCQ, MULTIPLE_CHOICE, WRITTEN, SHORT_ANSWER
  subject: varchar("subject", { length: 100 }).default("Mental Arithmetic"),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  levelId: integer("level_id").references(() => courseLevels.id, { onDelete: "set null" }),
  difficulty: varchar("difficulty", { length: 20 }).default("MEDIUM").notNull(), // EASY, MEDIUM, HARD
  marks: integer("marks").default(1).notNull(),
  options: jsonb("options"), // array of strings for MCQ/MULTIPLE_CHOICE
  correctAnswer: text("correct_answer"), // for MCQ/short answer
  explanation: text("explanation"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exams
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  batchId: integer("batch_id").references(() => batches.id, { onDelete: "cascade" }).notNull(),
  levelId: integer("level_id").references(() => courseLevels.id, { onDelete: "set null" }),
  examDate: timestamp("exam_date").notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  totalMarks: integer("total_marks").default(100).notNull(),
  passingMarks: integer("passing_marks").default(40).notNull(),
  status: varchar("status", { length: 20 }).default("DRAFT").notNull(), // DRAFT, PUBLISHED, COMPLETED, ARCHIVED
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exam <-> Question mapping
export const examQuestions = pgTable("exam_questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id, { onDelete: "cascade" }).notNull(),
  questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  orderIndex: integer("order_index").default(1).notNull(),
  marksOverride: integer("marks_override"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exam Attempts (student taking exam)
export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id, { onDelete: "cascade" }).notNull(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  answers: jsonb("answers"), // { questionId: answer }
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  autoScore: integer("auto_score"), // auto-graded portion (MCQ)
  status: varchar("status", { length: 20 }).default("IN_PROGRESS").notNull(), // IN_PROGRESS, SUBMITTED, GRADED
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Results
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id, { onDelete: "cascade" }).notNull(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  marksObtained: numeric("marks_obtained", { precision: 6, scale: 2 }).default("0").notNull(),
  totalMarks: numeric("total_marks", { precision: 6, scale: 2 }).default("100").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).default("0").notNull(),
  grade: varchar("grade", { length: 5 }).default("-"),
  remarks: text("remarks"),
  status: varchar("status", { length: 20 }).default("DRAFT").notNull(), // DRAFT, PUBLISHED
  gradedBy: integer("graded_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assignments
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  batchId: integer("batch_id").references(() => batches.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  teacherId: integer("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  deadline: timestamp("deadline").notNull(),
  attachmentUrl: text("attachment_url"),
  maxMarks: integer("max_marks").default(10).notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE, CLOSED, ARCHIVED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assignment Submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  fileUrl: text("file_url"),
  note: text("note"),
  submittedAt: timestamp("submitted_at"),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, SUBMITTED, LATE, REVIEWED
  marksObtained: integer("marks_obtained"),
  feedback: text("feedback"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Study Materials
export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  category: varchar("category", { length: 30 }).default("DOCUMENT").notNull(), // PDF, DOCUMENT, IMAGE, VIDEO, OTHER
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  levelId: integer("level_id").references(() => courseLevels.id, { onDelete: "set null" }),
  moduleId: integer("module_id").references(() => courseModules.id, { onDelete: "set null" }),
  lessonId: integer("lesson_id").references(() => courseLessons.id, { onDelete: "set null" }),
  batchId: integer("batch_id").references(() => batches.id, { onDelete: "set null" }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PHASE 3 — ADMISSION + FINANCE + PAYMENT + ACCOUNTING
// ============================================================

// Extend enrollments with level/branch/date tracking
// (columns added via migration; enrollments table already exists)

// Admission Applications
export const admissions = pgTable("admissions", {
  id: serial("id").primaryKey(),
  admissionCode: varchar("admission_code", { length: 30 }).notNull().unique(),
  studentName: varchar("student_name", { length: 150 }).notNull(),
  photoUrl: text("photo_url"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 150 }),
  address: text("address"),
  guardianName: varchar("guardian_name", { length: 150 }).notNull(),
  guardianPhone: varchar("guardian_phone", { length: 50 }).notNull(),
  guardianEmail: varchar("guardian_email", { length: 150 }),
  guardianRelation: varchar("guardian_relation", { length: 50 }).default("Parent"),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "restrict" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  levelId: integer("level_id").references(() => courseLevels.id, { onDelete: "set null" }),
  batchId: integer("batch_id").references(() => batches.id, { onDelete: "set null" }),
  admissionDate: timestamp("admission_date").defaultNow().notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, APPROVED, REJECTED, ACTIVE, CANCELLED
  decidedBy: integer("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at"),
  linkedStudentId: integer("linked_student_id").references(() => students.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fee Structures
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  feeType: varchar("fee_type", { length: 30 }).notNull(), // ADMISSION, COURSE, MONTHLY, EXAM, MATERIAL, OTHER
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "restrict" }).notNull(),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "restrict" }).notNull(),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).default("DUE").notNull(), // PAID, PARTIAL, DUE, OVERDUE, CANCELLED
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  feeType: varchar("fee_type", { length: 30 }).default("COURSE"),
  quantity: integer("quantity").default(1).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentCode: varchar("payment_code", { length: 30 }).notNull().unique(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "restrict" }).notNull(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "restrict" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  method: varchar("method", { length: 30 }).default("CASH").notNull(), // CASH, BANK, MOBILE_BANKING, ONLINE
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  receivedBy: integer("received_by").references(() => users.id),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 150 }).unique(),
  gatewayProvider: varchar("gateway_provider", { length: 30 }),
  status: varchar("status", { length: 20 }).default("SUCCESS").notNull(), // SUCCESS, PENDING, FAILED, REFUNDED
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseCode: varchar("expense_code", { length: 30 }).notNull().unique(),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "restrict" }).notNull(),
  category: varchar("category", { length: 30 }).notNull(), // RENT, SALARY, UTILITIES, MATERIALS, MARKETING, TRANSPORT, OTHER
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  date: timestamp("date").defaultNow().notNull(),
  description: text("description"),
  attachmentUrl: text("attachment_url"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment Gateway Configurations (secrets stay in .env; this stores non-secret merchant/sandbox flags)
export const paymentGatewayConfigs = pgTable("payment_gateway_configs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 30 }).notNull().unique(), // BKASH, NAGAD, SSLCOMMERZ, STRIPE, MANUAL
  displayName: varchar("display_name", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  isSandbox: boolean("is_sandbox").default(true).notNull(),
  config: jsonb("config"), // merchant ids, endpoints — NEVER api keys/secrets
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// PHASE 4 — PUBLIC WEBSITE + CMS + MEDIA + COMMUNICATION
// ============================================================

// CMS content blocks (key/value JSON per section: home_hero, about, footer, social, contact, why, cta ...)
export const cmsContents = pgTable("cms_contents", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  section: varchar("section", { length: 50 }).notNull(), // HOME, ABOUT, COURSES, TEACHERS, BRANCHES, CONTACT, FOOTER, SOCIAL
  title: varchar("title", { length: 150 }),
  content: jsonb("content").notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Hero banners
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  ctaText: varchar("cta_text", { length: 80 }),
  ctaLink: varchar("cta_link", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("PUBLISHED").notNull(), // PUBLISHED, DRAFT
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gallery
export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  category: varchar("category", { length: 30 }).default("ACTIVITIES").notNull(), // CLASSES, EVENTS, COMPETITIONS, BRANCHES, ACTIVITIES, TEACHERS, STUDENTS
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("PUBLISHED").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Videos (URL-based now; storageProvider prepared for cloud video)
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: varchar("category", { length: 30 }).default("CLASSES").notNull(),
  storageProvider: varchar("storage_provider", { length: 30 }).default("URL").notNull(), // URL, YOUTUBE, VIMEO, S3, R2
  sortOrder: integer("sort_order").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("PUBLISHED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time", { length: 50 }),
  location: varchar("location", { length: 200 }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).default("PUBLISHED").notNull(), // DRAFT, PUBLISHED, CANCELLED, COMPLETED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImageUrl: text("featured_image_url"),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  authorName: varchar("author_name", { length: 150 }),
  category: varchar("category", { length: 50 }).default("General"),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  status: varchar("status", { length: 20 }).default("DRAFT").notNull(), // DRAFT, PUBLISHED
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FAQ
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 300 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).default("General"),
  sortOrder: integer("sort_order").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("PUBLISHED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  photoUrl: text("photo_url"),
  role: varchar("role", { length: 100 }),
  message: text("message").notNull(),
  rating: integer("rating").default(5).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, APPROVED, REJECTED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("NEW").notNull(), // NEW, READ, REPLIED, CLOSED
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Branch (franchise) applications
export const branchApplications = pgTable("branch_applications", {
  id: serial("id").primaryKey(),
  applicationCode: varchar("application_code", { length: 30 }).notNull().unique(),
  applicantName: varchar("applicant_name", { length: 150 }).notNull(),
  organization: varchar("organization", { length: 150 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  experience: text("experience"),
  expectedCapacity: integer("expected_capacity"),
  message: text("message"),
  logoUrl: text("logo_url"),
  documentUrls: jsonb("document_urls"),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, UNDER_REVIEW, CONTACTED, APPROVED, REJECTED
  adminNotes: text("admin_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdBranchId: integer("created_branch_id").references(() => branches.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
