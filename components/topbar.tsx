"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";
import { CommandPalette } from "./command-palette";

interface TopbarProps {
  crumbs: string[];
}

export function Topbar({ crumbs }: TopbarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-crumbs">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <span className="sep"><Icon name="chevron_right" size={13} /></span>}
              <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
            </span>
          ))}
        </div>

        <div className="topbar-search" onClick={() => setOpen(true)} style={{ cursor: "default" }}>
          <span className="topbar-search-icon"><Icon name="search" size={14} /></span>
          <input
            placeholder="Search projects, files, share links…"
            readOnly
            style={{ cursor: "default" }}
          />
          <span className="topbar-search-kbd mono">⌘K</span>
        </div>

        <div className="topbar-actions">
          <button type="button" className="icon-btn" title="Notifications">
            <Icon name="bell" size={16} />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="upload" size={14} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
