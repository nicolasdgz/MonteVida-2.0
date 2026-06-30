'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface ActionState {
  error: string | null
}

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Completa todos los campos.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos.' }
    }
    return { error: error.message }
  }

  // Redirigir según rol
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Error inesperado. Intentá de nuevo.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  const role = profile?.role
  if (role === 'admin' || role === 'staff') {
    redirect('/ventas')
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/iniciar-sesion')
}
