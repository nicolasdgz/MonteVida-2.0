'use client'

import { useActionState, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Leaf, AlertCircle, Loader2, ArrowRight, LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { setNuevaContrasena } from './actions'

const initialState = { error: null }
const SPRING = [0.32, 0.72, 0, 1] as const

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
}
const inputFocusStyle = {
  border: '1px solid rgba(66,135,67,0.5)',
  boxShadow: '0 0 0 3px rgba(66,135,67,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
}

export default function NuevaContrasenaPage() {
  const [state, action, isPending] = useActionState(setNuevaContrasena, initialState)
  const [sessionReady, setSessionReady] = useState(false)
  const [hashError, setHashError]       = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (!hash) {
      // No hash — PKCE flow: session already set by /auth/callback
      setSessionReady(true)
      return
    }

    const params    = new URLSearchParams(hash)
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token') ?? ''
    const type         = params.get('type') // 'recovery' | 'invite' | 'signup'

    if (!accessToken || !['invite', 'signup'].includes(type ?? '')) {
      // Hash present but not an auth token — ignore, assume PKCE session
      setSessionReady(true)
      return
    }

    // Remove tokens from URL before setting session
    window.history.replaceState(null, '', window.location.pathname)

    const supabase = createClient()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          console.error('[nueva-contrasena] setSession:', error.message)
          setHashError('El enlace ha expirado o ya fue usado. Pedí al administrador una nueva invitación.')
        } else {
          setSessionReady(true)
        }
      })
  }, [])

  const isExpired = hashError != null || state.error?.includes('expirado') || state.error?.includes('expiró')

  return (
    <div className="min-h-[100dvh] bg-[#05100a] flex items-center justify-center p-4 overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(66,135,67,0.18) 0%, transparent 60%)' }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,162,74,0.07) 0%, transparent 60%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: SPRING }}
        className="relative w-full max-w-sm"
      >
        <div
          className="rounded-[1.75rem] p-px"
          style={{ background: 'linear-gradient(145deg, rgba(66,135,67,0.4) 0%, rgba(66,135,67,0.05) 50%, rgba(66,135,67,0.15) 100%)' }}
        >
          <div className="bg-[#0a150b] rounded-[calc(1.75rem-1px)] p-8">

            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: 'rgba(66,135,67,0.5)' }} />
                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center border"
                  style={{
                    background: 'linear-gradient(145deg, #428743, #2F6534)',
                    borderColor: 'rgba(166,232,81,0.3)',
                    boxShadow: '0 8px 24px rgba(66,135,67,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <Leaf className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-[-0.04em]">Monte Vida</h1>
              <p className="text-muted-foreground text-sm mt-1.5">Establecé tu contraseña</p>
            </div>

            {!sessionReady && !hashError ? (
              /* Procesando token del hash */
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="w-6 h-6 text-[#428743] animate-spin" />
                <p className="text-muted-foreground text-sm">Verificando enlace...</p>
              </div>
            ) : isExpired ? (
              /* Enlace expirado */
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <LinkIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{hashError ?? state.error}</p>
                </div>
                <p className="text-center text-muted-foreground text-xs">
                  Contactá al administrador para recibir una nueva invitación.
                </p>
              </motion.div>
            ) : (
              /* Formulario */
              <form action={action} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: SPRING }}
                  className="space-y-1.5"
                >
                  <label htmlFor="nueva_contrasena" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="nueva_contrasena"
                      name="nueva_contrasena"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.27, duration: 0.5, ease: SPRING }}
                  className="space-y-1.5"
                >
                  <label htmlFor="confirmar_contrasena" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="confirmar_contrasena"
                      name="confirmar_contrasena"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Repetí la contraseña"
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                    />
                  </div>
                </motion.div>

                {state.error && !isExpired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-red-400 text-sm rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {state.error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: SPRING }}
                  className="pt-1"
                >
                  <button
                    type="submit"
                    disabled={isPending}
                    className="group w-full text-white font-semibold rounded-full py-3.5 px-5 text-sm flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #428743 0%, #2F6534 100%)',
                      boxShadow: '0 0 0 1px rgba(66,135,67,0.4), 0 8px 32px rgba(66,135,67,0.35)',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isPending ? 'Guardando...' : 'Establecer contraseña'}
                    </span>
                    {!isPending && (
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                        style={{ background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                </motion.div>
              </form>
            )}

            <p className="text-center mt-6">
              <Link href="/iniciar-sesion" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
