import { type NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDriveClient } from '@/lib/drives'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import bcrypt from 'bcryptjs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> },
) {
  const { token, fileId } = await params

  const { data: share } = await supabase
    .from('project_shares')
    .select('project_id, expires_at, password_hash, pin')
    .eq('token', token)
    .single()

  if (!share) return new NextResponse('Invalid share link', { status: 404 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return new NextResponse('Share link has expired', { status: 410 })
  }

  // Enforce password/PIN protection
  if (share.password_hash) {
    const supplied = req.headers.get('X-Share-Password') ?? ''
    const ok = supplied && await bcrypt.compare(supplied, share.password_hash)
    if (!ok) return NextResponse.json({ error: 'Invalid password or PIN' }, { status: 401 })
  }
  if (share.pin) {
    const supplied = req.headers.get('X-Share-Pin') ?? ''
    const ok = supplied && await bcrypt.compare(supplied, share.pin)
    if (!ok) return NextResponse.json({ error: 'Invalid password or PIN' }, { status: 401 })
  }

  // Verify file belongs to this share's project
  const { data: refs } = await supabase
    .from('project_file_refs')
    .select('project_id')
    .eq('file_id', fileId)
    .eq('project_id', share.project_id)
    .limit(1)

  if (!refs || refs.length === 0) return new NextResponse('File not found', { status: 404 })

  const { data: fileInfo } = await supabase
    .from('files')
    .select('storage_path, filename, drive_id, mime_type')
    .eq('id', fileId)
    .single()

  if (!fileInfo) return new NextResponse('File not found', { status: 404 })

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
