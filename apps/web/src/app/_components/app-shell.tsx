"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@redwood/shad-ui/components/sidebar";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { authClientWeb } from "#/lib/auth-client-web.ts";
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
  const { data: session, isPending } = authClientWeb.useSession();

  if (isPending || !session) return <LoadingScreen />;

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar session={session} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden font-sans text-white">
        <header className="flex h-14 shrink-0 items-center gap-3 border-border/70 border-b px-4 md:hidden">
          <SidebarTrigger className="size-8" />
          <span className="font-semibold">{pageTitles[pathname] ?? "Redwood"}</span>
        </header>
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
