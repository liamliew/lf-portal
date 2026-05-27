"use client";

import { useState, useTransition } from "react";
import { Icon } from "./icon";
import { createShare } from "@/app/actions/shares";

interface ShareModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function SwitchRow({
  id,
  label,
  sub,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  sub: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <label htmlFor={id} style={{ flex: 1, cursor: "default" }}>
        <div className="toggle-row-text">{label}</div>
        <div className="toggle-row-sub">{sub}</div>
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        title={label}
        aria-checked={checked ? "true" : "false"}
        className={"toggle" + (checked ? " on" : "")}
        onClick={() => onCheckedChange(!checked)}
      />
    </div>
  );
}

export function ShareModal({ projectId, onClose, onSuccess }: ShareModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("14d");
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const handleCreate = async () => {
    startTransition(async () => {
      try {
        let expiresAt = null;
        if (expires !== "never") {
          const days = parseInt(expires);
          const d = new Date();
          d.setDate(d.getDate() + days);
          expiresAt = d.toISOString();
        }

        const res = await createShare(projectId, {
          password: usePassword && password ? password : undefined,
          pin: usePin && pin ? pin : undefined,
          expiresAt: expiresAt || undefined,
        });

        setShareUrl(res.shareUrl);
      } catch (err) {
        console.error(err);
        alert("Failed to create share link");
      }
    });
  };

  if (shareUrl) {
    return (
      <div className="modal-back" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-h">
            <h3>Share link created</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <div className="field">
              <label className="modal-field-label">Generated URL</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={window.location.origin + shareUrl}
                  readOnly
                  className="mono"
                  style={{ fontSize: 12, flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + shareUrl);
                    alert("Copied!");
                  }}
                >
                  <Icon name="copy" size={13} /><span>Copy</span>
                </button>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-primary" onClick={onSuccess}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Create share link</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="mono" style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Link name (internal)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Final Delivery"
            />
          </div>

          <div className="field">
            <label className="mono" style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Expires
            </label>
            <div className="tab-row" style={{ alignSelf: "flex-start" }}>
              {([["1d", "24 h"], ["7d", "7 days"], ["14d", "14 days"], ["30d", "30 days"], ["never", "Never"]] as const).map(([id, label]) => (
                <button type="button" key={id} className={expires === id ? "active" : ""} onClick={() => setExpires(id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "2px 0" }} />

          <div>
            <SwitchRow
              id="pin-switch"
              label="Require PIN"
              sub="Ask for a 4-6 digit PIN"
              checked={usePin}
              onCheckedChange={setUsePin}
            />
            {usePin && (
              <div className="field" style={{ marginTop: 8, paddingLeft: 12 }}>
                <input
                  type="text"
                  placeholder="Enter 4-6 digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                />
              </div>
            )}

            <SwitchRow
              id="password-switch"
              label="Require Password"
              sub="Ask for a text password"
              checked={usePassword}
              onCheckedChange={setUsePassword}
            />
            {usePassword && (
              <div className="field" style={{ marginTop: 8, paddingLeft: 12 }}>
                <input
                  type="text"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={isPending}>
            <Icon name="link" size={13} />
            <span>{isPending ? "Creating..." : "Create link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
