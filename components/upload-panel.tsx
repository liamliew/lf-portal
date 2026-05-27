'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUploadContext } from '@/contexts/upload-context'
import { type UploadItem } from '@/hooks/use-upload'
import { Progress } from '@/components/ui/progress'
import { Icon } from '@/components/icon'
import { formatFileSize, formatSpeed } from '@/lib/format'

function UploadRow({ item, onDismiss }: { item: UploadItem; onDismiss: (id: string) => void }) {
  const truncated = item.filename.length > 30 ? item.filename.slice(0, 27) + '…' : item.filename

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {truncated}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {formatFileSize(item.filesize)}
            {item.status === 'uploading' && item.speed > 0 && ` · ${formatSpeed(item.speed)}`}
          </div>
        </div>
        {item.status !== 'uploading' && (
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'default', padding: 2, display: 'flex', alignItems: 'center' }}
            title="Dismiss"
          >
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      {item.status === 'uploading' && (
        <Progress value={item.progress} style={{ height: 4 }} />
      )}
      {item.status === 'complete' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--success)' }}>
          <Icon name="check" size={11} />
          <span>Complete</span>
        </div>
      )}
      {item.status === 'error' && (
        <div style={{ fontSize: 11, color: 'var(--danger)' }}>
          {item.error ?? 'Upload failed'}
        </div>
      )}
    </div>
  )
}

export function UploadPanel() {
  const { uploads, dismissUpload, clearCompleted } = useUploadContext()
  const router = useRouter()
  const [minimized, setMinimized] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeCount = uploads.filter((u) => u.status === 'uploading').length
  const allDone = uploads.length > 0 && activeCount === 0

  // Refresh page when uploads complete so file lists update
  const prevActiveRef = useRef(activeCount)
  useEffect(() => {
    if (prevActiveRef.current > 0 && activeCount === 0 && uploads.length > 0) {
      router.refresh()
    }
    prevActiveRef.current = activeCount
  }, [activeCount, uploads.length, router])

  // Auto-dismiss panel 5 s after all uploads finish
  useEffect(() => {
    if (allDone) {
      dismissTimer.current = setTimeout(() => clearCompleted(), 5000)
    } else {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [allDone, clearCompleted])

  if (uploads.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: 300,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: minimized ? 'none' : '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-strong)', flex: 1 }}>
          Uploads
        </span>
        {activeCount > 0 && (
          <span
            style={{
              background: 'var(--accent-deep)',
              color: 'var(--sidebar-primary-foreground)',
              borderRadius: 10,
              padding: '1px 7px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              marginRight: 8,
            }}
          >
            {activeCount}
          </span>
        )}
        <button
          type="button"
          onClick={() => setMinimized((v) => !v)}
          style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'default', padding: 2, display: 'flex', alignItems: 'center' }}
          title={minimized ? 'Expand' : 'Minimize'}
        >
          <Icon name={minimized ? 'chevron_up' : 'chevron_down'} size={14} />
        </button>
      </div>

      {!minimized && (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {uploads.map((item) => (
            <UploadRow key={item.id} item={item} onDismiss={dismissUpload} />
          ))}
        </div>
      )}
    </div>
  )
}
