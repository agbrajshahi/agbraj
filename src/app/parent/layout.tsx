import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PortalShell } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.roleName !== "PARENT" && user.roleName !== "SUPER_ADMIN" && user.roleName !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <PortalShell user={user} portalName="Parent Portal" basePath="/parent" accentColor="emerald">
      {children}
    </PortalShell>
  );
}
