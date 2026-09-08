import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { invoices, invoiceItems, students, branches, payments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notifyUsers } from "@/lib/notifications/notify";
import { sendTemplatedEmail } from "@/lib/email/service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "invoices.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search") || "";

    const rows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        studentId: invoices.studentId,
        studentName: students.name,
        studentCode: students.studentIdCode,
        branchId: invoices.branchId,
        branchName: branches.name,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        total: invoices.total,
        paidAmount: invoices.paidAmount,
        status: invoices.status,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(branches, eq(invoices.branchId, branches.id))
      .orderBy(desc(invoices.invoiceDate));

    let filtered = rows.map((r) => {
      const paid = Number(r.paidAmount);
      const total = Number(r.total);
      // Dynamic overdue detection
      let status = r.status;
      if ((r.status === "DUE" || r.status === "PARTIAL") && new Date(r.dueDate) < new Date() && paid < total) {
        status = "OVERDUE";
      }
      return { ...r, status, dueAmount: Math.max(0, total - paid) };
    });

    if (user.roleName === "BRANCH_MANAGER" && user.branchId) filtered = filtered.filter((r) => r.branchId === user.branchId);
    else if (branchId && branchId !== "ALL") filtered = filtered.filter((r) => r.branchId === parseInt(branchId));
    if (status && status !== "ALL") filtered = filtered.filter((r) => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.invoiceNumber.toLowerCase().includes(q) || (r.studentName || "").toLowerCase().includes(q));
    }

    return NextResponse.json({ invoices: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "invoices.create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data = await req.json();
    if (!data.studentId || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "Student and at least one invoice item are required" }, { status: 400 });
    }

    const stu = await db.select().from(students).where(eq(students.id, parseInt(data.studentId))).limit(1);
    if (!stu.length) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    const student = stu[0];

    const subtotal = data.items.reduce((sum: number, it: any) => sum + Number(it.amount || 0) * Number(it.quantity || 1), 0);
    const discount = Number(data.discount || 0);
    const total = Math.max(0, subtotal - discount);
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const lastInv = await db.select({ id: invoices.id }).from(invoices).orderBy(desc(invoices.id)).limit(1);
    const invoiceNumber = data.invoiceNumber || `INV-2026-${String(1001 + (lastInv[0]?.id || 0)).padStart(4, "0")}`;

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        studentId: student.id,
        branchId: data.branchId ? parseInt(data.branchId) : student.branchId,
        invoiceDate: new Date(),
        dueDate,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        paidAmount: "0.00",
        status: "DUE",
        notes: data.notes || null,
        createdBy: user.id,
      })
      .returning();

    await db.insert(invoiceItems).values(
      data.items.map((it: any) => ({
        invoiceId: invoice.id,
        description: it.description,
        feeType: it.feeType || "COURSE",
        quantity: Number(it.quantity || 1),
        amount: Number(it.amount || 0).toFixed(2),
      }))
    );

    if (student.userId) await notifyUsers([student.userId], "DUE", "New invoice issued", `${invoiceNumber} for $${total.toFixed(2)} is due on ${dueDate.toLocaleDateString()}.`, "/student");
    await sendTemplatedEmail(student.guardianEmail, "PAYMENT_DUE", { invoiceNumber, dueAmount: total.toFixed(2), dueDate: dueDate.toLocaleDateString() });

    await logActivity({
      userId: user.id, userName: user.name, action: "CREATE", entity: "INVOICE", entityId: invoice.id,
      details: `Generated invoice ${invoiceNumber} for ${student.name} ($${total.toFixed(2)})`,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
