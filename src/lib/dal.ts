import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Configuracion } from '@/types/database'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/iniciar-sesion')
  return user
})

export const getProfile = cache(async () => {
  const user = await verifySession()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) {
    console.error('[dal] getProfile:', error.message)
    return null
  }
  return data as Profile | null
})

export async function requireAdmin() {
  const user = await verifySession()
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (error || (data as { role: string } | null)?.role !== 'admin') {
    throw new Error('Sin permiso de administrador.')
  }
  return { user, supabase }
}

export const getConfiguracion = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .limit(1)
    .single()
  if (error) {
    console.error('[dal] getConfiguracion:', error.message)
    return null
  }
  return data as Configuracion | null
})
