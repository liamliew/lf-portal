'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateAfterUpload(projectId?: string) {
  revalidatePath('/dashboard/files')
  revalidatePath('/dashboard')
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`)
  }
}
