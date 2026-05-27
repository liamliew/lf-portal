"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import { createProject, deleteProject, getProjects, type ProjectWithStats } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function ProjectRow({
  project,
  onDelete,
  isPending,
}: {
  project: ProjectWithStats;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  isPending: boolean;
}) {
  return (
    <Link href={`/dashboard/projects/${project.id}`} style={{ textDecoration: "none" }}>
      <div className="project-row" style={{ opacity: isPending ? 0.7 : 1 }}>
        <div className="project-cover" style={{ background: "linear-gradient(135deg, #333, #111)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.08em" }}>PROJ</span>
            <span className="chip chip-active">Active</span>
          </div>
          <div style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14, lineHeight: 1.3 }}>
            {project.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.description || "No description"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, flexShrink: 0, alignItems: "center" }}>
          <Stat label="Files" value={String(project.fileCount)} />
          <Stat label="Size" value={formatBytes(project.totalSize)} />
          <Stat label="Links" value={String(project.activeLinks)} dim={project.activeLinks === 0} />
          <div style={{ textAlign: "right", minWidth: 80 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 2 }}>Created</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => onDelete(e, project.id, project.name)}
            style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: 8, borderRadius: 4, display: "flex", alignItems: "center" }}
            title="Delete project"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>

        <div style={{ color: "var(--text-faint)", flexShrink: 0, display: "flex", alignItems: "center", marginLeft: 8 }}>
          <Icon name="chevron_right" size={14} />
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div style={{ textAlign: "right", minWidth: 48 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 2 }}>{label}</div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: dim ? "var(--text-faint)" : "var(--text-strong)" }}>
        {value}
      </div>
    </div>
  );
}

interface ProjectsClientProps {
  initialProjects: ProjectWithStats[];
  total: number;
  pageSize: number;
}

export function ProjectsClient({ initialProjects, total, pageSize }: ProjectsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [totalCount, setTotalCount] = useState(total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = projects.length < totalCount;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createProject(name, description);
        setDialogOpen(false);
        setName("");
        setDescription("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create project");
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string, projectName: string) => {
    e.preventDefault();
    setDeleteTarget({ id, name: projectName });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await deleteProject(id);
        toast.success("Project deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete project");
      }
    });
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const { projects: next, total: newTotal } = await getProjects({ limit: pageSize, offset: projects.length });
      setProjects((prev) => [...prev, ...next]);
      setTotalCount(newTotal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Projects</h1>
          <div className="sub">{totalCount} total</div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Icon name="plus" size={14} />
          New project
        </Button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-faint)" }}>
            All
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>
            {totalCount}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {projects.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>
              No projects yet. Create your first one.
            </div>
          )}
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} onDelete={(e, id) => handleDelete(e, id, p.name)} isPending={isPending} />
          ))}
        </div>

        {hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading…" : `Load more (${totalCount - projects.length} remaining)`}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; and all its files will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} style={{ background: "var(--danger)" }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} id="create-project-form">
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0 8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Project name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My project"
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-project-form" disabled={isPending || !name.trim()}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
