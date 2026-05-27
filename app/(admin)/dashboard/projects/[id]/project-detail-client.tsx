"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Icon } from "@/components/icon";
import { ShareModal } from "@/components/share-modal";
import { addRecentProject } from "@/components/sidebar";
import {
  uploadFileToProject,
  deleteFile,
  addExistingFileToProject,
  getAllFiles,
  type FileGroup,
} from "@/app/actions/files";
import { deleteShare } from "@/app/actions/shares";
import { type Drive } from "@/lib/drives";
import { useRouter } from "next/navigation";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function FileRow({
  group, selected, onToggle, onDownload, onDelete, isPending,
}: {
  group: FileGroup;
  selected: boolean;
  onToggle: () => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const f = group.latest;
  return (
    <div className={"file-row" + (selected ? " selected" : "")} style={{ opacity: isPending ? 0.7 : 1 }}>
      <div
        className={"file-checkbox" + (selected ? " checked" : "")}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      >
        {selected && <Icon name="check" size={11} strokeWidth={2.5} />}
      </div>
      <div className="file-name-cell">
        <div className={`file-thumb ${f.mime_type?.startsWith('video') ? 'video' : 'doc'}`}>
          <Icon name={f.mime_type?.startsWith('video') ? 'film' : 'doc'} size={16} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="file-name">{f.filename}</div>
          <div className="file-sub mono">{f.mime_type}</div>
        </div>
      </div>
      <div>
        <span className="file-version mono final">v{f.versionNumber}</span>
        {group.all.length > 1 && (
          <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 4 }}>
            +{group.all.length - 1}
          </span>
        )}
      </div>
      <div className="file-size mono">{formatBytes(f.size || 0)}</div>
      <div className="file-modified mono">{new Date(f.uploaded_at).toLocaleDateString()}</div>
      <div className="file-share">
        <span className="faint">Private</span>
      </div>
      <div className="file-actions">
        <button type="button" className="file-action" title="Download" onClick={(e) => { e.preventDefault(); onDownload(f.id); }}>
          <Icon name="download" size={14} />
        </button>
        <button type="button" className="file-action" title="Delete" onClick={(e) => { e.preventDefault(); onDelete(f.id); }} style={{ color: "var(--error)" }}>
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}

function NASPickerModal({
  projectId,
  onClose,
  onAttached,
}: {
  projectId: string;
  onClose: () => void;
  onAttached: () => void;
}) {
  const [nasFiles, setNasFiles] = useState<FileGroup[] | null>(null);
  const [query, setQuery] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);

  useEffect(() => {
    getAllFiles().then(setNasFiles).catch(() => setNasFiles([]));
  }, []);

  const filtered = nasFiles?.filter((g) =>
    !query || g.filename.toLowerCase().includes(query.toLowerCase())
  ) ?? [];

  const handleAttach = async (rootId: string) => {
    setAttaching(rootId);
    try {
      await addExistingFileToProject(projectId, rootId);
      onAttached();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to attach file");
    } finally {
      setAttaching(null);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <h2>Attach from NAS</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "12px 20px 8px" }}>
          <input
            placeholder="Search files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)" }}
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "0 20px 20px" }}>
          {nasFiles === null && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
          )}
          {nasFiles !== null && filtered.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No files found.</div>
          )}
          {filtered.map((g) => (
            <div key={g.rootId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div className={`file-thumb ${g.latest.mime_type?.startsWith('video') ? 'video' : 'doc'}`}>
                <Icon name={g.latest.mime_type?.startsWith('video') ? 'film' : 'doc'} size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="file-name" style={{ fontSize: 13 }}>{g.filename}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                  {g.drive_name ?? 'NAS'} · v{g.latest.versionNumber} · {formatBytes(g.latest.size)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={attaching === g.rootId}
                onClick={() => handleAttach(g.rootId)}
              >
                {attaching === g.rootId ? "…" : "Attach"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProjectDetailClientProps {
  project: { id: string; name: string; description?: string; created_by: string; };
  fileGroups: FileGroup[];
  shareLinks: { id: string; token: string; password_hash?: string; pin?: string; expires_at?: string; }[];
  drives: Drive[];
}

export function ProjectDetailClient({ project, fileGroups, shareLinks, drives }: ProjectDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [openShare, setOpenShare] = useState(false);
  const [openNasPicker, setOpenNasPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState(drives[0]?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    addRecentProject({ id: project.id, name: project.name });
  }, [project.id, project.name]);

  const toggle = (rootId: string) => {
    const s = new Set(selected);
    if (s.has(rootId)) { s.delete(rootId); } else { s.add(rootId); }
    setSelected(s);
  };

  const filtered = fileGroups.filter((g) => {
    if (query && !g.filename.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDriveId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadFileToProject(project.id, selectedDriveId, formData);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file from the NAS?")) return;
    startTransition(async () => {
      try {
        await deleteFile(id);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete file");
      }
    });
  };

  const handleDownloadFile = (id: string) => {
    window.open(`/api/download/${id}`, "_blank");
  };

  const handleRevokeShare = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this share link?")) return;
    startTransition(async () => {
      try {
        await deleteShare(id);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to revoke share link");
      }
    });
  };

  return (
    <>
      <div className="files-layout">
        <div>
          <div className="toolbar">
            <div className="toolbar-search">
              <span className="toolbar-search-icon"><Icon name="search" size={13} /></span>
              <input
                placeholder="Search files…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="tab-row">
              <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
                All <span className="mono faint" style={{ marginLeft: 4 }}>{fileGroups.length}</span>
              </button>
            </div>
            <div style={{ flex: 1 }} />
            {drives.length > 0 && (
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                title="Select upload drive"
                aria-label="Select upload drive"
                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)", fontSize: 13 }}
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            <input
              type="file"
              ref={fileInputRef}
              aria-label="Upload file"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setOpenNasPicker(true)}
            >
              <Icon name="link" size={13} /><span>Attach from NAS</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !selectedDriveId}
            >
              <Icon name="upload" size={13} /><span>{isUploading ? "Uploading..." : "Upload files"}</span>
            </button>
          </div>

          {drives.length === 0 && (
            <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
              No drives configured. Add a drive to enable uploads.
            </div>
          )}

          <div className="file-table">
            <div className="file-table-hd">
              <div />
              <div>Name</div>
              <div>Version</div>
              <div>Size</div>
              <div>Modified</div>
              <div>Sharing</div>
              <div />
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                No files found.
              </div>
            )}
            {filtered.map((g) => (
              <FileRow
                key={g.rootId}
                group={g}
                selected={selected.has(g.rootId)}
                onToggle={() => toggle(g.rootId)}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                isPending={isPending}
              />
            ))}
          </div>

          {selected.size > 0 && (
            <div className="bulk-bar">
              <span className="bulk-bar-count mono">{selected.size} SELECTED</span>
              <button type="button" className="btn btn-sm"><Icon name="download" size={13} /><span>Download</span></button>
              <button type="button" className="btn btn-sm"><Icon name="trash" size={13} /><span>Delete</span></button>
              <button type="button" className="bulk-bar-x" onClick={() => setSelected(new Set())}>×</button>
            </div>
          )}
        </div>

        <div className="right-rail">
          <div className="card">
            <div className="card-hd">
              <h3>Active share links</h3>
              <span className="card-hd-meta">{shareLinks.length} ACTIVE</span>
            </div>
            <div style={{ padding: "8px 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              {shareLinks.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No share links created.</div>
              )}
              {shareLinks.map((l) => (
                <div key={l.id} className="share-card">
                  <div className="share-card-h">
                    <div className="share-card-name">Shared Link</div>
                    {(l.password_hash || l.pin) && (
                      <span className="chip chip-accent" style={{ height: 20, padding: "0 7px", fontSize: 10 }}>
                        <Icon name="lock" size={10} /> PIN
                      </span>
                    )}
                  </div>
                  <div className="share-card-url mono">
                    <span>/share/{l.token}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share/${l.token}`);
                        alert("Copied to clipboard!");
                      }}
                      style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", padding: 0, display: "flex" }}
                      title="Copy to clipboard"
                    >
                      <Icon name="copy" size={12} />
                    </button>
                  </div>
                  <dl className="share-card-grid">
                    <div><dt className="mono">FILES</dt><dd>{fileGroups.length}</dd></div>
                    <div><dt className="mono">EXPIRES</dt><dd>{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Never'}</dd></div>
                  </dl>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--error)", width: "100%", justifyContent: "center" }} onClick={() => handleRevokeShare(l.id)}>
                      <Icon name="trash" size={12} /><span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", marginTop: 2 }}
                onClick={() => setOpenShare(true)}
              >
                <Icon name="plus" size={13} /><span>Create share link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {openShare && (
        <ShareModal
          projectId={project.id}
          onClose={() => setOpenShare(false)}
          onSuccess={() => { setOpenShare(false); router.refresh(); }}
        />
      )}
      {openNasPicker && (
        <NASPickerModal
          projectId={project.id}
          onClose={() => setOpenNasPicker(false)}
          onAttached={() => { setOpenNasPicker(false); router.refresh(); }}
        />
      )}
    </>
  );
}
