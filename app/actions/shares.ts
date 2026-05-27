'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

async function verifyProjectOwnership(projectId: string, userId: string) {
  const { data } = await supabase.from('projects').select('id').eq('id', projectId).eq('created_by', userId).single()
  if (!data) throw new Error('Project not found or unauthorized')
}

export async function createShare(projectId: string, options: { password?: string, pin?: string, expiresAt?: string }) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  await verifyProjectOwnership(projectId, userId)

  const token = crypto.randomBytes(32).toString('hex')
  
  let password_hash = null
  if (options.password) {
    password_hash = await bcrypt.hash(options.password, 10)
  }

  let pin_hash = null
  if (options.pin) {
    pin_hash = await bcrypt.hash(options.pin, 10)
  }

  const { data, error } = await supabase
    .from('project_shares')
    .insert([{
      project_id: projectId,
      token,
      password_hash,
      pin: pin_hash,
      expires_at: options.expiresAt || null
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
    
  return { ...data, shareUrl: `/share/${token}` }
}

export async function getShares(projectId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  await verifyProjectOwnership(projectId, userId)

  const { data, error } = await supabase
    .from('project_shares')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function deleteShare(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: shareInfo } = await supabase
    .from('project_shares')
    .select('project_id')
    .eq('id', id)
    .single()

  if (!shareInfo) throw new Error('Share not found')
  await verifyProjectOwnership(shareInfo.project_id, userId)

  const { error } = await supabase.from('project_shares').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function validateShare(token: string, password?: string, pin?: string) {
  // Find share by token
  const { data: share, error: shareError } = await supabase
    .from('project_shares')
    .select('*, projects(*)')
    .eq('token', token)
    .single()

  if (shareError || !share) throw new Error('Invalid or expired share link')

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error('Share link has expired')
  }

  // Verify password hash if set
  if (share.password_hash) {
    if (!password) throw new Error('Password required')
    const isValid = await bcrypt.compare(password, share.password_hash)
    if (!isValid) throw new Error('Invalid password')
  }

  // Verify pin hash if set
  if (share.pin) {
    if (!pin) throw new Error('PIN required')
    const isValid = await bcrypt.compare(pin, share.pin)
    if (!isValid) throw new Error('Invalid PIN')
  }

  // Fetch files via project_file_refs -> files
  const { data: refs, error: filesError } = await supabase
    .from('project_file_refs')
    .select('files(*)')
    .eq('project_id', share.project_id)

  if (filesError) throw new Error('Failed to fetch project files')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFiles: any[] = (refs ?? []).map((r: any) => r.files).filter(Boolean)

  // Group by root (parent_id = null), assign version numbers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootMap = new Map<string, any>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childrenByRoot = new Map<string, any[]>()
  for (const f of rawFiles) {
    if (!f.parent_id) {
      rootMap.set(f.id, f)
    } else {
      const arr = childrenByRoot.get(f.parent_id) ?? []
      arr.push(f)
      childrenByRoot.set(f.parent_id, arr)
    }
  }

  const grouped: Record<string, unknown[]> = {}
  for (const [rootId, root] of rootMap) {
    const children = (childrenByRoot.get(rootId) ?? []).sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
    )
    const all = [
      { ...root, version: 1 },
      ...children.map((c, i) => ({ ...c, version: i + 2 })),
    ].sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
    grouped[root.filename] = all
  }

  return {
    project: share.projects,
    files: grouped,
    shareId: share.id
  }
}

