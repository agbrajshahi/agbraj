import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { db } from "@/db";
import { students, teachers, branches, payments, invoices, users } from "@/db/schema";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const m = (s?: string | null) => (s || "").toLowerCase().includes(q);
  const results: any[] = [];
  if (hasPermission(user, "students.view")) (await db.select().from(students)).filter((s) => m(s.name) || m(s.studentIdCode) || m(s.guardianName)).slice(0, 8).forEach((s) => results.push({ type: "Student", title: s.name, subtitle: s.studentIdCode, href: `/admin/students/${s.id}` }));
  if (hasPermission(user, "teachers.view")) (await db.select().from(teachers)).filter((t) => m(t.name) || m(t.teacherIdCode)).slice(0, 6).forEach((t) => results.push({ type: "Teacher", title: t.name, subtitle: t.teacherIdCode, href: `/admin/teachers/${t.id}` }));
  if (hasPermission(user, "branches.view")) (await db.select().from(branches)).filter((b) => m(b.name) || m(b.branchCode) || m(b.city)).slice(0, 4).forEach((b) => results.push({ type: "Branch", title: b.name, subtitle: b.city, href: `/admin/branches/${b.id}` }));
  if (hasPermission(user, "invoices.view")) (await db.select().from(invoices)).filter((i) => m(i.invoiceNumber)).slice(0, 6).forEach((i) => results.push({ type: "Invoice", title: i.invoiceNumber, subtitle: `$${i.total} · ${i.status}`, href: `/admin/invoices/${i.id}` }));
  if (hasPermission(user, "payments.view")) (await db.select().from(payments)).filter((p) => m(p.paymentCode) || m(p.reference)).slice(0, 6).forEach((p) => results.push({ type: "Payment", title: p.paymentCode, subtitle: `$${p.amount} · ${p.method}`, href: `/admin/receipts/${p.id}` }));
  if (hasPermission(user, "users.view")) (await db.select().from(users)).filter((u) => m(u.name) || m(u.email)).slice(0, 6).forEach((u) => results.push({ type: "User", title: u.name, subtitle: u.email, href: `/admin/users` }));
  return NextResponse.json({ results });
}
