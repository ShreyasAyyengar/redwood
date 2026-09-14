"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminPanel from "#/features/admin/components/admin-panel.tsx";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasAdminAccess, hasSupervisorAccess } from "#/lib/permissions.ts";

export default function AdminPage() {
  const router = useRouter();
  const { data: session } = authClientWeb.useSession();
  const canAccessAdminPanel = hasSupervisorAccess(session?.user.role);

  useEffect(() => {
    if (session && !canAccessAdminPanel) router.replace("/classrooms");
  }, [router, session, canAccessAdminPanel]);

  if (!canAccessAdminPanel) return null;

  return (
    <div className="flex min-h-0 w-full flex-1 justify-center overflow-hidden p-5">
      <AdminPanel isAdmin={hasAdminAccess(session?.user.role)} />
    </div>
  );
}
