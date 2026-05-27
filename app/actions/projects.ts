'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export type ProjectWithStats = {
  id: string
  name: string
  description?: string | null
  created_by: string
  created_at: string
  fileCount: number
  totalSize: number
  activeLinks: number
}

export async function getProjects(opts?: { limit?: number; offset?: number }): Promise<{ projects: ProjectWithStats[]; total: number }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const limit = opts?.limit
  const offset = opts?.offset ?? 0

  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
  const total = count ?? 0

  const query = supabase
    .from('projects')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (limit !== undefined) {
    query.range(offset, offset + limit - 1)
  }

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)
  if (!rows || rows.length === 0) return { projects: [], total }

  const projectIds = rows.map((p: { id: string }) => p.id)
  const fallbackId = '00000000-0000-0000-0000-000000000000'
  const ids = projectIds.length > 0 ? projectIds : [fallbackId]

  const [{ data: fileStats }, { data: shareStats }] = await Promise.all([
    supabase.from('project_file_refs').select('project_id, files(size)').in('project_id', ids),
    supabase.from('project_shares').select('project_id, expires_at').in('project_id', ids),
  ])

  const now = new Date()
  const projects: ProjectWithStats[] = rows.map((p: { id: string; name: string; description?: string | null; created_by: string; created_at: string }) => {
    const pFiles = (fileStats ?? []).filter((f: { project_id: string }) => f.project_id === p.id)
    const pShares = (shareStats ?? []).filter((s: { project_id: string }) => s.project_id === p.id)
    const activeLinks = pShares.filter((s: { expires_at: string | null }) => !s.expires_at || new Date(s.expires_at) > now).length
    const totalSize = pFiles.reduce((acc: number, f: { files: { size: number }[] | { size: number } | null }) => {
      const size = Array.isArray(f.files) ? (f.files[0]?.size ?? 0) : (f.files?.size ?? 0)
      return acc + Number(size)
    }, 0)
    return { ...p, fileCount: pFiles.length, totalSize, activeLinks }
  })

  return { projects, total }
}

export async function createProject(name: string, description: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, description, created_by: userId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  return data
}

export async function updateProject(id: string, name: string, description: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: project } = await supabase.from('projects').select('id').eq('id', id).eq('created_by', userId).single()
  if (!project) throw new Error('Not found or unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteProject(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: project } = await supabase.from('projects').select('id').eq('id', id).eq('created_by', userId).single()
  if (!project) throw new Error('Not found or unauthorized')

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard')
  return true
}
