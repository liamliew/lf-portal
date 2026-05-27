import { Icon } from "./icon";

interface TopbarProps {
  crumbs: string[];
}

export function Topbar({ crumbs }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <span className="sep"><Icon name="chevron_right" size={13} /></span>}
            <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
          </span>
        ))}
      </div>

      <div className="topbar-search">
        <span className="topbar-search-icon"><Icon name="search" size={14} /></span>
        <input placeholder="Search projects, files, share links…" readOnly />
        <span className="topbar-search-kbd mono">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={16} />
        </button>
        <button className="btn btn-primary">
          <Icon name="upload" size={14} />
          <span>Upload</span>
        </button>
      </div>
    </div>
  );
}
