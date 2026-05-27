"use client";

import { useState, useRef, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  uploadFileToNAS,
  addExistingFileToProject,
  type FileGroup,
} from "@/app/actions/files";
import { type Drive } from "@/lib/drives";
import { useRouter } from "next/navigation";

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
}

export function AllFilesClient({ groups, drives, projects }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [driveFilter, setDriveFilter] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDriveId, setUploadDriveId] = useState(drives[0]?.id ?? "");
  const [attachingRootId, setAttachingRootId] = useState<string | null>(null);
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
      await uploadFileToNAS(uploadDriveId, formData);
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

  return (
    <>
      <div className="page-h">
        <div>
          <h1>All files</h1>
          <div className="sub">{groups.length} files · NAS</div>
        </div>
      </div>

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
            {query || driveFilter ? "No files match your filters." : "No files uploaded yet."}
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
                        color: "var(--text-strong)", fontSize: 13, cursor: "pointer",
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

      {/* Close attach dropdown on outside click */}
      {attachingRootId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 19 }}
          onClick={() => setAttachingRootId(null)}
        />
      )}
    </>
  );
}
