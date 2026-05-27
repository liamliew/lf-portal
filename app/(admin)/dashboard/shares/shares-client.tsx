"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { deleteShare } from "@/app/actions/shares";
import { useRouter } from "next/navigation";

interface ShareRow {
  id: string;
  token: string;
  password_hash: string | null;
  pin: string | null;
  expires_at: string | null;
  created_at: string;
  project_id: string;
  projects: { id: string; name: string };
}

export function AllSharesClient({ shares }: { shares: ShareRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const now = new Date();

  const isExpired = (s: ShareRow) =>
    !!s.expires_at && new Date(s.expires_at) < now;

  const handleRevoke = (id: string) => {
    if (!confirm("Revoke this share link? It will no longer be accessible.")) return;
    startTransition(async () => {
      try {
        await deleteShare(id);
        router.refresh();
      } catch {
        alert("Failed to revoke share link");
      }
    });
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const active = shares.filter((s) => !isExpired(s));
  const expired = shares.filter((s) => isExpired(s));

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Share links</h1>
          <div className="sub">{active.length} active · {expired.length} expired</div>
        </div>
      </div>

      <div className="file-table" style={{ opacity: isPending ? 0.7 : 1 }}>
        <div
          className="file-table-hd"
          style={{ gridTemplateColumns: "1.2fr 1.4fr 80px 80px 120px 120px 100px" }}
        >
          <div>Project</div>
          <div>Token URL</div>
          <div>Password</div>
          <div>PIN</div>
          <div>Expires</div>
          <div>Created</div>
          <div />
        </div>

        {shares.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            No share links created yet.
          </div>
        )}

        {shares.map((s) => {
          const expired = isExpired(s);
          return (
            <div
              key={s.id}
              className="file-row"
              style={{
                gridTemplateColumns: "1.2fr 1.4fr 80px 80px 120px 120px 100px",
                opacity: expired ? 0.5 : 1,
              }}
            >
              <div>
                <Link
                  href={`/dashboard/projects/${s.projects?.id}`}
                  style={{ fontWeight: 500, color: "var(--text-strong)", textDecoration: "none", fontSize: 13 }}
                >
                  {s.projects?.name}
                </Link>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 11, color: "var(--text-muted)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  /share/{s.token.slice(0, 16)}…
                </span>
                <button
                  type="button"
                  title="Copy link"
                  onClick={() => handleCopy(s.token)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: copied === s.token ? "var(--success)" : "var(--text-faint)",
                    padding: 0, flexShrink: 0, display: "flex",
                  }}
                >
                  <Icon name={copied === s.token ? "check" : "copy"} size={12} />
                </button>
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {s.password_hash ? "Yes" : "No"}
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {s.pin ? "Yes" : "No"}
              </div>
              <div
                className="mono"
                style={{ fontSize: 12, color: expired ? "var(--error)" : "var(--text-muted)" }}
              >
                {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "Never"}
                {expired && " (expired)"}
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {new Date(s.created_at).toLocaleDateString()}
              </div>
              <div className="file-actions">
                <button
                  type="button"
                  className="file-action"
                  title="Revoke"
                  onClick={() => handleRevoke(s.id)}
                  style={{ color: "var(--error)" }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
