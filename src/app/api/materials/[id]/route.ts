import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission, logActivity } from "@/lib/auth";
import { db } from "@/db";
import { studyMaterials } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "materials.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(studyMaterials).where(eq(studyMaterials.id, parseInt(id)));

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "DELETE",
      entity: "MATERIAL",
      entityId: id,
      details: `Deleted study material #${id}`,
    });

    return NextResponse.json({ success: true, message: "Material deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
