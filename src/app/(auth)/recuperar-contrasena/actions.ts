'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface RecuperarState {
  error: string | null
}

export async function actualizarContrasena(
  _prev: RecuperarState,
  formData: FormData
): Promise<RecuperarState> {
  const nueva     = (formData.get('nueva_contrasena') as string) ?? ''
  const confirmar = (formData.get('confirmar_contrasena') as string) ?? ''

  if (nueva.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (nueva !== confirmar) return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: nueva })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('session') || msg.includes('token') || msg.includes('expired')) {
      return { error: 'El enlace de recuperación ha expirado. Solicitá uno nuevo.' }
    }
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (profile as { role: string } | null)?.role
    if (role === 'admin' || role === 'staff') redirect('/ventas')
  }

  redirect('/iniciar-sesion?mensaje=contrasena_actualizada')
}

export async function solicitarRecuperacion(
  _prev: RecuperarState,
  formData: FormData
): Promise<RecuperarState> {
  const email = (formData.get('email') as string)?.trim() ?? ''
  if (!email) return { error: 'Ingresá tu correo electrónico.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.montevida.pe'}/recuperar-contrasena`,
  })

  if (error) return { error: error.message }

  // No revelar si el email existe — siempre retornar success
  return { error: null }
}
