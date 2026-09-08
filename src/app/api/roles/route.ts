import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { roles, permissions, rolePermissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allRoles = await db.select().from(roles);
    const allPermissions = await db.select().from(permissions);
    const allRolePerms = await db.select().from(rolePermissions);

    const enrichedRoles = allRoles.map((r) => {
      const assignedPermIds = allRolePerms.filter((rp) => rp.roleId === r.id).map((rp) => rp.permissionId);
      const assignedPerms = allPermissions.filter((p) => assignedPermIds.includes(p.id));
      return {
        ...r,
        permissions: assignedPerms,
      };
    });

    return NextResponse.json({
      roles: enrichedRoles,
      permissions: allPermissions,
    });
  } catch (error) {
    console.error("Roles fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
