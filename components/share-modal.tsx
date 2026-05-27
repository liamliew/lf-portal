"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Icon } from "./icon";
import { createShare } from "@/app/actions/shares";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareModalProps {
  projectId: string;
  open: boolean;
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
        aria-checked={checked}
        className={"toggle" + (checked ? " on" : "")}
        onClick={() => onCheckedChange(!checked)}
      />
    </div>
  );
}

export function ShareModal({ projectId, open, onClose, onSuccess }: ShareModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("14d");
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!open) {
      setShareUrl("");
      setName("");
      setPassword("");
      setPin("");
      setUsePin(false);
      setUsePassword(false);
      setExpires("14d");
    }
  }, [open]);

  const handleCreate = () => {
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
        toast.error(err instanceof Error ? err.message : "Failed to create share link");
      }
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + shareUrl);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent style={{ maxWidth: 480 }}>
        {shareUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Share link created</DialogTitle>
            </DialogHeader>
            <div className="field" style={{ padding: "8px 0" }}>
              <label className="modal-field-label">Generated URL</label>
              <div style={{ display: "flex", gap: 6 }}>
                <Input
                  value={window.location.origin + shareUrl}
                  readOnly
                  className="mono"
                  style={{ fontSize: 12 }}
                />
                <Button type="button" variant="outline" size="sm" onClick={copyUrl}>
                  <Icon name="copy" size={13} /><span>Copy</span>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onSuccess}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create share link</DialogTitle>
            </DialogHeader>

            <div className="modal-body" style={{ padding: "4px 0" }}>
              <div className="field">
                <label className="mono" style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Link name (internal)
                </label>
                <Input
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
                  {([ ["1d","24 h"],["7d","7 days"],["14d","14 days"],["30d","30 days"],["never","Never"] ] as const).map(([id, label]) => (
                    <button type="button" key={id} className={expires === id ? "active" : ""} onClick={() => setExpires(id)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", margin: "2px 0" }} />

              <div>
                <SwitchRow id="pin-switch" label="Require PIN" sub="Ask for a 4-6 digit PIN" checked={usePin} onCheckedChange={setUsePin} />
                {usePin && (
                  <div className="field" style={{ marginTop: 8, paddingLeft: 12 }}>
                    <Input type="text" placeholder="Enter 4-6 digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} />
                  </div>
                )}
                <SwitchRow id="password-switch" label="Require Password" sub="Ask for a text password" checked={usePassword} onCheckedChange={setUsePassword} />
                {usePassword && (
                  <div className="field" style={{ marginTop: 8, paddingLeft: 12 }}>
                    <Input type="text" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isPending}>
                <Icon name="link" size={13} />
                <span>{isPending ? "Creating…" : "Create link"}</span>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
