"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ShareModal } from "@/components/share-modal";
import type { NASFile } from "@/app/actions/files";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface FileDetailClientProps {
  file: NASFile;
  project: { id: string; name: string };
  versions: NASFile[];
}

export function FileDetailClient({ file, project, versions }: FileDetailClientProps) {
  const [currentId, setCurrentId] = useState(file.id);
  const [playing, setPlaying] = useState(false);
  const [openShare, setOpenShare] = useState(false);

  const current = versions.find((v) => v.id === currentId) ?? versions[0];

  const handleDownload = () => {
    window.open(`/api/download/${current.id}`, "_blank");
  };

  return (
    <div className="content">
      <div className="content-narrow">
        <div className="page-h" style={{ marginBottom: 16 }}>
          <div>
            <div className="proj-hd-code mono" style={{ marginBottom: 6 }}>
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="btn btn-ghost btn-sm"
                style={{ padding: 0, height: "auto", color: "var(--text-muted)", textDecoration: "none" }}
              >
                <Icon name="chevron_left" size={13} /><span>{project.name}</span>
              </Link>
              <span>·</span>
              <span>FILE</span>
            </div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-strong)", wordBreak: "break-all" }}>
              {current.filename}
            </h1>
            <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
              <span className="file-version mono">v{current.versionNumber}</span>
              <span className="faint">·</span>
              <span className="muted mono" style={{ fontSize: 12 }}>{new Date(current.uploaded_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="page-h-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setOpenShare(true)}>
              <Icon name="link" size={14} /><span>Share</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={handleDownload}>
              <Icon name="download" size={14} /><span>Download v{current.versionNumber}</span>
            </button>
          </div>
        </div>

        <div className="fd-layout">
          <div className="fd-preview">
            <div className="fd-preview-canvas">
              <div className="fd-poster" />
              <button type="button" className="fd-play" title={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)}>
                <Icon name={playing ? "pause" : "play"} size={28} />
              </button>
            </div>
            <div className="fd-toolbar">
              <button type="button" className="fd-tool-btn" onClick={() => setPlaying(!playing)}>
                <Icon name={playing ? "pause" : "play"} size={14} />
              </button>
              <span className="time mono">00:00 / 00:00</span>
              <div className="fd-scrub">
                <div className="fd-scrub-fill" />
                <div className="fd-scrub-thumb" />
              </div>
              <button type="button" className="fd-tool-btn" title="Volume"><Icon name="volume" size={14} /></button>
              <button type="button" className="fd-tool-btn" title="Fullscreen"><Icon name="maximize" size={14} /></button>
            </div>
          </div>

          <div className="fd-rail">
            <div className="fd-info">
              <h3 className="fd-info-name">{current.filename}</h3>
              <div className="fd-info-sub mono">PROJECT · {project.name.toUpperCase()}</div>

              <div className="fd-side-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload}>
                  <Icon name="download" size={12} /><span>Download</span>
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpenShare(true)}>
                  <Icon name="link" size={12} /><span>Share</span>
                </button>
              </div>

              <dl className="fd-info-table">
                <div><dt>Size</dt><dd className="mono">{formatBytes(current.size)}</dd></div>
                <div><dt>Type</dt><dd className="mono">{current.mime_type}</dd></div>
                <div><dt>Version</dt><dd className="mono">v{current.versionNumber}</dd></div>
                <div><dt>Uploaded</dt><dd>{new Date(current.uploaded_at).toLocaleDateString()}</dd></div>
              </dl>
            </div>

            <div className="version-list">
              <div className="card-hd">
                <h3>Version history</h3>
                <span className="card-hd-meta">{versions.length} VERSIONS</span>
              </div>
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className={"version-item" + (ver.id === currentId ? " current" : "")}
                  onClick={() => setCurrentId(ver.id)}
                >
                  <div className="version-dot" />
                  <div className="version-line" />
                  <div style={{ minWidth: 0 }}>
                    <div className="hstack" style={{ gap: 8 }}>
                      <span className="version-tag mono">v{ver.versionNumber}</span>
                      {ver.id === versions[0].id && (
                        <span className="chip chip-success" style={{ height: 18, padding: "0 6px", fontSize: 9.5 }}>
                          LATEST
                        </span>
                      )}
                    </div>
                    <div className="version-meta mono">{new Date(ver.uploaded_at).toLocaleString()}</div>
                  </div>
                  <div className="version-size mono">{formatBytes(ver.size)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        open={openShare}
        projectId={project.id}
        onClose={() => setOpenShare(false)}
        onSuccess={() => setOpenShare(false)}
      />
    </div>
  );
}
