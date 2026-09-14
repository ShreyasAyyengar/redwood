"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@redwood/shad-ui/components/dropdown-menu";
import { Kbd } from "@redwood/shad-ui/components/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@redwood/shad-ui/components/sidebar";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import {
  Check,
  ChevronUp,
  ClipboardCheck,
  LogOut,
  MessageSquareText,
  PhoneCall,
  Plus,
  Repeat2,
  School,
  ShieldCheck,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { env } from "#/env.ts";
import FeedbackDialog from "#/features/feedback/components/dialogs/feedback-dialog.tsx";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasSupervisorAccess } from "#/lib/permissions.ts";
import { AccountAvatar } from "./action-menu/account-avatar";
import type { DeviceSession } from "./action-menu/types";

export type AppPane = "classrooms" | "issues" | "tasks" | "shift-builder" | "hotline" | "admin";

type NavigationItem = {
  id: AppPane;
  href: `/${AppPane}`;
  label: string;
  shortcut: number;
  icon: typeof School;
};

const maintenanceItems: NavigationItem[] = [
  { id: "classrooms", href: "/classrooms", label: "Classrooms", shortcut: 1, icon: School },
  { id: "issues", href: "/issues", label: "Issues", shortcut: 2, icon: TriangleAlert },
  { id: "tasks", href: "/tasks", label: "Tasks", shortcut: 3, icon: ClipboardCheck },
  { id: "shift-builder", href: "/shift-builder", label: "Shift Builder", shortcut: 4, icon: WandSparkles },
];

const managementItems: NavigationItem[] = [
  { id: "hotline", href: "/hotline", label: "Hotline", shortcut: 5, icon: PhoneCall },
  { id: "admin", href: "/admin", label: "Admin Panel", shortcut: 6, icon: ShieldCheck },
];

const PREFETCH_DELAY_MS = 250;
type ActiveSession = NonNullable<ReturnType<typeof authClientWeb.useSession>["data"]>;

function NavigationGroup({ items, label, pathname }: { items: NavigationItem[]; label: string; pathname: string }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-semibold uppercase tracking-[0.16em]">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={`${item.label} (${formatForDisplay(`mod+${item.shortcut}`)})`}
                className="h-9"
              >
                <Link href={item.href} prefetch onClick={() => setOpenMobile(false)}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuBadge className="text-[15px] text-sidebar-foreground/45">
                <Kbd>{formatForDisplay(`mod+${item.shortcut}`)}</Kbd>
              </SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AccountMenu({ session }: { session: ActiveSession }) {
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const { isMobile } = useSidebar();
  const { user, session: activeSession } = session;
  const activeSessionToken = activeSession.token;

  const loadDeviceSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { data } = await authClientWeb.multiSession.listDeviceSessions();
      setDeviceSessions((data ?? []) as DeviceSession[]);
    } catch {
      setDeviceSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const switchToSession = async (sessionToken: string) => {
    if (sessionToken === activeSessionToken) return;
    await authClientWeb.multiSession.setActive({ sessionToken });
    window.location.reload();
  };

  const addAccount = () => {
    authClientWeb.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
      errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
    });
  };

  const signOut = () => {
    authClientWeb.signOut().catch(() => undefined);
  };

  const accountLabel = user?.name ?? user?.email ?? "Account";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={(open) => open && loadDeviceSessions().catch(() => undefined)}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton type="button" size="lg" tooltip={accountLabel} className="h-12 data-[state=open]:bg-sidebar-accent">
              <div className="size-8 shrink-0 overflow-hidden rounded-lg">
                <AccountAvatar account={user ?? {}} imageAlt={accountLabel} />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name ?? "Redwood account"}</span>
                <span className="truncate text-sidebar-foreground/55 text-xs">{user?.email}</span>
              </div>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" side={isMobile ? "bottom" : "right"} align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 py-1">
                <div className="size-8 shrink-0 overflow-hidden rounded-lg">
                  <AccountAvatar account={user ?? {}} imageAlt={accountLabel} />
                </div>
                <div className="grid min-w-0 text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name ?? "Redwood account"}</span>
                  <span className="truncate text-muted-foreground text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Repeat2 />
                Switch accounts
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-60">
                {isLoadingSessions ? (
                  <DropdownMenuItem disabled>Loading accounts…</DropdownMenuItem>
                ) : (
                  deviceSessions.map((deviceSession) => {
                    const isActive = deviceSession.session.token === activeSessionToken;
                    const label = deviceSession.user.name ?? deviceSession.user.email ?? "Account";
                    return (
                      <DropdownMenuItem
                        key={deviceSession.session.token}
                        className="gap-2"
                        onSelect={() => switchToSession(deviceSession.session.token).catch(() => undefined)}
                      >
                        <div className="size-6 shrink-0 overflow-hidden rounded-md">
                          <AccountAvatar account={deviceSession.user} imageAlt={label} />
                        </div>
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {isActive && <Check className="size-4 text-emerald-400" />}
                      </DropdownMenuItem>
                    );
                  })
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={addAccount}>
                  <Plus />
                  Add account
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem variant="destructive" onSelect={signOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ session }: { session: ActiveSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const canAccessAdminPanel = hasSupervisorAccess(session.user.role);
  const visibleManagementItems = useMemo(
    () => (canAccessAdminPanel ? managementItems : managementItems.filter((item) => item.id !== "admin")),
    [canAccessAdminPanel]
  );
  const visibleRoutes = useMemo(() => [...maintenanceItems, ...visibleManagementItems], [visibleManagementItems]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      for (const route of visibleRoutes) router.prefetch(route.href);
    }, PREFETCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [router, visibleRoutes]);

  useEffect(() => {
    const routesByShortcut = new Map(visibleRoutes.map((item) => [String(item.shortcut), item.href]));
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.repeat) return;
      const href = routesByShortcut.get(event.key);
      if (!href) return;
      event.preventDefault();
      setOpenMobile(false);
      router.push(href);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router, setOpenMobile, visibleRoutes]);

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/80">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex h-10 items-center gap-3 overflow-hidden rounded-lg px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Image src="/redwood-icon.png" alt="Redwood logo" className="size-8 shrink-0 rounded-md" height={32} width={32} priority />
          <span className="truncate font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">Redwood</span>
          <SidebarTrigger className="ml-auto size-8 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="pt-2">
        <NavigationGroup label="Maintenance" items={maintenanceItems} pathname={pathname} />
        <NavigationGroup label="Management" items={visibleManagementItems} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <FeedbackDialog>
              <SidebarMenuButton type="button" tooltip="Feedback" className="h-9">
                <MessageSquareText />
              </SidebarMenuButton>
            </FeedbackDialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <AccountMenu session={session} />
      </SidebarFooter>
      <SidebarRail resizable />
    </Sidebar>
  );
}
