'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function getDrives() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data: drives, error } = await supabase
    .from('drives')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw new Error(error.message)

  const { data: fileSummary } = await supabase
    .from('files')
    .select('drive_id, size')

  const statsByDrive: Record<string, { count: number; totalSize: number }> = {}
  for (const f of fileSummary ?? []) {
    if (!statsByDrive[f.drive_id]) statsByDrive[f.drive_id] = { count: 0, totalSize: 0 }
    statsByDrive[f.drive_id].count++
    statsByDrive[f.drive_id].totalSize += Number(f.size ?? 0)
  }

  return (drives ?? []).map((d) => ({
    ...d,
    fileCount: statsByDrive[d.id]?.count ?? 0,
    totalSize: statsByDrive[d.id]?.totalSize ?? 0,
  }))
}

export async function getDrive(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('drives').select('*').eq('id', id).single()
  if (error || !data) throw new Error('Drive not found')
  return data
}
