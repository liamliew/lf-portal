"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { createProject, deleteProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function ProjectsClient({ initialProjects }: { initialProjects: { id: string; name: string; description?: string; fileCount: number; totalSize: number; activeLinks: number; created_at: string; }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createProject(name, description);
        setIsModalOpen(false);
        setName("");
        setDescription("");
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to create project");
      }
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // prevent link navigation
    if (!confirm("Are you sure you want to delete this project and all its files?")) return;
    
    startTransition(async () => {
      try {
        await deleteProject(id);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete project");
      }
    });
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Projects</h1>
          <div className="sub">{initialProjects.length} total · {initialProjects.length} active</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Icon name="plus" size={14} /><span>New project</span>
        </button>
      </div>

      <ProjectSection title="Active" projects={initialProjects} onDelete={handleDelete} isPending={isPending} />

      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", 
          justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "var(--surface)", padding: 24, borderRadius: 12, 
            width: "100%", maxWidth: 400, border: "1px solid var(--border)"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>New Project</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "var(--text-muted)" }}>Project Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)" }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "var(--text-muted)" }}>Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ProjectSection({ title, projects, onDelete, isPending }: { title: string; projects: { id: string; name: string; description?: string; fileCount: number; totalSize: number; activeLinks: number; created_at: string; }[]; onDelete: (e: React.MouseEvent, id: string) => void; isPending: boolean }) {
  return (
    <div style={{ marginBottom: 36, opacity: isPending ? 0.7 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--text-faint)",
          fontFamily: "var(--font-mono)",
        }}>{title}</span>
        <span style={{
          fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "1px 6px",
        }}>{projects.length}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {projects.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>No projects found.</div>}
        {projects.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none" }}>
            <div className="project-row" style={{ position: "relative" }}>
              <div
                className="project-cover"
                style={{ background: `linear-gradient(135deg, #333, #111)` }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.06em" }}>
                    PROJ
                  </span>
                  <span className={`chip chip-active`}>Active</span>
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14, lineHeight: 1.3 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.description || "No description"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 32, flexShrink: 0, alignItems: "center" }}>
                <Stat label="Files" value={String(p.fileCount)} />
                <Stat label="Size" value={formatBytes(p.totalSize)} />
                <Stat label="Links" value={String(p.activeLinks)} dim={p.activeLinks === 0} />
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>
                    Activity
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={(e) => onDelete(e, p.id)}
                  style={{
                    background: "transparent", border: "none", color: "var(--error)", 
                    cursor: "pointer", padding: "8px", borderRadius: "4px", display: "flex", alignItems: "center"
                  }}
                  title="Delete project"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>

              <div style={{ color: "var(--text-faint)", flexShrink: 0, display: "flex", alignItems: "center", marginLeft: 8 }}>
                <Icon name="chevron_right" size={15} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div style={{ textAlign: "right", minWidth: 52 }}>
      <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 500,
        color: dim ? "var(--text-faint)" : "var(--text-strong)",
      }}>
        {value}
      </div>
    </div>
  );
}