import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PortalShell } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.roleName !== "TEACHER" && user.roleName !== "SUPER_ADMIN" && user.roleName !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <PortalShell user={user} portalName="Teacher Portal" basePath="/teacher" accentColor="indigo">
      {children}
    </PortalShell>
  );
}
