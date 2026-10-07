"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@redwood/shad-ui/components/sidebar";
import { useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCurrentUser } from "#/lib/current-user.tsx";
import { AppSidebar } from "./app-sidebar";
import LoadingScreen from "./loading";

const pageTitles: Record<string, string> = {
  "/classrooms": "Classrooms",
  "/issues": "Issues",
  "/tasks": "Tasks",
  "/shift-builder": "Shift Builder",
  "/hotline": "Hotline",
  "/admin": "Admin Panel",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useCurrentUser();

  if (isLoading || !isAuthenticated) return <LoadingScreen />;

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar user={user} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden font-sans text-white">
        <header className="flex h-14 shrink-0 items-center gap-3 border-border/70 border-b px-4 md:hidden">
          <SidebarTrigger className="size-8" />
          <span className="font-semibold">{pageTitles[pathname] ?? "Redwood"}</span>
        </header>
        <div className="flex min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden [&>*]:min-w-fit">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
