"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { validateShare } from "@/app/actions/shares";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type ShareData = {
  project: { name: string; created_by: string };
  files: Record<string, { id: string; filename: string; mime_type?: string; version: number; size: number; uploaded_at: string }[]>;
};

export function ShareClient({ token, initialData, requiresPassword, requiresPin, createdByName }: { token: string; initialData: ShareData | null; requiresPassword: boolean; requiresPin: boolean; createdByName: string }) {
  const [data, setData] = useState(initialData);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await validateShare(token, password || undefined, pin || undefined);
      setData(result as ShareData);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (fileId: string) => {
    window.open(`/api/share-download/${token}/${fileId}`, "_blank");
  };

  if (!data) {
    return (
      <div className="client-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="client-card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="client-mark" style={{ margin: "0 auto 16px" }}>LF</div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Authentication Required</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
              This link is protected. Please enter the required credentials.
            </p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {requiresPassword && (
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)" }}
                  required
                />
              </div>
            )}
            {requiresPin && (
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500 }}>PIN</label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-strong)", letterSpacing: 2 }}
                  maxLength={6}
                  required
                />
              </div>
            )}
            {error && <div style={{ color: "var(--error)", fontSize: 12, textAlign: "center" }}>{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: "12px" }} disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Files"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { project, files } = data;
  const fileNames = Object.keys(files);
  const totalFiles = fileNames.length;
  
  // Calculate total size using the selected or latest version
  const totalSizeBytes = fileNames.reduce((acc, name) => {
    const group = files[name];
    const selectedFileId = selectedVersions[name] || group[0].id;
    const file = group.find((f: { id: string; size: number; }) => f.id === selectedFileId) || group[0];
    return acc + Number(file.size || 0);
  }, 0);

  return (
    <div className="client-shell">
      <div className="client-card">
        {/* Header */}
        <div className="client-h">
          <div className="client-h-l">
            <div className="client-h-cover" style={{ background: `linear-gradient(135deg, #333 0%, #111 100%)` }} />
            <div>
              <div className="client-h-code mono">PROJ · FINAL DELIVERY</div>
              <h1 className="client-h-name">{project.name}</h1>
              <div className="client-h-from">Shared by {createdByName}</div>
            </div>
          </div>
          <div className="client-h-r">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {(requiresPassword || requiresPin) && (
                <div className="hstack mono" style={{ fontSize: 11, color: "var(--success)" }}>
                  <Icon name="lock" size={12} /> <span>Protected · verified</span>
                </div>
              )}
            </div>
            <div className="client-mark">LF</div>
          </div>
        </div>

        {/* Banner */}
        <div style={{
          padding: "16px 32px",
          background: "var(--accent-soft)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 13,
        }}>
          <Icon name="film" size={16} style={{ color: "var(--accent-ink)" }} />
          <div style={{ flex: 1 }}>
            <b style={{ color: "var(--text-strong)" }}>{project.name}</b>{" "}
            <span className="muted">
              {totalFiles} files. Latest versions are pre-selected.
            </span>
          </div>
        </div>

        {/* Files */}
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--text-strong)" }}>
              Files in this delivery
            </h3>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {totalFiles} ITEMS · {formatBytes(totalSizeBytes)}
            </span>
          </div>

          <div className="file-table">
            <div className="file-table-hd" style={{ gridTemplateColumns: "1.6fr 90px 110px 140px 120px" }}>
              <div>Name</div>
              <div>Version</div>
              <div>Size</div>
              <div>Modified</div>
              <div />
            </div>
            {totalFiles === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                No files found in this share link.
              </div>
            )}
            {fileNames.map((name) => {
              const group = files[name];
              const selectedFileId = selectedVersions[name] || group[0].id;
              const f = group.find((file: { id: string; mime_type?: string; filename: string; uploaded_at: string; size: number; version: number }) => file.id === selectedFileId) || group[0];

              return (
                <div key={name} className="file-row" style={{ gridTemplateColumns: "1.6fr 90px 110px 140px 120px" }}>
                  <div className="file-name-cell">
                    <div className={`file-thumb ${f.mime_type?.startsWith('video') ? 'video' : 'doc'}`}>
                      <Icon name={f.mime_type?.startsWith('video') ? 'film' : 'doc'} size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="file-name">{f.filename}</div>
                      <div className="file-sub mono">
                        {f.mime_type}
                      </div>
                    </div>
                  </div>
                  <div>
                    {group.length > 1 ? (
                      <select 
                        value={f.id} 
                        onChange={(e) => setSelectedVersions({ ...selectedVersions, [name]: e.target.value })}
                        style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 4px", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-strong)" }}
                      >
                        {group.map((v: { id: string; version: number; }) => (
                          <option key={v.id} value={v.id}>v{v.version} {v.id === group[0].id ? "(latest)" : ""}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={"file-version mono final"}>v{f.version}</span>
                    )}
                  </div>
                  <div className="file-size mono">{formatBytes(f.size)}</div>
                  <div className="file-modified mono">{new Date(f.uploaded_at).toLocaleDateString()}</div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleDownload(f.id)}>
                      <Icon name="download" size={12} /><span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 20,
            padding: "16px 18px",
            border: "1px dashed var(--border-2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 13,
            color: "var(--text-muted)",
          }}>
            <Icon name="message" size={16} style={{ color: "var(--accent-ink)" }} />
            <span>Notes for the team? Add comments directly on each file — Liam will be notified.</span>
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }}>Leave a note</button>
          </div>
        </div>

        <div style={{
          padding: "16px 28px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11.5,
          color: "var(--text-faint)",
          background: "var(--surface-2)",
        }}>
          <span className="mono">LFCREATIVE.STUDIO/S/{token.slice(0, 8).toUpperCase()}...</span>
          <span>Powered by LF Portal</span>
        </div>
      </div>
    </div>
  );
}
