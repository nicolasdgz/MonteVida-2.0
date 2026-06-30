'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/dal'
import { uploadFile, getFileExt } from '@/lib/storage'
import type { UserRole, Profile } from '@/types/database'

interface ServiceResult<T = null> {
  data: T
  error: string | null
}

export async function actualizarConfiguracion(
  formData: FormData
): Promise<{ error: string | null }> {
  let supabase
  try {
    ({ supabase } = await requireAdmin())
  } catch (e) {
    return { error: (e as Error).message }
  }

  const nombreNegocio        = (formData.get('nombre_negocio') as string).trim()
  const igvPorcentaje        = parseFloat(formData.get('igv_porcentaje') as string)
  const emailNotificaciones  = ((formData.get('email_notificaciones') as string) ?? '').trim() || null
  const logoFile             = formData.get('logo')   as File | null
  const bannerFile           = formData.get('banner') as File | null

  if (!nombreNegocio) return { error: 'El nombre del negocio es obligatorio.' }
  if (isNaN(igvPorcentaje) || igvPorcentaje < 0 || igvPorcentaje > 100) {
    return { error: 'El porcentaje de IGV debe estar entre 0 y 100.' }
  }

  const { data: existing } = await supabase
    .from('configuracion').select('id').limit(1).single()
  const configId = (existing as { id: string } | null)?.id
  if (!configId) return { error: 'No se encontró la configuración.' }

  const { error } = await supabase
    .from('configuracion')
    .update({ nombre_negocio: nombreNegocio, igv_porcentaje: igvPorcentaje, email_notificaciones: emailNotificaciones })
    .eq('id', configId)

  if (error) return { error: error.message }

  if (logoFile && logoFile.size > 0) await uploadBranding('logo', logoFile, configId, supabase)
  if (bannerFile && bannerFile.size > 0) await uploadBranding('banner', bannerFile, configId, supabase)

  revalidatePath('/', 'layout')
  return { error: null }
}

async function uploadBranding(
  key: 'logo' | 'banner', file: File, configId: string, supabase: Awaited<ReturnType<typeof createAdminClient>>
) {
  try {
    const path = `${key}.${getFileExt(file.name)}`
    const { publicUrl, error } = await uploadFile('branding', path, file)
    if (error || !publicUrl) {
      console.error(`[configuracion] Error subiendo ${key}:`, error)
      return
    }
    const updateData = key === 'logo' ? { logo_url: publicUrl } : { banner_url: publicUrl }
    const { error: updateError } = await supabase.from('configuracion').update(updateData).eq('id', configId)
    if (updateError) {
      console.error(`[configuracion] Error guardando ${key}_url:`, updateError.message)
    }
  } catch (e) {
    console.error(`[configuracion] uploadBranding ${key}:`, e)
  }
}

export async function createUser(payload: {
  email: string
  password: string
  full_name: string
  role: UserRole
}): Promise<ServiceResult<{ id: string; email: string; full_name: string; role: UserRole } | null>> {
  try {
    await requireAdmin()
  } catch {
    return { data: null, error: 'Sin permisos para crear usuarios.' }
  }

  const adminClient = await createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { data: null, error: authError?.message ?? 'Error creando usuario.' }
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({ id: authData.user.id, full_name: payload.full_name, role: payload.role })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { data: null, error: 'Error creando perfil de usuario.' }
  }

  return {
    data: {
      id: authData.user.id,
      email: authData.user.email ?? payload.email,
      full_name: payload.full_name,
      role: payload.role,
    },
    error: null,
  }
}

export async function invitarUsuario(payload: {
  email: string
  full_name: string
  role: 'admin' | 'staff'
}): Promise<ServiceResult<{ id: string; email: string; full_name: string; role: UserRole } | null>> {
  try {
    await requireAdmin()
  } catch {
    return { data: null, error: 'Sin permisos para invitar usuarios.' }
  }

  const adminClient = await createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectTo = `${siteUrl}/auth/callback?next=/auth/nueva-contrasena`

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    payload.email.trim().toLowerCase(),
    { redirectTo }
  )

  if (inviteError || !inviteData?.user) {
    return { data: null, error: inviteError?.message ?? 'Error enviando invitación.' }
  }

  const userId = inviteData.user.id
  // Detecta si el usuario fue recién creado (últimos 10 s) para el rollback
  const isNewUser = new Date(inviteData.user.created_at).getTime() > Date.now() - 10_000

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({ id: userId, full_name: payload.full_name, role: payload.role })

  if (profileError) {
    if (isNewUser) await adminClient.auth.admin.deleteUser(userId)
    return { data: null, error: 'Este email ya tiene una cuenta en el sistema.' }
  }

  return {
    data: {
      id: userId,
      email: inviteData.user.email ?? payload.email,
      full_name: payload.full_name,
      role: payload.role,
    },
    error: null,
  }
}

export async function cambiarContrasena(
  actual: string,
  nueva: string
): Promise<{ error: string | null }> {
  if (nueva.length < 8) return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' }

  const supabase = await createClient()

  // Verificar contraseña actual reautenticando
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.email) return { error: 'No autenticado.' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: actual,
  })
  if (signInError) return { error: 'La contraseña actual es incorrecta.' }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) return { error: error.message }

  return { error: null }
}

export async function deleteUser(userId: string): Promise<ServiceResult> {
  const supabase = await createClient()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return { data: null, error: 'No autenticado.' }

  try {
    await requireAdmin()
  } catch {
    return { data: null, error: 'Sin permisos.' }
  }

  if (userId === caller.id) return { data: null, error: 'No puedes eliminar tu propia cuenta.' }

  const adminClient = await createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function listUsers(): Promise<
  ServiceResult<{ id: string; email: string; full_name: string; role: UserRole }[]>
> {
  try {
    await requireAdmin()
  } catch {
    return { data: [], error: 'Sin permisos.' }
  }

  const adminClient = await createAdminClient()
  const { data: authUsers, error } = await adminClient.auth.admin.listUsers()
  if (error) return { data: [], error: error.message }

  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('*')
  const profileMap = new Map(
    ((profiles as Profile[]) ?? []).map((p) => [p.id, p])
  )

  const users = authUsers.users
    .filter((u) => profileMap.has(u.id))
    .map((u) => {
      const p = profileMap.get(u.id)!
      return { id: u.id, email: u.email ?? '', full_name: p.full_name, role: p.role }
    })

  return { data: users, error: null }
}
