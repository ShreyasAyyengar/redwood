"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminPanel from "#/features/admin/components/admin-panel.tsx";
import { useCurrentUser } from "#/lib/current-user.tsx";
import { hasAdminAccess, hasSupervisorAccess } from "#/lib/permissions.ts";

export default function AdminPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const canAccessAdminPanel = hasSupervisorAccess(user.role);

  useEffect(() => {
    if (!canAccessAdminPanel) router.replace("/classrooms");
  }, [router, canAccessAdminPanel]);

  if (!canAccessAdminPanel) return null;

  return (
    <div className="flex min-h-0 w-full flex-1 justify-center overflow-hidden p-5">
      <AdminPanel isAdmin={hasAdminAccess(user.role)} />
    </div>
  );
}
