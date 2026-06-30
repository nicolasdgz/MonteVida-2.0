'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface SetPasswordState {
  error: string | null
}

export async function setNuevaContrasena(
  _prev: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const nuevaContrasena     = (formData.get('nueva_contrasena') as string) ?? ''
  const confirmarContrasena = (formData.get('confirmar_contrasena') as string) ?? ''

  if (nuevaContrasena.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (nuevaContrasena !== confirmarContrasena) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: nuevaContrasena })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('session') || msg.includes('token') || msg.includes('expired')) {
      return { error: 'Tu enlace de invitación ha expirado. Pedí al administrador que te reinvite.' }
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

  redirect('/')
}
