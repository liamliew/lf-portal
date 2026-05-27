'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useUpload, type UploadItem } from '@/hooks/use-upload'
import { UploadPanel } from '@/components/upload-panel'

interface UploadContextValue {
  uploads: UploadItem[]
  addUpload: (file: File, driveId: string, projectId?: string, folderId?: string) => void
  dismissUpload: (id: string) => void
  clearCompleted: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function UploadProvider({ children }: { children: ReactNode }) {
  const state = useUpload()
  return (
    <UploadContext.Provider value={state}>
      {children}
      <UploadPanel />
    </UploadContext.Provider>
  )
}

export function useUploadContext() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUploadContext must be used within UploadProvider')
  return ctx
}
