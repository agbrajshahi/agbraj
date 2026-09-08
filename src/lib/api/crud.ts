import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { eq, desc, asc } from "drizzle-orm";

interface CrudOptions {
  table: any;
  entity: string;
  viewPermission: string;
  managePermission: string;
  toRow: (data: any, user: any) => Record<string, any>;
  toUpdate?: (data: any, user: any) => Record<string, any>;
  orderBy?: "createdAt" | "sortOrder";
  afterCreate?: (row: any, user: any) => Promise<void>;
  afterUpdate?: (row: any, data: any, user: any) => Promise<void>;
}

function clean(obj: Record<string, any>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export function createCrudHandlers(opts: CrudOptions) {
  const { table } = opts;

  async function GET() {
    try {
      const user = await getCurrentUser();
      if (!user || !hasPermission(user, opts.viewPermission)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const order = opts.orderBy === "sortOrder" ? [asc(table.sortOrder), desc(table.id)] : [desc(table.id)];
      const rows = await db.select().from(table).orderBy(...order);
      return NextResponse.json({ items: rows, total: rows.length });
    } catch (e: any) {
      console.error(`${opts.entity} list error`, e);
      return NextResponse.json({ error: `Failed to load ${opts.entity.toLowerCase()}` }, { status: 500 });
    }
  }

  async function POST(req: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !hasPermission(user, opts.managePermission)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const data = await req.json();
      const inserted = (await db.insert(table).values(clean(opts.toRow(data, user))).returning()) as any[];
      const row = inserted[0];
      if (opts.afterCreate) await opts.afterCreate(row, user);
      await logActivity({ userId: user.id, userName: user.name, action: "CREATE", entity: opts.entity, entityId: row.id, details: `Created ${opts.entity.toLowerCase()} #${row.id}` });
      return NextResponse.json({ success: true, item: row });
    } catch (e: any) {
      console.error(`${opts.entity} create error`, e);
      return NextResponse.json({ error: e.message || "Create failed" }, { status: 500 });
    }
  }

  async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
      const user = await getCurrentUser();
      if (!user || !hasPermission(user, opts.managePermission)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { id } = await context.params;
      const data = await req.json();
      const mapper = opts.toUpdate || opts.toRow;
      const updated = (await db.update(table).set({ ...clean(mapper(data, user)), updatedAt: new Date() }).where(eq(table.id, parseInt(id))).returning()) as any[];
      const row = updated[0];
      if (opts.afterUpdate) await opts.afterUpdate(row, data, user);
      await logActivity({ userId: user.id, userName: user.name, action: "UPDATE", entity: opts.entity, entityId: id, details: `Updated ${opts.entity.toLowerCase()} #${id}` });
      return NextResponse.json({ success: true, item: row });
    } catch (e: any) {
      console.error(`${opts.entity} update error`, e);
      return NextResponse.json({ error: e.message || "Update failed" }, { status: 500 });
    }
  }

  async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
    try {
      const user = await getCurrentUser();
      if (!user || !hasPermission(user, opts.managePermission)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { id } = await context.params;
      await db.delete(table).where(eq(table.id, parseInt(id)));
      await logActivity({ userId: user.id, userName: user.name, action: "DELETE", entity: opts.entity, entityId: id, details: `Deleted ${opts.entity.toLowerCase()} #${id}` });
      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Delete failed" }, { status: 500 });
    }
  }

  return { GET, POST, PUT, DELETE };
}

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
const num = (v: any) => (v === undefined || v === null || v === "" ? undefined : parseInt(v));
const nul = (v: any) => (v === undefined ? undefined : v === "" ? null : v);
const fk = (v: any) => (v === undefined ? undefined : v === "" || v === null ? null : parseInt(v));
export const h = { num, nul, fk, slugify };
