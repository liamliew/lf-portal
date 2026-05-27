'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getDriveClient } from '@/lib/drives'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { revalidatePath } from 'next/cache'

export type NASFile = {
  id: string
  drive_id: string
  filename: string
  storage_path: string
  size: number
  mime_type: string
  parent_id: string | null
  uploaded_by: string
  uploaded_at: string
  drive_name?: string
  versionNumber: number
}

export type FileGroup = {
  rootId: string
  filename: string
  drive_name?: string
  latest: NASFile
  all: NASFile[]
}

type RawFile = {
  id: string
  drive_id: string
  filename: string
  storage_path: string
  size: number
  mime_type: string
  parent_id: string | null
  uploaded_by: string
  uploaded_at: string
  drive_name?: string
}

function buildGroups(rawFiles: RawFile[]): FileGroup[] {
  const roots = new Map<string, RawFile>()
  const childrenByRoot = new Map<string, RawFile[]>()

  for (const f of rawFiles) {
    if (f.parent_id === null) {
      roots.set(f.id, f)
    } else {
      const arr = childrenByRoot.get(f.parent_id) ?? []
      arr.push(f)
      childrenByRoot.set(f.parent_id, arr)
    }
  }

  const groups: FileGroup[] = []
  for (const [rootId, rootRaw] of roots) {
    const childrenRaw = (childrenByRoot.get(rootId) ?? []).sort(
      (a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
    )
    const root: NASFile = { ...rootRaw, versionNumber: 1 }
    const children: NASFile[] = childrenRaw.map((c, i) => ({ ...c, versionNumber: i + 2 }))
    const all = [root, ...children].sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
    groups.push({ rootId, filename: root.filename, drive_name: root.drive_name, latest: all[0], all })
  }

  return groups.sort((a, b) => a.filename.localeCompare(b.filename))
}

export async function getFilesForProject(projectId: string): Promise<FileGroup[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('created_by', userId).single()
  if (!project) throw new Error('Project not found or unauthorized')

  const { data, error } = await supabase
    .from('project_file_refs')
    .select('files(*, drives(name))')
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)

  const rawFiles: RawFile[] = (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.files ? { ...row.files, drive_name: row.files.drives?.name } : null)
    .filter(Boolean) as RawFile[]

  return buildGroups(rawFiles)
}

export async function getAllFiles(): Promise<FileGroup[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('files')
    .select('*, drives(name)')
    .eq('uploaded_by', userId)
    .order('uploaded_at', { ascending: false })

  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFiles: RawFile[] = (data ?? []).map((f: any) => ({ ...f, drive_name: f.drives?.name }))
  return buildGroups(rawFiles)
}

export async function uploadFileToProject(projectId: string, driveId: string, formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('created_by', userId).single()
  if (!project) throw new Error('Project not found or unauthorized')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')

  const filename = file.name
  const { client, bucket } = await getDriveClient(driveId)

  // Find root file with same filename already in this project
  const { data: refIds } = await supabase
    .from('project_file_refs')
    .select('file_id')
    .eq('project_id', projectId)

  const fileIds = (refIds ?? []).map((r: { file_id: string }) => r.file_id)

  let rootFileId: string | null = null
  let version = 1

  if (fileIds.length > 0) {
    const { data: roots } = await supabase
      .from('files')
      .select('id')
      .in('id', fileIds)
      .eq('filename', filename)
      .is('parent_id', null)
      .limit(1)

    if (roots && roots.length > 0) {
      rootFileId = roots[0].id
      const { count: childCount } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', rootFileId)
      version = (childCount ?? 0) + 2
    }
  }

  const storagePath = `${projectId}/${filename}_v${version}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: storagePath,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
    ContentLength: file.size,
  }))

  const { data: newFile, error: fileError } = await supabase
    .from('files')
    .insert([{
      drive_id: driveId,
      filename,
      storage_path: storagePath,
      size: file.size,
      mime_type: file.type || 'application/octet-stream',
      parent_id: rootFileId,
      uploaded_by: userId,
    }])
    .select()
    .single()

  if (fileError) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storagePath })).catch(() => {})
    throw new Error(fileError.message)
  }

  const { error: refError } = await supabase
    .from('project_file_refs')
    .insert([{ project_id: projectId, file_id: newFile.id, added_by: userId }])

  if (refError) {
    await supabase.from('files').delete().eq('id', newFile.id)
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storagePath })).catch(() => {})
    throw new Error(refError.message)
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/files')
  return newFile
}

export async function uploadFileToNAS(driveId: string, formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')

  const filename = file.name
  const { client, bucket } = await getDriveClient(driveId)

  // Find existing root with same filename in same drive by same user
  const { data: roots } = await supabase
    .from('files')
    .select('id')
    .eq('drive_id', driveId)
    .eq('filename', filename)
    .eq('uploaded_by', userId)
    .is('parent_id', null)
    .limit(1)

  let rootFileId: string | null = null
  let version = 1

  if (roots && roots.length > 0) {
    rootFileId = roots[0].id
    const { count: childCount } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', rootFileId)
    version = (childCount ?? 0) + 2
  }

  const storagePath = `nas/${filename}_v${version}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: storagePath,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
    ContentLength: file.size,
  }))

  const { data: newFile, error: fileError } = await supabase
    .from('files')
    .insert([{
      drive_id: driveId,
      filename,
      storage_path: storagePath,
      size: file.size,
      mime_type: file.type || 'application/octet-stream',
      parent_id: rootFileId,
      uploaded_by: userId,
    }])
    .select()
    .single()

  if (fileError) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storagePath })).catch(() => {})
    throw new Error(fileError.message)
  }

  revalidatePath('/dashboard/files')
  return newFile
}

export async function addExistingFileToProject(projectId: string, fileId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('created_by', userId).single()
  if (!project) throw new Error('Project not found or unauthorized')

  const { data: file } = await supabase
    .from('files').select('id').eq('id', fileId).eq('uploaded_by', userId).single()
  if (!file) throw new Error('File not found or unauthorized')

  const { error } = await supabase
    .from('project_file_refs')
    .insert([{ project_id: projectId, file_id: fileId, added_by: userId }])
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/projects/${projectId}`)
  return true
}

export async function deleteFile(fileId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: fileInfo } = await supabase
    .from('files')
    .select('storage_path, drive_id')
    .eq('id', fileId)
    .eq('uploaded_by', userId)
    .single()
  if (!fileInfo) throw new Error('File not found or unauthorized')

  const { client, bucket } = await getDriveClient(fileInfo.drive_id)
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileInfo.storage_path }))

  const { error } = await supabase.from('files').delete().eq('id', fileId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/files')
  revalidatePath('/dashboard')
  return true
}

