'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export type NASFolder = {
  id: string
  name: string
  parent_id: string | null
  created_by: string
  drive_id: string | null
  created_at: string
  file_count?: number
}

export async function getFolders(parentId?: string): Promise<NASFolder[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const query = supabase
    .from('nas_folders')
    .select('*')
    .eq('created_by', userId)
    .order('name')

  if (parentId) {
    query.eq('parent_id', parentId)
  } else {
    query.is('parent_id', null)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const folders = (data ?? []) as NASFolder[]

  // Attach file counts
  const folderIds = folders.map((f) => f.id)
  if (folderIds.length > 0) {
    const { data: fileCounts } = await supabase
      .from('files')
      .select('folder_id')
      .in('folder_id', folderIds)
      .is('parent_id', null)

    const countMap: Record<string, number> = {}
    for (const row of fileCounts ?? []) {
      if (row.folder_id) countMap[row.folder_id] = (countMap[row.folder_id] ?? 0) + 1
    }

    return folders.map((f) => ({ ...f, file_count: countMap[f.id] ?? 0 }))
  }

  return folders.map((f) => ({ ...f, file_count: 0 }))
}

export async function getFolderBreadcrumb(folderId: string): Promise<NASFolder[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  /*
   * Requires this function in Supabase (run once via SQL Editor):
   *
   * CREATE OR REPLACE FUNCTION get_folder_breadcrumb(folder_id UUID)
   * RETURNS TABLE(id UUID, name TEXT, parent_id UUID, created_by TEXT,
   *               drive_id UUID, created_at TIMESTAMPTZ, depth INT) AS $$
   * WITH RECURSIVE breadcrumb AS (
   *   SELECT id, name, parent_id, created_by, drive_id, created_at, 0 AS depth
   *   FROM nas_folders WHERE id = folder_id
   *   UNION ALL
   *   SELECT f.id, f.name, f.parent_id, f.created_by, f.drive_id, f.created_at, b.depth + 1
   *   FROM nas_folders f JOIN breadcrumb b ON f.id = b.parent_id
   * )
   * SELECT * FROM breadcrumb ORDER BY depth DESC;
   * $$ LANGUAGE sql STABLE;
   */
  const { data, error } = await supabase
    .rpc('get_folder_breadcrumb', { folder_id: folderId })

  if (error) {
    // Fall back to iterative approach if RPC not yet created
    const crumbs: NASFolder[] = []
    let currentId: string | null = folderId
    while (currentId) {
      const { data: row, error: rowErr } = await supabase
        .from('nas_folders')
        .select('*')
        .eq('id', currentId)
        .eq('created_by', userId)
        .returns<NASFolder>()
        .single()
      if (rowErr || !row) break
      const folder = row as NASFolder
      crumbs.unshift(folder)
      currentId = folder.parent_id ?? null
    }
    return crumbs
  }

  return ((data ?? []) as NASFolder[]).filter((f) => f.created_by === userId)
}

export async function createFolder(name: string, parentId?: string, driveId?: string): Promise<NASFolder> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  if (parentId) {
    const { data: parent } = await supabase
      .from('nas_folders')
      .select('id')
      .eq('id', parentId)
      .eq('created_by', userId)
      .single()
    if (!parent) throw new Error('Parent folder not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('nas_folders')
    .insert([{
      name: name.trim(),
      parent_id: parentId ?? null,
      created_by: userId,
      drive_id: driveId ?? null,
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/files')
  return data as NASFolder
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: folder } = await supabase
    .from('nas_folders')
    .select('id')
    .eq('id', id)
    .eq('created_by', userId)
    .single()
  if (!folder) throw new Error('Folder not found or unauthorized')

  const { error } = await supabase
    .from('nas_folders')
    .update({ name: name.trim() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/files')
}

export async function deleteFolder(id: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: folder } = await supabase
    .from('nas_folders')
    .select('id')
    .eq('id', id)
    .eq('created_by', userId)
    .single()
  if (!folder) throw new Error('Folder not found or unauthorized')

  // ON DELETE CASCADE handles subfolders; clear folder_id on files first
  await supabase.from('files').update({ folder_id: null }).eq('folder_id', id)

  const { error } = await supabase.from('nas_folders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/files')
}
