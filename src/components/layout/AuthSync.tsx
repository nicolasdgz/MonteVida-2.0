'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import type { Profile } from '@/types/database'

export function AuthSync() {
  const setProfile = useAuthStore((s) => s.setProfile)
  const clearProfile = useAuthStore((s) => s.clearProfile)
  const supabase = createClient()

  async function fetchAndSet(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { clearProfile(); return }
      await fetchAndSet(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          clearProfile(); return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchAndSet(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
