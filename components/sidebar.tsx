"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
};

interface SidebarProps {
  projectCount: number;
  shareCount: number;
}

export function Sidebar({ projectCount, shareCount }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
    { id: "projects", label: "Projects", icon: "folder", href: "/dashboard/projects", count: projectCount },
    { id: "files", label: "All files", icon: "film", href: "/dashboard/files" },
    { id: "shares", label: "Share links", icon: "link", href: "/dashboard/shares", count: shareCount },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-mark">LF</div>
        <div className="sb-brand-text">
          <div className="sb-brand-name">LF Creative</div>
          <div className="sb-brand-meta mono">PORTAL · v3.1</div>
        </div>
      </div>

      <div className="sb-group-label mono">Workspace</div>
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={"sb-item" + (isActive(item.href) ? " active" : "")}
        >
          <Icon name={item.icon} size={17} className="sb-icon" />
          <span className="sb-label">{item.label}</span>
          {item.count != null && <span className="sb-count mono">{item.count}</span>}
        </Link>
      ))}

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">LF</div>
          <div className="sb-user-text">
            <div className="sb-user-name">Liam Fenwick</div>
            <div className="sb-user-role">Founder · Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
