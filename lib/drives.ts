import { S3Client } from '@aws-sdk/client-s3'
import { supabase } from './supabase'

export type Drive = {
  id: string
  name: string
  description: string
  minio_endpoint: string
  minio_access_key: string
  minio_secret_key: string
  minio_bucket: string
  pve_node: string
  status: string
  created_at: string
}

export async function getDriveClient(driveId: string) {
  const { data, error } = await supabase
    .from('drives')
    .select('*')
    .eq('id', driveId)
    .single()
  if (error || !data) throw new Error('Drive not found')

  const client = new S3Client({
    endpoint: data.minio_endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: data.minio_access_key,
      secretAccessKey: data.minio_secret_key,
    },
    forcePathStyle: true,
  })

  return { client, bucket: data.minio_bucket as string, drive: data as Drive }
}

export async function getActiveDrives(): Promise<Drive[]> {
  const { data, error } = await supabase
    .from('drives')
    .select('*')
    .eq('status', 'active')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as Drive[]
}
