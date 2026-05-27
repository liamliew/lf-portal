"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderOpen,
  Files,
  Link as LinkIcon,
  Inbox,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const RECENT_PROJECTS_KEY = "lf_recent_projects";

type RecentProject = { id: string; name: string };

function getRecentProjects(): RecentProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addRecentProject(project: RecentProject) {
  if (typeof window === "undefined") return;
  const existing = getRecentProjects().filter((p) => p.id !== project.id);
  localStorage.setItem(
    RECENT_PROJECTS_KEY,
    JSON.stringify([project, ...existing].slice(0, 3))
  );
}

const workspaceNav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", exact: true },
  { id: "projects", label: "Projects", icon: FolderOpen, href: "/dashboard/projects" },
  { id: "files", label: "All files", icon: Files, href: "/dashboard/files" },
  { id: "shares", label: "Share links", icon: LinkIcon, href: "/dashboard/shares" },
  { id: "inbox", label: "Inbox", icon: Inbox, href: "/dashboard/inbox" },
];

const adminNav = [
  { id: "team", label: "Team", icon: Users, href: "/dashboard/team" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function NavItems() {
  const pathname = usePathname();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, [pathname]);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {workspaceNav.map((item) => {
              if (item.id === "projects") {
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {!collapsed && recentProjects.length > 0 && (
                      <SidebarMenuSub>
                        {recentProjects.map((p) => (
                          <SidebarMenuSubItem key={p.id}>
                            <SidebarMenuSubButton
                              isActive={pathname === `/dashboard/projects/${p.id}`}
                              render={<Link href={`/dashboard/projects/${p.id}`} />}
                            >
                              <span>{p.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              }
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive(item.href, item.exact)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Admin</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {adminNav.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

function UserFooter() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User"
    : "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!isLoaded) {
    return (
      <SidebarFooter>
        <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sidebar-accent)" }} />
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, width: 100, background: "var(--sidebar-accent)", borderRadius: 4, marginBottom: 4 }} />
              <div style={{ height: 10, width: 140, background: "var(--sidebar-accent)", borderRadius: 4 }} />
            </div>
          )}
        </div>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "8px 10px" : "8px 10px", borderRadius: 8, cursor: "default" }}
            className="hover:bg-sidebar-accent"
          >
            <Avatar size="sm">
              {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={displayName} />}
              <AvatarFallback>{initials || "?"}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sidebar-foreground)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sidebar-foreground)", opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {email}
                  </div>
                </div>
                <button
                  type="button"
                  title="Sign out"
                  onClick={() => signOut(() => router.push("/sign-in"))}
                  style={{
                    width: 26, height: 26, borderRadius: 6, background: "transparent",
                    border: "none", display: "grid", placeItems: "center",
                    color: "var(--sidebar-foreground)", opacity: 0.5, cursor: "default", flexShrink: 0,
                  }}
                  className="hover:opacity-100 hover:bg-sidebar-accent"
                >
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
        <SidebarTrigger />
      </div>
    </SidebarFooter>
  );
}

export function AppSidebar() {
  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)",
            display: "grid", placeItems: "center",
            fontWeight: 700, fontSize: 13, letterSpacing: "-0.04em", flexShrink: 0,
          }}>
            LF
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em", color: "var(--sidebar-foreground)", whiteSpace: "nowrap" }}>
              LF Creative
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--sidebar-foreground)", opacity: 0.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              PORTAL · v3.1
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavItems />
      </SidebarContent>

      <UserFooter />
    </Sidebar>
  );
}
