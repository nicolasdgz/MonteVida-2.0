'use server'

import { redirect } from 'next/navigation'
import { createClient, createAuthClient } from '@/lib/supabase/server'

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

  // Auth sin PKCE — @supabase/ssr 0.10.x fuerza PKCE que requiere redirect URL
  // no disponible en Server Actions, lo que causa "Invalid path in request URL".
  const authClient = createAuthClient()
  const { data: { session }, error } = await authClient.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos.' }
    }
    return { error: `[signIn] ${error.message}` }
  }

  if (!session) return { error: '[signIn] Sin sesión.' }

  // Transferir sesión al cliente SSR para que setee cookies httpOnly
  const supabase = await createClient()
  const { error: setErr } = await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
  if (setErr) return { error: `[setSession] ${setErr.message}` }

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) return { error: `[getUser] ${userErr.message}` }
  if (!user) return { error: '[getUser] Sin usuario.' }

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
