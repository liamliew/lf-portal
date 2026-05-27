'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { revalidateAfterUpload } from '@/app/actions/revalidate'

export interface UploadItem {
  id: string
  filename: string
  filesize: number
  progress: number
  speed: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
  startedAt: number
}

export function useUpload() {
  const { getToken } = useAuth()
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const addUpload = useCallback(
    async (file: File, driveId: string, projectId?: string, folderId?: string) => {
      const id = crypto.randomUUID()
      const startedAt = Date.now()

      setUploads((prev) => [
        ...prev,
        { id, filename: file.name, filesize: file.size, progress: 0, speed: 0, status: 'uploading', startedAt },
      ])

      try {
        const token = await getToken()
        const formData = new FormData()
        formData.append('file', file)
        formData.append('driveId', driveId)
        if (projectId) formData.append('projectId', projectId)
        if (folderId) formData.append('folderId', folderId)

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (e) => {
            if (!e.lengthComputable) return
            const progress = (e.loaded / e.total) * 100
            const elapsed = Date.now() - startedAt
            const speed = elapsed > 0 ? (e.loaded / elapsed) * 1000 : 0
            updateUpload(id, { progress, speed })
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              updateUpload(id, { status: 'complete', progress: 100, speed: 0 })
              resolve()
            } else {
              let msg = 'Upload failed'
              try {
                const body = JSON.parse(xhr.responseText) as { error?: string }
                if (body.error) msg = body.error
              } catch { /* empty */ }
              updateUpload(id, { status: 'error', error: msg })
              reject(new Error(msg))
            }
          })

          xhr.addEventListener('error', () => {
            updateUpload(id, { status: 'error', error: 'Network error' })
            reject(new Error('Network error'))
          })

          xhr.addEventListener('abort', () => {
            updateUpload(id, { status: 'error', error: 'Upload cancelled' })
            reject(new Error('Upload cancelled'))
          })

          xhr.open('POST', '/api/upload')
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.send(formData)
        })

        await revalidateAfterUpload(projectId)
      } catch {
        // Status already set by XHR event handlers above
      }
    },
    [getToken, updateUpload],
  )

  const dismissUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === 'uploading'))
  }, [])

  return { uploads, addUpload, dismissUpload, clearCompleted }
}
