import { db } from "./index";
import {
  roles,
  permissions,
  rolePermissions,
  users,
  students,
  teachers,
  branches,
  batches,
  courses,
  courseLevels,
  parents,
  studentParents,
  classSchedules,
  questions,
  exams,
  examQuestions,
  results,
  assignments,
  submissions,
  studyMaterials,
  notifications,
  activityLogs,
} from "./schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedPhase2() {
  console.log("Seeding Phase 2 — Academic Management System...");

  // Guard: check if phase2 permission already exists
  const existingPerm = await db.select().from(permissions).where(eq(permissions.code, "attendance.view"));
  if (existingPerm.length > 0) {
    console.log("Phase 2 already seeded. Skipping.");
    return;
  }

  const allRoles = await db.select().from(roles);
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));

  // 1. New Permissions
  const newPermissionList = [
    { code: "attendance.view", module: "attendance", description: "View attendance records" },
    { code: "attendance.mark", module: "attendance", description: "Mark and edit attendance" },
    { code: "schedule.view", module: "schedule", description: "View class schedules" },
    { code: "schedule.manage", module: "schedule", description: "Create and edit class schedules" },
    { code: "exams.view", module: "exams", description: "View exams" },
    { code: "exams.manage", module: "exams", description: "Create, edit, publish exams" },
    { code: "questions.view", module: "questions", description: "View question bank" },
    { code: "questions.manage", module: "questions", description: "Create and edit questions" },
    { code: "results.view", module: "results", description: "View exam results" },
    { code: "results.manage", module: "results", description: "Enter grades and publish results" },
    { code: "assignments.view", module: "assignments", description: "View assignments" },
    { code: "assignments.manage", module: "assignments", description: "Create and grade assignments" },
    { code: "materials.view", module: "materials", description: "View study materials" },
    { code: "materials.manage", module: "materials", description: "Upload and manage study materials" },
  ];

  const insertedPerms = await db.insert(permissions).values(newPermissionList).returning();
  const permByCode = new Map(insertedPerms.map((p) => [p.code, p.id]));

  // Assign to ADMIN (all)
  const adminRoleId = roleMap.get("ADMIN");
  if (adminRoleId) {
    await db.insert(rolePermissions).values(
      insertedPerms.map((p) => ({ roleId: adminRoleId, permissionId: p.id }))
    );
  }

  // Assign to BRANCH_MANAGER (view + manage schedule/attendance, view exams/results/assignments/materials)
  const bmRoleId = roleMap.get("BRANCH_MANAGER");
  if (bmRoleId) {
    const bmCodes = [
      "attendance.view", "attendance.mark", "schedule.view", "schedule.manage",
      "exams.view", "questions.view", "results.view", "assignments.view",
      "materials.view", "materials.manage",
    ];
    await db.insert(rolePermissions).values(
      bmCodes.map((c) => ({ roleId: bmRoleId, permissionId: permByCode.get(c)! }))
    );
  }

  // Assign to TEACHER (full academic operational access on own batches)
  const teacherRoleId = roleMap.get("TEACHER");
  if (teacherRoleId) {
    const tCodes = [
      "attendance.view", "attendance.mark", "schedule.view", "schedule.manage",
      "exams.view", "exams.manage", "questions.view", "questions.manage",
      "results.view", "results.manage", "assignments.view", "assignments.manage",
      "materials.view", "materials.manage",
    ];
    await db.insert(rolePermissions).values(
      tCodes.map((c) => ({ roleId: teacherRoleId, permissionId: permByCode.get(c)! }))
    );
  }

  // Assign to STUDENT (view only, own data enforced at API level)
  const studentRoleId = roleMap.get("STUDENT");
  if (studentRoleId) {
    const sCodes = ["attendance.view", "schedule.view", "exams.view", "results.view", "assignments.view", "materials.view"];
    await db.insert(rolePermissions).values(
      sCodes.map((c) => ({ roleId: studentRoleId, permissionId: permByCode.get(c)! }))
    );
  }

  // Assign to PARENT (view only)
  const parentRoleId = roleMap.get("PARENT");
  if (parentRoleId) {
    const pCodes = ["attendance.view", "schedule.view", "exams.view", "results.view", "assignments.view", "materials.view"];
    await db.insert(rolePermissions).values(
      pCodes.map((c) => ({ roleId: parentRoleId, permissionId: permByCode.get(c)! }))
    );
  }

  console.log("Phase 2 permissions seeded.");

  // 2. Create Student Portal Login Accounts (linked to existing students)
  const allStudents = await db.select().from(students).orderBy(students.id);
  const passwordHash = await bcrypt.hash("AbacusUp@2026!", 10);
  const studentUserIds: Record<number, number> = {};

  for (const stu of allStudents.slice(0, 8)) {
    if (stu.userId) continue;
    const emailSlug = stu.name.toLowerCase().replace(/[^a-z]+/g, ".");
    const loginEmail = `${emailSlug}.portal@abacusup.com`;

    const existing = await db.select().from(users).where(eq(users.email, loginEmail));
    let userId: number;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          name: stu.name,
          email: loginEmail,
          phone: stu.phone || stu.guardianPhone,
          passwordHash,
          roleId: studentRoleId!,
          branchId: stu.branchId,
          status: "ACTIVE",
        })
        .returning();
      userId = newUser.id;
    }
    studentUserIds[stu.id] = userId;
    await db.update(students).set({ userId }).where(eq(students.id, stu.id));
  }

  // 3. Create Parent Portal Accounts linked to those students
  for (const stu of allStudents.slice(0, 8)) {
    const parentEmail = stu.guardianEmail || `${stu.guardianName.toLowerCase().replace(/[^a-z]+/g, ".")}@parent.abacusup.com`;

    let parentUserId: number;
    const existingUser = await db.select().from(users).where(eq(users.email, parentEmail));
    if (existingUser.length > 0) {
      parentUserId = existingUser[0].id;
    } else {
      const [newParentUser] = await db
        .insert(users)
        .values({
          name: stu.guardianName,
          email: parentEmail,
          phone: stu.guardianPhone,
          passwordHash,
          roleId: parentRoleId!,
          branchId: stu.branchId,
          status: "ACTIVE",
        })
        .returning();
      parentUserId = newParentUser.id;
    }

    const existingParentRecord = await db.select().from(parents).where(eq(parents.userId, parentUserId));
    let parentRecordId: number;
    if (existingParentRecord.length > 0) {
      parentRecordId = existingParentRecord[0].id;
    } else {
      const [newParentRecord] = await db
        .insert(parents)
        .values({
          userId: parentUserId,
          name: stu.guardianName,
          email: parentEmail,
          phone: stu.guardianPhone,
        })
        .returning();
      parentRecordId = newParentRecord.id;
    }

    const existingLink = await db
      .select()
      .from(studentParents)
      .where(eq(studentParents.studentId, stu.id));
    if (existingLink.length === 0) {
      await db.insert(studentParents).values({
        studentId: stu.id,
        parentId: parentRecordId,
        relation: stu.guardianRelation || "Parent",
        isPrimary: true,
      });
    }
  }

  console.log("Student & Parent portal accounts linked.");

  // 4. Class Schedules for existing batches (next 14 days)
  const allBatches = await db.select().from(batches);
  const scheduleRows = [];
  const today = new Date();

  for (const batch of allBatches) {
    for (let i = 0; i < 6; i++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(today.getDate() + i * 2);
      scheduleRows.push({
        courseId: batch.courseId,
        batchId: batch.id,
        teacherId: batch.teacherId,
        branchId: batch.branchId,
        room: batch.room || "Room A1",
        date: scheduleDate,
        startTime: "16:00",
        endTime: "17:30",
        status: i < 2 ? "COMPLETED" : "SCHEDULED",
        topic: `Session ${i + 1}: Bead Complement Drills & Speed Practice`,
      });
    }
  }
  if (scheduleRows.length > 0) {
    await db.insert(classSchedules).values(scheduleRows as any);
  }

  console.log("Class schedules generated.");

  // 5. Question Bank
  const allCourses = await db.select().from(courses);
  const allLevels = await db.select().from(courseLevels);
  const foundationCourse = allCourses[0];
  const foundationLevel = allLevels.find((l) => l.courseId === foundationCourse?.id);

  const questionRows = [
    {
      questionText: "What is 24 + 38 using the friends-of-10 technique?",
      type: "MCQ",
      subject: "Mental Arithmetic",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      difficulty: "EASY",
      marks: 2,
      options: ["52", "62", "58", "60"],
      correctAnswer: "62",
      explanation: "24 + 38 = 62. Use the friends-of-10 rule: add 40 then subtract 2.",
    },
    {
      questionText: "Which bead represents the value 5 on a Soroban?",
      type: "MCQ",
      subject: "Soroban Basics",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      difficulty: "EASY",
      marks: 1,
      options: ["Upper bead", "Lower bead", "Reckoning bar", "Frame"],
      correctAnswer: "Upper bead",
      explanation: "The upper bead (heaven bead) above the reckoning bar represents 5.",
    },
    {
      questionText: "Calculate mentally: 147 - 68 = ?",
      type: "SHORT_ANSWER",
      subject: "Mental Arithmetic",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      difficulty: "MEDIUM",
      marks: 3,
      options: null,
      correctAnswer: "79",
      explanation: "147 - 68 = 79 using complement subtraction technique.",
    },
    {
      questionText: "Explain the finger technique used for direct addition (1-4) on the Soroban.",
      type: "WRITTEN",
      subject: "Soroban Basics",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      difficulty: "MEDIUM",
      marks: 5,
      options: null,
      correctAnswer: null,
      explanation: "Students should describe using the thumb to move beads up and index finger to move beads down.",
    },
    {
      questionText: "What is 999 + 1 using complement of 1000?",
      type: "MCQ",
      subject: "Mental Arithmetic",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      difficulty: "HARD",
      marks: 4,
      options: ["1000", "998", "1010", "990"],
      correctAnswer: "1000",
      explanation: "999 + 1 = 1000, demonstrating complement-of-10 chains across multiple columns.",
    },
  ];

  const insertedQuestions = await db.insert(questions).values(questionRows as any).returning();
  console.log("Question bank seeded.");

  // 6. Sample Exams (one published, one draft) per first batch
  const firstBatch = allBatches[0];
  const secondBatch = allBatches[1];

  const examRows = [
    {
      title: "Foundation Level 1 — Monthly Assessment",
      description: "Comprehensive test covering bead placement, direct addition, and friends-of-5 techniques.",
      courseId: firstBatch?.courseId,
      batchId: firstBatch?.id,
      levelId: foundationLevel?.id,
      examDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      totalMarks: 15,
      passingMarks: 8,
      status: "PUBLISHED",
    },
    {
      title: "Mental Anzan Speed Challenge",
      description: "Timed rapid mental calculation examination for advanced visualization students.",
      courseId: secondBatch?.courseId || firstBatch?.courseId,
      batchId: secondBatch?.id || firstBatch?.id,
      levelId: foundationLevel?.id,
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      durationMinutes: 30,
      totalMarks: 15,
      passingMarks: 8,
      status: "DRAFT",
    },
  ];

  const insertedExams = await db.insert(exams).values(examRows as any).returning();

  // Link questions to first exam
  if (insertedExams[0]) {
    await db.insert(examQuestions).values(
      insertedQuestions.map((q, idx) => ({
        examId: insertedExams[0].id,
        questionId: q.id,
        orderIndex: idx + 1,
      }))
    );
  }

  console.log("Sample exams created.");

  // 7. Results for published exam (for students in that batch)
  const batchStudents = allStudents.filter((s) => s.batchId === firstBatch?.id).slice(0, 6);
  const grades = ["A+", "A", "B+", "B", "A", "A+"];

  if (insertedExams[0]) {
    const resultRows = batchStudents.map((stu, idx) => {
      const marks = 10 + (idx % 5);
      return {
        examId: insertedExams[0].id,
        studentId: stu.id,
        marksObtained: marks.toString(),
        totalMarks: "15",
        percentage: ((marks / 15) * 100).toFixed(2),
        grade: grades[idx % grades.length],
        remarks: "Excellent grasp of complement techniques. Keep practicing speed drills.",
        status: "PUBLISHED",
        publishedAt: new Date(),
      };
    });
    if (resultRows.length > 0) {
      await db.insert(results).values(resultRows as any);
    }
  }

  console.log("Results seeded.");

  // 8. Assignments + Submissions
  const assignmentRows = [
    {
      title: "Complement of 10 Worksheet — Set A",
      description: "Complete 30 addition problems using friends-of-10 technique. Show your working steps.",
      batchId: firstBatch?.id,
      courseId: firstBatch?.courseId,
      teacherId: firstBatch?.teacherId,
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      maxMarks: 20,
      status: "ACTIVE",
    },
    {
      title: "Home Practice: 100 Rapid Additions",
      description: "Daily practice sheet to build fluency in single-digit addition speed drills.",
      batchId: firstBatch?.id,
      courseId: firstBatch?.courseId,
      teacherId: firstBatch?.teacherId,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      maxMarks: 10,
      status: "ACTIVE",
    },
  ];

  const insertedAssignments = await db.insert(assignments).values(assignmentRows as any).returning();

  if (insertedAssignments.length > 0) {
    const submissionRows = batchStudents.map((stu, idx) => ({
      assignmentId: insertedAssignments[1].id, // past deadline assignment
      studentId: stu.id,
      note: "Completed all practice problems with instructor guidance.",
      submittedAt: idx % 3 === 0 ? null : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: idx % 3 === 0 ? "PENDING" : idx % 2 === 0 ? "REVIEWED" : "SUBMITTED",
      marksObtained: idx % 2 === 0 ? 8 : null,
      feedback: idx % 2 === 0 ? "Great accuracy! Work on speed next." : null,
    }));
    if (submissionRows.length > 0) {
      await db.insert(submissions).values(submissionRows as any);
    }
  }

  console.log("Assignments & submissions seeded.");

  // 9. Study Materials
  const materialRows = [
    {
      title: "Soroban Bead Chart (Printable PDF)",
      description: "Visual reference chart of upper and lower bead values for home practice.",
      fileUrl: "/uploads/sample-soroban-chart.pdf",
      fileType: "application/pdf",
      category: "PDF",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      batchId: firstBatch?.id,
    },
    {
      title: "Friends of 5 & 10 Reference Guide",
      description: "Complementary number pairs cheat sheet for direct and indirect addition rules.",
      fileUrl: "/uploads/sample-friends-guide.pdf",
      fileType: "application/pdf",
      category: "DOCUMENT",
      courseId: foundationCourse?.id,
      levelId: foundationLevel?.id,
      batchId: firstBatch?.id,
    },
  ];

  await db.insert(studyMaterials).values(materialRows as any);
  console.log("Study materials seeded.");

  // 10. Notifications for new academic events
  const notifRows: any[] = [];
  for (const stu of batchStudents) {
    if (stu.userId) {
      notifRows.push({
        userId: stu.userId,
        title: "New Result Published",
        message: `Your result for "Foundation Level 1 — Monthly Assessment" has been published.`,
        type: "SUCCESS",
        link: "/student/results",
        isRead: false,
      });
    }
  }
  if (notifRows.length > 0) {
    await db.insert(notifications).values(notifRows);
  }

  await db.insert(activityLogs).values({
    userName: "System",
    action: "CREATE",
    entity: "SYSTEM",
    entityId: "phase2",
    details: "Phase 2 Academic Management System initialized: schedules, exams, question bank, results, assignments, and study materials.",
  });

  console.log("Phase 2 seed completed successfully.");
}
