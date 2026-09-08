import { db } from "./index";
import {
  roles,
  permissions,
  rolePermissions,
  branches,
  users,
  teachers,
  courses,
  courseLevels,
  courseModules,
  courseLessons,
  batches,
  students,
  enrollments,
  attendance,
  notifications,
  activityLogs,
  settings,
} from "./schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Check if roles already exist
  const existingRoles = await db.select().from(roles);
  if (existingRoles.length > 0) {
    console.log("Database already seeded. Skipping full re-seed.");
    return;
  }

  // 1. Roles
  const roleList = [
    { name: "SUPER_ADMIN", displayName: "Super Administrator", description: "Unrestricted access to all resources and settings", isSystem: true },
    { name: "ADMIN", displayName: "Administrator", description: "Full operational management across branches", isSystem: true },
    { name: "BRANCH_MANAGER", displayName: "Branch Manager", description: "Manages assigned branch students, teachers, and batches", isSystem: true },
    { name: "TEACHER", displayName: "Instructor / Teacher", description: "Conducts batches, marks attendance, tracks student progress", isSystem: true },
    { name: "ACCOUNTANT", displayName: "Accountant / Finance", description: "Manages fee collections, invoices, and financial reports", isSystem: true },
    { name: "CONTENT_MANAGER", displayName: "Curriculum / Content Manager", description: "Oversees curriculum, levels, modules, and lessons", isSystem: true },
    { name: "STUDENT", displayName: "Student Learner", description: "Views assigned course modules, schedule, and progress", isSystem: true },
    { name: "PARENT", displayName: "Parent / Guardian", description: "Monitors child attendance, performance, and announcements", isSystem: true },
  ];

  const insertedRoles = await db.insert(roles).values(roleList).returning();
  const roleMap = new Map(insertedRoles.map((r) => [r.name, r.id]));

  // 2. Permissions
  const permissionList = [
    // Students
    { code: "students.view", module: "students", description: "View student profiles and lists" },
    { code: "students.create", module: "students", description: "Register new students" },
    { code: "students.edit", module: "students", description: "Update student information" },
    { code: "students.delete", module: "students", description: "Archive or delete students" },
    // Teachers
    { code: "teachers.view", module: "teachers", description: "View teacher profiles and records" },
    { code: "teachers.create", module: "teachers", description: "Onboard new teachers" },
    { code: "teachers.edit", module: "teachers", description: "Modify teacher profiles and assignments" },
    { code: "teachers.delete", module: "teachers", description: "Remove teacher accounts" },
    // Branches
    { code: "branches.view", module: "branches", description: "View branches and branch metrics" },
    { code: "branches.create", module: "branches", description: "Open new branch centers" },
    { code: "branches.edit", module: "branches", description: "Edit branch details and manager" },
    { code: "branches.delete", module: "branches", description: "Deactivate or close branches" },
    // Courses
    { code: "courses.view", module: "courses", description: "View courses, levels, and curriculum" },
    { code: "courses.create", module: "courses", description: "Author new courses and lessons" },
    { code: "courses.edit", module: "courses", description: "Update course details and pricing" },
    { code: "courses.delete", module: "courses", description: "Archive courses" },
    // Batches
    { code: "batches.view", module: "batches", description: "View batches and schedules" },
    { code: "batches.create", module: "batches", description: "Schedule new batches" },
    { code: "batches.edit", module: "batches", description: "Edit batch timings and instructors" },
    { code: "batches.delete", module: "batches", description: "Cancel or archive batches" },
    // Users & Roles
    { code: "users.view", module: "users", description: "View user directory" },
    { code: "users.create", module: "users", description: "Create staff and manager accounts" },
    { code: "users.edit", module: "users", description: "Edit staff roles and permissions" },
    { code: "users.delete", module: "users", description: "Deactivate staff users" },
    // Reports & Settings
    { code: "reports.view", module: "reports", description: "Access analytics and performance reports" },
    { code: "settings.manage", module: "settings", description: "Configure system and brand settings" },
  ];

  const insertedPermissions = await db.insert(permissions).values(permissionList).returning();

  // Role Permissions
  // Super Admin bypasses, but assign all to Admin
  const adminRoleId = roleMap.get("ADMIN");
  if (adminRoleId) {
    const adminPermRows = insertedPermissions.map((p) => ({
      roleId: adminRoleId,
      permissionId: p.id,
    }));
    await db.insert(rolePermissions).values(adminPermRows);
  }

  // Branch Manager permissions
  const bmRoleId = roleMap.get("BRANCH_MANAGER");
  if (bmRoleId) {
    const bmPermCodes = ["students.view", "students.create", "students.edit", "teachers.view", "branches.view", "courses.view", "batches.view", "batches.create", "batches.edit", "reports.view"];
    const bmPerms = insertedPermissions.filter((p) => bmPermCodes.includes(p.code));
    await db.insert(rolePermissions).values(
      bmPerms.map((p) => ({
        roleId: bmRoleId,
        permissionId: p.id,
      }))
    );
  }

  // Teacher permissions
  const teacherRoleId = roleMap.get("TEACHER");
  if (teacherRoleId) {
    const teacherPermCodes = ["students.view", "courses.view", "batches.view"];
    const tPerms = insertedPermissions.filter((p) => teacherPermCodes.includes(p.code));
    await db.insert(rolePermissions).values(
      tPerms.map((p) => ({
        roleId: teacherRoleId,
        permissionId: p.id,
      }))
    );
  }

  // 3. Branches
  const insertedBranches = await db.insert(branches).values([
    {
      branchCode: "BR-DWT-01",
      name: "Downtown Central Campus",
      phone: "+1 (555) 234-5678",
      email: "downtown@abacusup.com",
      address: "100 Innovation Way, Suite 400",
      city: "Metro City",
      status: "ACTIVE",
      description: "Flagship learning center equipped with interactive smart boards and digital soroban labs.",
    },
    {
      branchCode: "BR-NVL-02",
      name: "North Valley Learning Center",
      phone: "+1 (555) 345-6789",
      email: "northvalley@abacusup.com",
      address: "880 Oakridge Boulevard",
      city: "Valley Ridge",
      status: "ACTIVE",
      description: "Spacious suburban center catering to early mental math and accelerated Vedic arithmetic.",
    },
  ]).returning();

  const branch1 = insertedBranches[0];
  const branch2 = insertedBranches[1];

  // 4. Default Passwords (bcrypt hash)
  // Standard test password for sandbox seed: AbacusUp@2026!
  const passwordHash = await bcrypt.hash("AbacusUp@2026!", 10);

  // 5. Users
  const insertedUsers = await db.insert(users).values([
    {
      name: "Alexander Wright",
      email: "superadmin@abacusup.com",
      phone: "+1 (555) 000-0001",
      passwordHash,
      roleId: roleMap.get("SUPER_ADMIN")!,
      branchId: branch1.id,
      status: "ACTIVE",
    },
    {
      name: "Eleanor Vance",
      email: "admin@abacusup.com",
      phone: "+1 (555) 000-0002",
      passwordHash,
      roleId: roleMap.get("ADMIN")!,
      branchId: branch1.id,
      status: "ACTIVE",
    },
    {
      name: "Marcus Brody",
      email: "manager.downtown@abacusup.com",
      phone: "+1 (555) 000-0003",
      passwordHash,
      roleId: roleMap.get("BRANCH_MANAGER")!,
      branchId: branch1.id,
      status: "ACTIVE",
    },
    {
      name: "Sarah Lin",
      email: "sarah.lin@abacusup.com",
      phone: "+1 (555) 111-2201",
      passwordHash,
      roleId: roleMap.get("TEACHER")!,
      branchId: branch1.id,
      status: "ACTIVE",
    },
    {
      name: "David Kim",
      email: "david.kim@abacusup.com",
      phone: "+1 (555) 111-2202",
      passwordHash,
      roleId: roleMap.get("TEACHER")!,
      branchId: branch1.id,
      status: "ACTIVE",
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@abacusup.com",
      phone: "+1 (555) 111-2203",
      passwordHash,
      roleId: roleMap.get("TEACHER")!,
      branchId: branch2.id,
      status: "ACTIVE",
    },
    {
      name: "Michael Chen",
      email: "michael.chen@abacusup.com",
      phone: "+1 (555) 111-2204",
      passwordHash,
      roleId: roleMap.get("TEACHER")!,
      branchId: branch2.id,
      status: "ACTIVE",
    },
    {
      name: "Elena Rostova",
      email: "elena.rostova@abacusup.com",
      phone: "+1 (555) 111-2205",
      passwordHash,
      roleId: roleMap.get("TEACHER")!,
      branchId: branch2.id,
      status: "ACTIVE",
    },
  ]).returning();

  // 6. Teachers
  const teacherUsers = insertedUsers.slice(3, 8);
  const teacherRows = [
    {
      teacherIdCode: "TCH-2026-001",
      userId: teacherUsers[0].id,
      name: "Sarah Lin",
      email: teacherUsers[0].email,
      phone: "+1 (555) 111-2201",
      qualification: "M.Sc. Mathematics, Certified Soroban Master Trainer",
      experience: "8 years",
      branchId: branch1.id,
      bio: "National Mental Math Olympiad coach specializing in early childhood visualization and rapid calculation.",
      status: "ACTIVE",
    },
    {
      teacherIdCode: "TCH-2026-002",
      userId: teacherUsers[1].id,
      name: "David Kim",
      email: teacherUsers[1].email,
      phone: "+1 (555) 111-2202",
      qualification: "B.Ed. Elementary Education, Abacus Level 10 Certified",
      experience: "6 years",
      branchId: branch1.id,
      bio: "Passionate educator helping young minds build cognitive agility, focus, and photographic memory.",
      status: "ACTIVE",
    },
    {
      teacherIdCode: "TCH-2026-003",
      userId: teacherUsers[2].id,
      name: "Priya Sharma",
      email: teacherUsers[2].email,
      phone: "+1 (555) 111-2203",
      qualification: "M.Sc. Statistics, Vedic Mathematics Specialist",
      experience: "9 years",
      branchId: branch2.id,
      bio: "Expert in mental speed techniques, multi-digit mental multiplication, and international competition prep.",
      status: "ACTIVE",
    },
    {
      teacherIdCode: "TCH-2026-004",
      userId: teacherUsers[3].id,
      name: "Michael Chen",
      email: teacherUsers[3].email,
      phone: "+1 (555) 111-2204",
      qualification: "B.S. Cognitive Science, Certified Abacus Coach",
      experience: "5 years",
      branchId: branch2.id,
      bio: "Focuses on gamified learning methodologies to eliminate math anxiety in students aged 5 to 12.",
      status: "ACTIVE",
    },
    {
      teacherIdCode: "TCH-2026-005",
      userId: teacherUsers[4].id,
      name: "Elena Rostova",
      email: teacherUsers[4].email,
      phone: "+1 (555) 111-2205",
      qualification: "M.A. Educational Psychology, Senior Abacus Instructor",
      experience: "7 years",
      branchId: branch2.id,
      bio: "Devoted to sensory motor development and finger-soroban coordination for gifted youth.",
      status: "ACTIVE",
    },
  ];

  const insertedTeachers = await db.insert(teachers).values(teacherRows).returning();

  // 7. Courses
  const courseRows = [
    {
      code: "CRS-FND-101",
      name: "Foundation Soroban Abacus",
      description: "Master basic bead placement, physical soroban handling, 1-to-10 additions, and single-digit complementary math.",
      duration: "16 Weeks",
      fee: "480.00",
      targetAge: "5-8 years",
      status: "ACTIVE",
    },
    {
      code: "CRS-MTH-201",
      name: "Mental Arithmetic & Visualization",
      description: "Transition from physical abacus beads to mental imagination (Anzan). Rapid multi-digit sums and subtractions.",
      duration: "24 Weeks",
      fee: "620.00",
      targetAge: "7-12 years",
      status: "ACTIVE",
    },
    {
      code: "CRS-SPD-301",
      name: "Speed Calculation & Competition Prep",
      description: "High-speed competitive arithmetic, lightning-fast decimal additions, flash anzan, and national olympiad training.",
      duration: "20 Weeks",
      fee: "750.00",
      targetAge: "9-15 years",
      status: "ACTIVE",
    },
    {
      code: "CRS-VED-401",
      name: "Advanced Vedic Mathematics",
      description: "Ancient 16 sutras applied to algebraic squares, cubes, division shortcuts, and rapid mental root extractions.",
      duration: "12 Weeks",
      fee: "450.00",
      targetAge: "10-16 years",
      status: "ACTIVE",
    },
  ];

  const insertedCourses = await db.insert(courses).values(courseRows).returning();

  // Insert Course Levels, Modules & Lessons for Foundation Abacus
  const fndCourse = insertedCourses[0];
  const insertedLevels = await db.insert(courseLevels).values([
    {
      courseId: fndCourse.id,
      levelNumber: 1,
      name: "Level 1: Bead Basics & Lower Beads",
      description: "Introduction to Soroban frame, reckoning bar, unit dots, and direct addition (1-4).",
      durationWeeks: 4,
    },
    {
      courseId: fndCourse.id,
      levelNumber: 2,
      name: "Level 2: The Five-Bead (Upper Bead)",
      description: "Combining lower beads with upper bead 5, friends of 5 arithmetic rules.",
      durationWeeks: 6,
    },
    {
      courseId: fndCourse.id,
      levelNumber: 3,
      name: "Level 3: Friends of 10 & Two-Digit Addition",
      description: "Carry-over rules using friends of 10 and double-column visualization.",
      durationWeeks: 6,
    },
  ]).returning();

  // Modules for Level 1
  const insertedModules = await db.insert(courseModules).values([
    {
      levelId: insertedLevels[0].id,
      moduleNumber: 1,
      title: "Module 1: Anatomical Structure of Soroban",
      description: "Mastering the upper and lower decks, clearing bar, and unit markers.",
    },
    {
      levelId: insertedLevels[0].id,
      moduleNumber: 2,
      title: "Module 2: Direct Addition and Subtraction 1 to 4",
      description: "Using thumb for moving up lower beads and index finger for pulling down.",
    },
  ]).returning();

  // Lessons for Module 1
  await db.insert(courseLessons).values([
    {
      moduleId: insertedModules[0].id,
      lessonNumber: 1,
      title: "Introduction to Abacus History & Modern Soroban",
      durationMinutes: 45,
      content: "Learn how the Soroban evolved and why dual-hand finger movement stimulates both brain hemispheres.",
    },
    {
      moduleId: insertedModules[0].id,
      lessonNumber: 2,
      title: "Proper Posture, Pencil Grip and Finger Placement",
      durationMinutes: 45,
      content: "Practice holding the pencil in the writing hand while operating beads with thumb and index fingers.",
    },
  ]);

  // 8. Batches
  const batchRows = [
    {
      batchCode: "BTC-DWT-001",
      name: "Downtown Starters A1",
      branchId: branch1.id,
      courseId: insertedCourses[0].id,
      teacherId: insertedTeachers[0].id,
      schedule: "Mon & Wed • 4:00 PM - 5:30 PM",
      startDate: new Date("2026-02-01"),
      room: "Room Alpha 101",
      capacity: 15,
      status: "ONGOING",
    },
    {
      batchCode: "BTC-DWT-002",
      name: "Downtown Anzan Masters B1",
      branchId: branch1.id,
      courseId: insertedCourses[1].id,
      teacherId: insertedTeachers[1].id,
      schedule: "Tue & Thu • 4:30 PM - 6:00 PM",
      startDate: new Date("2026-02-15"),
      room: "Room Beta 102",
      capacity: 12,
      status: "ONGOING",
    },
    {
      batchCode: "BTC-NVL-001",
      name: "North Valley Junior Champs",
      branchId: branch2.id,
      courseId: insertedCourses[0].id,
      teacherId: insertedTeachers[2].id,
      schedule: "Sat • 9:30 AM - 12:30 PM",
      startDate: new Date("2026-03-01"),
      room: "Studio Green 201",
      capacity: 16,
      status: "ONGOING",
    },
    {
      batchCode: "BTC-NVL-002",
      name: "North Valley Vedic Prodigy",
      branchId: branch2.id,
      courseId: insertedCourses[3].id,
      teacherId: insertedTeachers[3].id,
      schedule: "Sun • 10:00 AM - 1:00 PM",
      startDate: new Date("2026-03-10"),
      room: "Studio Blue 202",
      capacity: 14,
      status: "UPCOMING",
    },
  ];

  const insertedBatches = await db.insert(batches).values(batchRows).returning();

  // 9. 20 Realistic Students
  const rawStudentData = [
    { name: "Liam Anderson", dob: "2018-05-14", gender: "Male", guardian: "Robert Anderson", phone: "+1 (555) 789-0101", email: "robert.anderson@example.com", branchId: branch1.id, courseId: insertedCourses[0].id, batchId: insertedBatches[0].id, level: "Foundation Level 1" },
    { name: "Sophia Martinez", dob: "2017-09-22", gender: "Female", guardian: "Carmen Martinez", phone: "+1 (555) 789-0102", email: "carmen.martinez@example.com", branchId: branch1.id, courseId: insertedCourses[0].id, batchId: insertedBatches[0].id, level: "Foundation Level 1" },
    { name: "Ethan Walker", dob: "2016-03-11", gender: "Male", guardian: "James Walker", phone: "+1 (555) 789-0103", email: "james.walker@example.com", branchId: branch1.id, courseId: insertedCourses[1].id, batchId: insertedBatches[1].id, level: "Mental Anzan Level 2" },
    { name: "Olivia Taylor", dob: "2017-12-05", gender: "Female", guardian: "Patricia Taylor", phone: "+1 (555) 789-0104", email: "patricia.taylor@example.com", branchId: branch1.id, courseId: insertedCourses[1].id, batchId: insertedBatches[1].id, level: "Mental Anzan Level 2" },
    { name: "Noah Patel", dob: "2018-07-19", gender: "Male", guardian: "Sanjay Patel", phone: "+1 (555) 789-0105", email: "sanjay.patel@example.com", branchId: branch1.id, courseId: insertedCourses[0].id, batchId: insertedBatches[0].id, level: "Foundation Level 1" },
    { name: "Ava Robinson", dob: "2016-11-28", gender: "Female", guardian: "Diane Robinson", phone: "+1 (555) 789-0106", email: "diane.robinson@example.com", branchId: branch1.id, courseId: insertedCourses[1].id, batchId: insertedBatches[1].id, level: "Mental Anzan Level 2" },
    { name: "Lucas Wright", dob: "2015-08-14", gender: "Male", guardian: "Thomas Wright", phone: "+1 (555) 789-0107", email: "thomas.wright@example.com", branchId: branch1.id, courseId: insertedCourses[2].id, batchId: insertedBatches[1].id, level: "Speed Calculation Pro" },
    { name: "Mia Gonzalez", dob: "2018-01-30", gender: "Female", guardian: "Laura Gonzalez", phone: "+1 (555) 789-0108", email: "laura.gonzalez@example.com", branchId: branch1.id, courseId: insertedCourses[0].id, batchId: insertedBatches[0].id, level: "Foundation Level 1" },
    { name: "Benjamin Harris", dob: "2017-06-18", gender: "Male", guardian: "Steven Harris", phone: "+1 (555) 789-0109", email: "steven.harris@example.com", branchId: branch1.id, courseId: insertedCourses[0].id, batchId: insertedBatches[0].id, level: "Foundation Level 1" },
    { name: "Charlotte Clark", dob: "2016-04-25", gender: "Female", guardian: "Rebecca Clark", phone: "+1 (555) 789-0110", email: "rebecca.clark@example.com", branchId: branch1.id, courseId: insertedCourses[1].id, batchId: insertedBatches[1].id, level: "Mental Anzan Level 2" },
    
    // North Valley Branch Students
    { name: "Aiden Scott", dob: "2018-02-14", gender: "Male", guardian: "Edward Scott", phone: "+1 (555) 789-0111", email: "edward.scott@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
    { name: "Harper Lee", dob: "2017-10-09", gender: "Female", guardian: "Grace Lee", phone: "+1 (555) 789-0112", email: "grace.lee@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
    { name: "Mason Young", dob: "2015-12-12", gender: "Male", guardian: "Daniel Young", phone: "+1 (555) 789-0113", email: "daniel.young@example.com", branchId: branch2.id, courseId: insertedCourses[3].id, batchId: insertedBatches[3].id, level: "Vedic Math Level 1" },
    { name: "Amelia King", dob: "2016-08-04", gender: "Female", guardian: "Jennifer King", phone: "+1 (555) 789-0114", email: "jennifer.king@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
    { name: "Elijah Hill", dob: "2015-05-27", gender: "Male", guardian: "Anthony Hill", phone: "+1 (555) 789-0115", email: "anthony.hill@example.com", branchId: branch2.id, courseId: insertedCourses[3].id, batchId: insertedBatches[3].id, level: "Vedic Math Level 1" },
    { name: "Evelyn Green", dob: "2017-03-15", gender: "Female", guardian: "Melissa Green", phone: "+1 (555) 789-0116", email: "melissa.green@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
    { name: "James Adams", dob: "2016-07-20", gender: "Male", guardian: "Paul Adams", phone: "+1 (555) 789-0117", email: "paul.adams@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
    { name: "Abigail Baker", dob: "2015-10-31", gender: "Female", guardian: "Sarah Baker", phone: "+1 (555) 789-0118", email: "sarah.baker@example.com", branchId: branch2.id, courseId: insertedCourses[3].id, batchId: insertedBatches[3].id, level: "Vedic Math Level 1" },
    { name: "Henry Rivera", dob: "2018-06-08", gender: "Male", guardian: "Carlos Rivera", phone: "+1 (555) 789-0119", email: "carlos.rivera@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
    { name: "Ella Campbell", dob: "2017-04-17", gender: "Female", guardian: "Rachel Campbell", phone: "+1 (555) 789-0120", email: "rachel.campbell@example.com", branchId: branch2.id, courseId: insertedCourses[0].id, batchId: insertedBatches[2].id, level: "Foundation Level 1" },
  ];

  const studentInserts = rawStudentData.map((s, index) => {
    const padded = String(index + 1).padStart(3, "0");
    return {
      studentIdCode: `STU-2026-${padded}`,
      name: s.name,
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      phone: s.phone,
      email: `${s.name.toLowerCase().replace(" ", ".")}@student.abacusup.com`,
      address: `12${index} Elm Street, Suite ${index + 1}`,
      guardianName: s.guardian,
      guardianPhone: s.phone,
      guardianEmail: s.email,
      emergencyContact: `${s.guardian} (${s.phone})`,
      branchId: s.branchId,
      courseId: s.courseId,
      batchId: s.batchId,
      currentLevel: s.level,
      status: "ACTIVE",
      notes: "Shows remarkable concentration and fast tactile bead recognition.",
    };
  });

  const insertedStudents = await db.insert(students).values(studentInserts).returning();

  // 10. Enrollments
  const enrollmentRows = insertedStudents.map((stu) => ({
    studentId: stu.id,
    batchId: stu.batchId!,
    courseId: stu.courseId!,
    enrollmentDate: new Date(),
    status: "ACTIVE",
  }));
  await db.insert(enrollments).values(enrollmentRows);

  // 11. Attendance Records (Sample for active batches)
  const sampleAttendance = insertedStudents.slice(0, 10).map((stu) => ({
    batchId: stu.batchId!,
    studentId: stu.id,
    date: new Date(),
    status: "PRESENT",
    remarks: "Completed flash cards drills with 95% accuracy",
    recordedBy: insertedUsers[0].id,
  }));
  await db.insert(attendance).values(sampleAttendance);

  // 12. In-App Notifications
  await db.insert(notifications).values([
    {
      userId: insertedUsers[0].id,
      title: "Welcome to AbacusUp Foundation",
      message: "Phase 1 Core Education Management System initialized successfully.",
      type: "SUCCESS",
      link: "/admin",
      isRead: false,
    },
    {
      userId: insertedUsers[0].id,
      title: "New Batch Ready",
      message: "Batch Downtown Starters A1 has 5 enrolled students scheduled this week.",
      type: "INFO",
      link: "/admin/batches",
      isRead: false,
    },
    {
      userId: insertedUsers[0].id,
      title: "Curriculum Sync",
      message: "Foundation Soroban Abacus modules and lesson guides updated.",
      type: "INFO",
      link: "/admin/courses",
      isRead: true,
    },
  ]);

  // 13. Activity Logs
  await db.insert(activityLogs).values([
    {
      userId: insertedUsers[0].id,
      userName: "Alexander Wright",
      action: "CREATE",
      entity: "SYSTEM",
      entityId: "1",
      details: "Initial system configuration and branch network established",
    },
    {
      userId: insertedUsers[0].id,
      userName: "Alexander Wright",
      action: "LOGIN",
      entity: "USER",
      entityId: insertedUsers[0].id.toString(),
      details: "Super Admin authenticated successfully",
    },
  ]);

  // 14. Settings
  await db.insert(settings).values([
    // General
    { key: "site_name", value: "AbacusUp Education Platform", category: "GENERAL", description: "Platform Brand Title" },
    { key: "support_email", value: "support@abacusup.com", category: "GENERAL", description: "Official support email address" },
    { key: "support_phone", value: "+1 (800) 555-ABACUS", category: "GENERAL", description: "Official support contact line" },
    { key: "headquarters_address", value: "100 Innovation Way, Suite 400, Metro City", category: "GENERAL", description: "Corporate headquarters" },
    // Appearance
    { key: "brand_primary_color", value: "#2563EB", category: "APPEARANCE", description: "Primary brand hex code" },
    { key: "brand_accent_color", value: "#0D9488", category: "APPEARANCE", description: "Secondary brand accent" },
    { key: "theme_mode", value: "light", category: "APPEARANCE", description: "Default interface theme mode" },
    // Security
    { key: "session_timeout_minutes", value: "120", category: "SECURITY", description: "Session inactivity timeout in minutes" },
    { key: "max_login_attempts", value: "5", category: "SECURITY", description: "Account lockout threshold" },
    { key: "require_strong_passwords", value: "true", category: "SECURITY", description: "Enforce uppercase, number, and special character" },
  ]);

  console.log("Database seeded successfully with roles, branches, teachers, students, courses, batches, and settings.");
}
