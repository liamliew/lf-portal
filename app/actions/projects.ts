'use server'

import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function getProjects() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
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
  return data
}

export async function updateProject(id: string, name: string, description: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // verify ownership
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
  return true
}
