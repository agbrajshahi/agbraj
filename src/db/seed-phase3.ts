import { db } from "./index";
import {
  roles,
  permissions,
  rolePermissions,
  branches,
  students,
  feeStructures,
  invoices,
  invoiceItems,
  payments,
  expenses,
  paymentGatewayConfigs,
} from "./schema";
import { eq } from "drizzle-orm";

export async function seedPhase3() {
  console.log("Seeding Phase 3 — Admission + Finance + Payment + Accounting...");

  const existing = await db.select().from(permissions).where(eq(permissions.code, "invoices.view"));
  if (existing.length > 0) {
    console.log("Phase 3 already seeded. Skipping.");
    return;
  }

  const allRoles = await db.select().from(roles);
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));

  // 1. Permissions
  const permList = [
    { code: "admissions.view", module: "admissions", description: "View admission applications" },
    { code: "admissions.create", module: "admissions", description: "Submit admission applications" },
    { code: "admissions.edit", module: "admissions", description: "Approve, reject, activate, or cancel admissions" },
    { code: "enrollments.view", module: "enrollments", description: "View student enrollments" },
    { code: "enrollments.create", module: "enrollments", description: "Enroll students into courses and batches" },
    { code: "enrollments.edit", module: "enrollments", description: "Update enrollment status and dates" },
    { code: "fees.view", module: "fees", description: "View fee structures" },
    { code: "fees.manage", module: "fees", description: "Create and edit fee structures" },
    { code: "invoices.view", module: "invoices", description: "View invoices and receipts" },
    { code: "invoices.create", module: "invoices", description: "Generate invoices" },
    { code: "invoices.manage", module: "invoices", description: "Cancel invoices and manage billing" },
    { code: "payments.view", module: "payments", description: "View payment records" },
    { code: "payments.create", module: "payments", description: "Record and process payments" },
    { code: "expenses.view", module: "expenses", description: "View expenses" },
    { code: "expenses.manage", module: "expenses", description: "Record and manage expenses" },
    { code: "finance.reports", module: "reports", description: "Access financial reports and accounting analytics" },
  ];
  const insertedPerms = await db.insert(permissions).values(permList).returning();
  const permByCode = new Map(insertedPerms.map((p) => [p.code, p.id]));

  const adminRoleId = roleMap.get("ADMIN");
  if (adminRoleId) {
    await db.insert(rolePermissions).values(insertedPerms.map((p) => ({ roleId: adminRoleId, permissionId: p.id })));
  }

  const bmRoleId = roleMap.get("BRANCH_MANAGER");
  if (bmRoleId) {
    const bmCodes = ["admissions.view", "enrollments.view", "fees.view", "invoices.view", "payments.view", "expenses.view", "finance.reports"];
    await db.insert(rolePermissions).values(bmCodes.map((c) => ({ roleId: bmRoleId, permissionId: permByCode.get(c)! })));
  }

  const accountantRoleId = roleMap.get("ACCOUNTANT");
  if (accountantRoleId) {
    const accCodes = [
      "fees.view", "invoices.view", "invoices.create", "invoices.manage",
      "payments.view", "payments.create", "expenses.view", "expenses.manage",
      "finance.reports",
    ];
    // reports.view already exists from Phase 1; grant it explicitly
    const reportsView = await db.select().from(permissions).where(eq(permissions.code, "reports.view")).limit(1);
    await db.insert(rolePermissions).values([
      ...accCodes.map((c) => ({ roleId: accountantRoleId, permissionId: permByCode.get(c)! })),
      ...(reportsView.length ? [{ roleId: accountantRoleId, permissionId: reportsView[0].id }] : []),
    ]);
  }

  console.log("Phase 3 permissions seeded.");

  // 2. Fee Structures
  const allCourses = await db.select().from((await import("./schema")).courses);
  const fnd = allCourses[0];
  const mental = allCourses[1];

  await db.insert(feeStructures).values([
    { name: "New Admission Fee", feeType: "ADMISSION", amount: "50.00", description: "One-time registration and kit onboarding fee" },
    { name: "Foundation Soroban Course Fee", feeType: "COURSE", courseId: fnd?.id, amount: "480.00", description: "Full 16-week Foundation Soroban program tuition" },
    { name: "Mental Arithmetic Course Fee", feeType: "COURSE", courseId: mental?.id, amount: "620.00", description: "Full 24-week Mental Arithmetic & Visualization program" },
    { name: "Monthly Practice Fee", feeType: "MONTHLY", amount: "40.00", description: "Monthly ongoing practice session fee" },
    { name: "Term Exam Fee", feeType: "EXAM", amount: "15.00", description: "Graded term assessment fee" },
    { name: "Practice Material Kit", feeType: "MATERIAL", amount: "25.00", description: "Practice worksheets and flash card kit" },
  ]);

  console.log("Fee structures seeded.");

  // 3. Payment Gateway Configs (secrets only in .env)
  await db.insert(paymentGatewayConfigs).values([
    { provider: "MANUAL", displayName: "Manual / Cash Desk", isEnabled: true, isSandbox: true, config: { note: "Offline manual collection" } },
    { provider: "BKASH", displayName: "bKash (Bangladesh)", isEnabled: false, isSandbox: true, config: { merchantNumber: "017XXXXXXX0" } },
    { provider: "NAGAD", displayName: "Nagad (Bangladesh)", isEnabled: false, isSandbox: true, config: { merchantNumber: "019XXXXXXX0" } },
    { provider: "SSLCOMMERZ", displayName: "SSLCommerz (BD Gateway)", isEnabled: false, isSandbox: true, config: { storeName: "abacusup" } },
    { provider: "STRIPE", displayName: "Stripe (International)", isEnabled: false, isSandbox: true, config: { mode: "test" } },
  ]);

  console.log("Payment gateway configs seeded.");

  // 4. Sample financial data
  const allBranches = await db.select().from(branches);
  const allStudents = await db.select().from(students);
  const branch1 = allBranches[0];
  const branch2 = allBranches[1];

  const sampleStudents = allStudents.slice(0, 8);

  // Invoices for the first 6 students
  const today = new Date();
  const invoiceRows = sampleStudents.slice(0, 6).map((stu, idx) => {
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + (idx % 2 === 0 ? -10 : 15)); // some overdue, some future
    return {
      invoiceNumber: `INV-2026-${String(1001 + idx).padStart(4, "0")}`,
      studentId: stu.id,
      branchId: stu.branchId,
      invoiceDate: today,
      dueDate,
      subtotal: "530.00",
      discount: idx === 3 ? "50.00" : "0.00",
      total: idx === 3 ? "480.00" : "530.00",
      paidAmount: idx % 2 === 0 ? "530.00" : "0.00",
      status: idx % 2 === 0 ? "PAID" : idx % 4 === 1 ? "OVERDUE" : "DUE",
      notes: idx === 3 ? "50% scholarship applied" : null,
    };
  });

  const insertedInvoices = await db.insert(invoices).values(invoiceRows as any).returning();

  for (const inv of insertedInvoices) {
    await db.insert(invoiceItems).values([
      { invoiceId: inv.id, description: "Admission Fee", feeType: "ADMISSION", amount: "50.00" },
      { invoiceId: inv.id, description: "Foundation Soroban Course Fee", feeType: "COURSE", amount: "480.00" },
    ]);
  }

  // Payments for PAID invoices
  const paidInvoices = insertedInvoices.filter((i) => i.status === "PAID");
  for (const inv of paidInvoices) {
    await db.insert(payments).values({
      paymentCode: `PAY-2026-${String(2001 + inv.id).padStart(4, "0")}`,
      invoiceId: inv.id,
      studentId: inv.studentId,
      amount: inv.total,
      method: "CASH",
      paymentDate: today,
      reference: `Cash receipt for ${inv.invoiceNumber}`,
      receivedBy: 2,
      status: "SUCCESS",
    });
  }

  console.log("Sample invoices & payments seeded.");

  // 5. Expenses
  const expenseRows = [
    { expenseCode: "EXP-2026-001", branchId: branch1?.id, category: "RENT", amount: "2000.00", date: today, description: "Monthly rent — Downtown Central Campus" },
    { expenseCode: "EXP-2026-002", branchId: branch1?.id, category: "UTILITIES", amount: "240.00", date: today, description: "Electricity and internet" },
    { expenseCode: "EXP-2026-003", branchId: branch1?.id, category: "MATERIALS", amount: "180.00", date: today, description: "Soroban practice kits restock" },
    { expenseCode: "EXP-2026-004", branchId: branch2?.id, category: "RENT", amount: "1500.00", date: today, description: "Monthly rent — North Valley" },
    { expenseCode: "EXP-2026-005", branchId: branch2?.id, category: "MARKETING", amount: "120.00", date: today, description: "Local campus flyers and social ads" },
    { expenseCode: "EXP-2026-006", branchId: branch1?.id, category: "SALARY", amount: "3200.00", date: today, description: "Instructor payroll (partial month)" },
  ];
  await db.insert(expenses).values(expenseRows as any);

  console.log("Phase 3 seed completed successfully.");
}
