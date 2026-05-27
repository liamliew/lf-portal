import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getDriveClient } from '@/lib/drives'
import { Upload } from '@aws-sdk/lib-storage'

const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024 // 50 GB

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const driveId = formData.get('driveId') as string | null
  const projectId = formData.get('projectId') as string | null
  const folderId = formData.get('folderId') as string | null

  if (!file || !driveId) {
    return NextResponse.json({ error: 'Missing required fields: file and driveId' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds the 50 GB limit' }, { status: 413 })
  }

  const filename = file.name

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('created_by', userId)
      .single()
    if (!project) return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
  }

  let driveClient: Awaited<ReturnType<typeof getDriveClient>>
  try {
    driveClient = await getDriveClient(driveId)
  } catch {
    return NextResponse.json({ error: 'Drive not found' }, { status: 404 })
  }
  const { client, bucket } = driveClient

  // Determine version and root file
  let rootFileId: string | null = null
  let version = 1

  if (projectId) {
    const { data: refIds } = await supabase
      .from('project_file_refs')
      .select('file_id')
      .eq('project_id', projectId)

    const fileIds = (refIds ?? []).map((r: { file_id: string }) => r.file_id)

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
        const { count } = await supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('parent_id', rootFileId)
        version = (count ?? 0) + 2
      }
    }
  } else {
    const { data: roots } = await supabase
      .from('files')
      .select('id')
      .eq('drive_id', driveId)
      .eq('filename', filename)
      .eq('uploaded_by', userId)
      .is('parent_id', null)
      .limit(1)

    if (roots && roots.length > 0) {
      rootFileId = roots[0].id
      const { count } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', rootFileId)
      version = (count ?? 0) + 2
    }
  }

  const storagePath = projectId
    ? `${projectId}/${filename}_v${version}`
    : `nas/${filename}_v${version}`

  try {
    const upload = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: storagePath,
        Body: file.stream() as unknown as ReadableStream,
        ContentType: file.type || 'application/octet-stream',
        ContentLength: file.size,
      },
      queueSize: 4,
      partSize: 10 * 1024 * 1024,
    })
    await upload.done()
  } catch {
    return NextResponse.json({ error: 'Upload to storage failed' }, { status: 500 })
  }

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
      folder_id: folderId ?? null,
    }])
    .select()
    .single()

  if (fileError || !newFile) {
    return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
  }

  if (projectId) {
    const { error: refError } = await supabase
      .from('project_file_refs')
      .insert([{ project_id: projectId, file_id: newFile.id, added_by: userId }])

    if (refError) {
      await supabase.from('files').delete().eq('id', newFile.id)
      return NextResponse.json({ error: 'Failed to link file to project' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, file: newFile })
}
