import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { Icon } from "@/components/icon";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function Sparkline({ data, width = 96, height = 36 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="kpi-spark" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`2,${height - 2} ${pts} ${width - 2},${height - 2}`} fill="url(#sparkfill)" />
      <polyline points={pts} stroke="var(--accent)" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KPI({
  label, icon, value, unit, delta, deltaDir, sparkData,
}: {
  label: string; icon: string; value: string | number; unit?: string;
  delta?: string; deltaDir?: "up" | "down"; sparkData?: number[];
}) {
  return (
    <div className="kpi">
      <div className="kpi-label mono">
        <span className="kpi-icon"><Icon name={icon} size={13} /></span>
        <span>{label}</span>
      </div>
      <div className="kpi-value">
        <span className="tnum">{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      {delta && deltaDir && (
        <div className={`kpi-delta ${deltaDir}`}>
          <Icon name={deltaDir === "up" ? "arrow_up" : "arrow_down"} size={11} />
          <span className="mono">{delta}</span>
          <span className="muted" style={{ marginLeft: 4 }}>vs last week</span>
        </div>
      )}
      {sparkData && <Sparkline data={sparkData} />}
    </div>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch total project count
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId);

  // Fetch active share links count
  const { data: sharesData } = await supabase
    .from("project_shares")
    .select("*, projects!inner(created_by)")
    .eq("projects.created_by", userId);

  const activeLinks = (sharesData || []).filter(
    (s) => !s.expires_at || new Date(s.expires_at) > new Date()
  );
  const activeSharesCount = activeLinks.length;
  
  // Sort links by created_at to show recent
  activeLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentLinks = activeLinks.slice(0, 4);

  // Fetch 5 most recent files uploaded by this user (NAS view)
  const { data: recentFilesData } = await supabase
    .from("files")
    .select("*, drives(name)")
    .eq("uploaded_by", userId)
    .order("uploaded_at", { ascending: false })
    .limit(5);

  const recentUploads = recentFilesData || [];

  // Total NAS storage and weekly file count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: allFilesData } = await supabase
    .from("files")
    .select("size, uploaded_at")
    .eq("uploaded_by", userId);

  const allFiles = allFilesData || [];
  const totalStorageBytes = allFiles.reduce((acc, f) => acc + Number(f.size || 0), 0);
  const weeklyFileCount = allFiles.filter((f) => new Date(f.uploaded_at) > oneWeekAgo).length;

  // Fetch recent projects
  const { data: recentProjectsData } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentProjects = recentProjectsData || [];

  return (
    <>
      <Topbar crumbs={["Workspace", "Dashboard"]} />
      <div className="content">
        <div className="content-narrow">
          <div className="page-h">
            <div>
              <h1>Good afternoon.</h1>
              <div className="sub">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="page-h-actions">
              <Link href="/dashboard/projects" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                <Icon name="link" size={14} /><span>New share link</span>
              </Link>
              <Link href="/dashboard/projects" className="btn btn-primary" style={{ textDecoration: "none" }}>
                <Icon name="plus" size={14} /><span>New project</span>
              </Link>
            </div>
          </div>

          <div className="kpi-grid">
            <KPI label="Active projects" icon="folder" value={projectCount || 0} />
            <KPI label="Files uploaded" icon="upload" value={weeklyFileCount} unit="this week" />
            <KPI label="Active share links" icon="link" value={activeSharesCount} />
            <KPI label="Storage" icon="archive" value={formatBytes(totalStorageBytes)} />
          </div>

          <div className="dash-grid">
            <div>
              <div className="card" style={{ marginBottom: "var(--dens-gap)" }}>
                <div className="card-hd">
                  <h3>Recent uploads</h3>
                  <span className="card-hd-meta">LAST 24 H</span>
                </div>
                <div>
                  {recentUploads.length === 0 && (
                    <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13 }}>No recent uploads.</div>
                  )}
                  {recentUploads.map((f: { id: string; mime_type?: string; filename?: string; drives?: { name?: string }; parent_id?: string | null; size?: number; uploaded_at: string }) => (
                    <div key={f.id} className="act-row">
                      <div className={`act-icon ${f.mime_type?.startsWith('video') ? 'video' : 'doc'}`}>
                        <Icon name={f.mime_type?.startsWith('video') ? 'film' : 'doc'} size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="act-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.filename}</div>
                        <div className="act-proj">{f.drives?.name ?? 'NAS'} · {f.parent_id ? 'new version' : 'v1'}</div>
                      </div>
                      <span className="act-meta mono">{formatBytes(f.size || 0)}</span>
                      <span className="act-meta mono">{new Date(f.uploaded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-h">
                <h2>Active projects</h2>
                <span className="meta mono">SHOWING {recentProjects.length} OF {projectCount}</span>
              </div>
              <div className="project-card-grid">
                {recentProjects.length === 0 && (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No active projects.</div>
                )}
                {recentProjects.map((p: { id: string; name?: string; description?: string }) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="proj-card" style={{ textDecoration: "none" }}>
                    <div
                      className="proj-card-cover"
                      style={{ "--c1": "#333", "--c2": "#111" } as React.CSSProperties}
                    >
                      <span className="proj-card-code mono">PROJ</span>
                    </div>
                    <div className="proj-card-name">{p.name}</div>
                    <div className="proj-card-meta">
                      <span className={`chip chip-active`}>
                        <span className="chip-dot" />
                        Active
                      </span>
                      <span className="mono" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", maxWidth: "150px" }}>
                        {p.description || "No description"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="card">
                <div className="card-hd">
                  <h3>Active share links</h3>
                  <button className="btn btn-ghost btn-sm">View all</button>
                </div>
                <div>
                  {recentLinks.length === 0 && (
                    <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13 }}>No active links.</div>
                  )}
                  {recentLinks.map((l: { id: string; projects?: { name?: string }; password_hash?: string; pin?: string; token?: string; expires_at?: string }) => (
                    <div key={l.id} className="link-row">
                      <div className="link-row-h">
                        <div className="link-name">{l.projects?.name || "Shared Link"}</div>
                        {(l.password_hash || l.pin) && <Icon name="lock" size={12} style={{ color: "var(--accent-ink)" }} />}
                      </div>
                      <div className="link-url mono">/share/{l.token}</div>
                      <div className="link-meta">
                        <span><Icon name="clock" size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />
                          {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Never expires'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginTop: "var(--dens-gap)" }}>
                <div className="card-hd">
                  <h3>Storage</h3>
                  <span className="card-hd-meta mono">{formatBytes(totalStorageBytes)} USED</span>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                    {allFiles.length} files in NAS · {projectCount || 0} projects
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm">
                    <Icon name="zap" size={12} /><span>Upgrade plan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}