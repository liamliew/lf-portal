'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export type SearchResults = {
  projects: { id: string; name: string; description: string | null }[]
  files: { id: string; filename: string; drive_name: string | null; mime_type: string }[]
  shares: { id: string; token: string; project_id: string; project_name: string | null }[]
}

export async function search(query: string): Promise<SearchResults> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const q = query.trim()
  if (!q) return { projects: [], files: [], shares: [] }

  const pattern = `%${q}%`

  const [projectsResult, filesResult, sharesResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description')
      .eq('created_by', userId)
      .ilike('name', pattern)
      .limit(5),

    supabase
      .from('files')
      .select('id, filename, mime_type, drives(name)')
      .eq('uploaded_by', userId)
      .is('parent_id', null)
      .ilike('filename', pattern)
      .limit(5),

    supabase
      .from('project_shares')
      .select('id, token, project_id, projects!inner(name, created_by)')
      .eq('projects.created_by', userId)
      .ilike('token', pattern)
      .limit(5),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = (filesResult.data ?? []).map((f: any) => ({
    id: f.id as string,
    filename: f.filename as string,
    mime_type: f.mime_type as string,
    drive_name: (f.drives?.name as string | null) ?? null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shares = (sharesResult.data ?? []).map((s: any) => ({
    id: s.id as string,
    token: s.token as string,
    project_id: s.project_id as string,
    project_name: (s.projects?.name as string | null) ?? null,
  }))

  return {
    projects: (projectsResult.data ?? []) as SearchResults['projects'],
    files,
    shares,
  }
}
