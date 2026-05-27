"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  uploadFileToNAS,
  addExistingFileToProject,
  type FileGroup,
} from "@/app/actions/files";
import {
  createFolder,
  renameFolder,
  deleteFolder,
  type NASFolder,
} from "@/app/actions/folders";
import { type Drive } from "@/lib/drives";
import Link from "next/link";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface Props {
  groups: FileGroup[];
  drives: Drive[];
  projects: { id: string; name: string }[];
  folders: NASFolder[];
  breadcrumb: NASFolder[];
  currentFolderId?: string;
}

export function AllFilesClient({ groups, drives, projects, folders, breadcrumb, currentFolderId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [driveFilter, setDriveFilter] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDriveId, setUploadDriveId] = useState(drives[0]?.id ?? "");
  const [attachingRootId, setAttachingRootId] = useState<string | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = groups.filter((g) => {
    if (query && !g.filename.toLowerCase().includes(query.toLowerCase())) return false;
    if (driveFilter && g.drive_name !== driveFilter) return false;
    return true;
  });

  const driveNames = Array.from(new Set(groups.map((g) => g.drive_name).filter(Boolean))) as string[];

  const handleDownload = (fileId: string) => {
    window.open(`/api/download/${fileId}`, "_blank");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadDriveId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadFileToNAS(uploadDriveId, formData, currentFolderId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAttach = (rootId: string, projectId: string) => {
    startTransition(async () => {
      try {
        await addExistingFileToProject(projectId, rootId);
        setAttachingRootId(null);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to attach file");
      }
    });
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await createFolder(name, currentFolderId, drives[0]?.id);
      setNewFolderName("");
      setNewFolderMode(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const handleRenameFolder = async (id: string) => {
    const name = renameName.trim();
    if (!name) return;
    try {
      await renameFolder(id, name);
      setRenamingFolderId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await deleteFolder(id);
      setFolderMenuId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete folder");
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13 }}>
        <Link
          href="/dashboard/files"
          style={{ color: breadcrumb.length === 0 ? "var(--text-strong)" : "var(--text-muted)", fontWeight: breadcrumb.length === 0 ? 600 : 400 }}
        >
          NAS
        </Link>
        {breadcrumb.map((crumb, i) => (
          <span key={crumb.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="chevron_right" size={12} style={{ color: "var(--text-faint)" }} />
            <Link
              href={`/dashboard/files?folderId=${crumb.id}`}
              style={{
                color: i === breadcrumb.length - 1 ? "var(--text-strong)" : "var(--text-muted)",
                fontWeight: i === breadcrumb.length - 1 ? 600 : 400,
              }}
            >
              {crumb.name}
            </Link>
          </span>
        ))}
      </div>

      <div className="page-h">
        <div>
          <h1>{breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : "All files"}</h1>
          <div className="sub">{groups.length} files · {folders.length} folders · NAS</div>
        </div>
      </div>

      {/* Folder grid */}
      {(folders.length > 0 || newFolderMode) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Folders
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setNewFolderMode(true); setNewFolderName(""); }}
            >
              <Icon name="plus" size={12} /><span>New folder</span>
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {newFolderMode && (
              <div style={{
                padding: "14px", border: "1.5px dashed var(--border-2)", borderRadius: 10,
                background: "var(--surface)", display: "flex", flexDirection: "column", gap: 8,
              }}>
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") { setNewFolderMode(false); setNewFolderName(""); }
                  }}
                  placeholder="Folder name"
                  style={{
                    border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px",
                    fontSize: 13, outline: "none", background: "var(--surface-2)",
                  }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateFolder} style={{ flex: 1, justifyContent: "center" }}>Create</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setNewFolderMode(false); setNewFolderName(""); }}>Cancel</button>
                </div>
              </div>
            )}
            {folders.map((folder) => (
              <div key={folder.id} style={{ position: "relative" }}>
                {renamingFolderId === folder.id ? (
                  <div style={{
                    padding: "14px", border: "1.5px solid var(--accent-deep)", borderRadius: 10,
                    background: "var(--surface)", display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <input
                      autoFocus
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFolder(folder.id);
                        if (e.key === "Escape") setRenamingFolderId(null);
                      }}
                      style={{
                        border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px",
                        fontSize: 13, outline: "none", background: "var(--surface-2)",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleRenameFolder(folder.id)} style={{ flex: 1, justifyContent: "center" }}>Save</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenamingFolderId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "14px", border: "1px solid var(--border)", borderRadius: 10,
                      background: "var(--surface)", cursor: "default",
                      transition: "border-color 0.12s, box-shadow 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-2)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}
                    >
                      <div
                        style={{ cursor: "default" }}
                        onClick={() => router.push(`/dashboard/files?folderId=${folder.id}`)}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: "var(--accent-soft)", color: "var(--accent-ink)",
                          display: "grid", placeItems: "center",
                        }}>
                          <Icon name="folder" size={18} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="file-action"
                        onClick={(e) => { e.stopPropagation(); setFolderMenuId(folderMenuId === folder.id ? null : folder.id); }}
                      >
                        <Icon name="more" size={14} />
                      </button>
                    </div>
                    <div
                      onClick={() => router.push(`/dashboard/files?folderId=${folder.id}`)}
                      style={{ cursor: "default" }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-strong)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {folder.name}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                        {folder.file_count ?? 0} files · {new Date(folder.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {folderMenuId === folder.id && (
                      <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 20,
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 8, minWidth: 140, boxShadow: "var(--shadow-md)", padding: "4px 0",
                      }}>
                        <button
                          type="button"
                          onClick={() => { setRenamingFolderId(folder.id); setRenameName(folder.name); setFolderMenuId(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", color: "var(--text-strong)", fontSize: 13, cursor: "default", textAlign: "left" }}
                        >
                          <Icon name="edit" size={13} /> Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFolder(folder.id)}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", color: "var(--danger)", fontSize: 13, cursor: "default", textAlign: "left" }}
                        >
                          <Icon name="trash" size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New folder button when there are no folders yet */}
      {folders.length === 0 && !newFolderMode && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { setNewFolderMode(true); setNewFolderName(""); }}
          >
            <Icon name="plus" size={12} /><span>New folder</span>
          </button>
        </div>
      )}

      {/* Files toolbar */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="toolbar-search">
          <span className="toolbar-search-icon"><Icon name="search" size={13} /></span>
          <input
            placeholder="Search files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {driveNames.length > 1 && (
          <select
            value={driveFilter}
            onChange={(e) => setDriveFilter(e.target.value)}
            title="Filter by drive"
            aria-label="Filter by drive"
            style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)", fontSize: 13 }}
          >
            <option value="">All drives</option>
            {driveNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
        <div style={{ flex: 1 }} />
        {drives.length > 0 && (
          <>
            <select
              value={uploadDriveId}
              onChange={(e) => setUploadDriveId(e.target.value)}
              title="Select upload drive"
              aria-label="Select upload drive"
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)", fontSize: 13 }}
            >
              {drives.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              type="file"
              ref={fileInputRef}
              aria-label="Upload file to NAS"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !uploadDriveId}
            >
              <Icon name="upload" size={13} /><span>{isUploading ? "Uploading…" : "Upload to NAS"}</span>
            </button>
          </>
        )}
      </div>

      {/* Files table */}
      <div className="file-table">
        <div
          className="file-table-hd"
          style={{ gridTemplateColumns: "1.6fr 0.8fr 80px 100px 130px 160px" }}
        >
          <div>Name</div>
          <div>Drive</div>
          <div>Versions</div>
          <div>Size</div>
          <div>Uploaded</div>
          <div />
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            {query || driveFilter ? "No files match your filters." : "No files in this folder."}
          </div>
        )}

        {filtered.map((g) => (
          <div
            key={g.rootId}
            className="file-row"
            style={{ gridTemplateColumns: "1.6fr 0.8fr 80px 100px 130px 160px", position: "relative" }}
          >
            <div className="file-name-cell">
              <div className={`file-thumb ${g.latest.mime_type?.startsWith("video") ? "video" : "doc"}`}>
                <Icon name={g.latest.mime_type?.startsWith("video") ? "film" : "doc"} size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="file-name">{g.filename}</div>
                <div className="file-sub mono">{g.latest.mime_type}</div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
              {g.drive_name ?? "—"}
            </div>
            <div style={{ alignSelf: "center" }}>
              <span className="file-version mono">
                v{g.latest.versionNumber}
                {g.all.length > 1 && (
                  <span style={{ color: "var(--text-faint)", marginLeft: 3 }}>/{g.all.length}</span>
                )}
              </span>
            </div>
            <div className="file-size mono">{formatBytes(g.latest.size)}</div>
            <div className="file-modified mono">{new Date(g.latest.uploaded_at).toLocaleDateString()}</div>
            <div className="file-actions" style={{ position: "relative" }}>
              <button
                type="button"
                className="file-action"
                title="Download"
                onClick={() => handleDownload(g.latest.id)}
              >
                <Icon name="download" size={14} />
              </button>
              {projects.length > 0 && (
                <button
                  type="button"
                  className="file-action"
                  title="Attach to project"
                  onClick={() => setAttachingRootId(attachingRootId === g.rootId ? null : g.rootId)}
                >
                  <Icon name="link" size={14} />
                </button>
              )}
              {attachingRootId === g.rootId && (
                <div style={{
                  position: "absolute", right: 0, top: "100%", zIndex: 20,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, minWidth: 180, boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                  padding: "6px 0",
                }}>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAttach(g.rootId, p.id)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "8px 14px", background: "none", border: "none",
                        color: "var(--text-strong)", fontSize: 13, cursor: "default",
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Close dropdowns on outside click */}
      {(attachingRootId || folderMenuId) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 19 }}
          onClick={() => { setAttachingRootId(null); setFolderMenuId(null); }}
        />
      )}
    </>
  );
}
