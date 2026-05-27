import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getDriveClient } from '@/lib/drives'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { fileId } = await params

  const { data: fileInfo } = await supabase
    .from('files')
    .select('storage_path, filename, drive_id, mime_type, uploaded_by')
    .eq('id', fileId)
    .single()

  if (!fileInfo) return new NextResponse('Not found', { status: 404 })

  // Auth: uploaded by this user OR in a project they own
  if (fileInfo.uploaded_by !== userId) {
    const { data: refs } = await supabase
      .from('project_file_refs')
      .select('project_id')
      .eq('file_id', fileId)

    const projectIds = (refs ?? []).map((r: { project_id: string }) => r.project_id)
    if (projectIds.length === 0) return new NextResponse('Forbidden', { status: 403 })

    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .in('id', projectIds)
    if (!count || count === 0) return new NextResponse('Forbidden', { status: 403 })
  }

  const { client, bucket } = await getDriveClient(fileInfo.drive_id)
  const s3Res = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: fileInfo.storage_path,
  }))

  if (!s3Res.Body) return new NextResponse('File not found in storage', { status: 404 })

  const stream = s3Res.Body.transformToWebStream()
  const safeFilename = fileInfo.filename.replace(/"/g, '\\"')
  const headers = new Headers({
    'Content-Type': fileInfo.mime_type || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${safeFilename}"`,
  })
  if (s3Res.ContentLength) headers.set('Content-Length', String(s3Res.ContentLength))

  return new NextResponse(stream, { headers })
}
