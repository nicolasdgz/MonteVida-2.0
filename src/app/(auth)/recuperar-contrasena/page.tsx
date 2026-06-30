'use client'

import { useActionState, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Leaf, AlertCircle, Loader2, ArrowRight, LinkIcon, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { actualizarContrasena, solicitarRecuperacion } from './actions'

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

// ─── Vista 1: formulario para pedir el email ───────────────────────────────
function SolicitarForm({ initialEmail }: { initialEmail: string }) {
  const [state, action, isPending] = useActionState(solicitarRecuperacion, { error: null })
  const sent = state.error === null && !isPending

  return (
    <>
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
        <p className="text-muted-foreground text-sm mt-1.5">Recuperar contraseña</p>
      </div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5"
            style={{ background: 'rgba(66,135,67,0.1)', border: '1px solid rgba(66,135,67,0.3)' }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <p className="text-green-400 text-sm">
              Si ese correo tiene una cuenta, recibirás el enlace en minutos. Revisá también tu carpeta de spam.
            </p>
          </div>
        </motion.div>
      ) : (
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email" name="email" type="email"
                autoComplete="email" required placeholder="tu@email.com"
                defaultValue={initialEmail}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>
          </div>

          {state.error && (
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
              {isPending ? 'Enviando...' : 'Enviar enlace de recuperación'}
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
        </form>
      )}
    </>
  )
}

// ─── Vista 2: formulario para establecer nueva contraseña ─────────────────
function NuevaContrasenaForm() {
  const [state, action, isPending] = useActionState(actualizarContrasena, { error: null })
  const isExpired = state.error?.includes('expirado') || state.error?.includes('expiró')

  return (
    <>
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
        <p className="text-muted-foreground text-sm mt-1.5">Establecé tu nueva contraseña</p>
      </div>

      {isExpired ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <LinkIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{state.error}</p>
          </div>
          <p className="text-center text-muted-foreground text-xs">
            <Link href="/recuperar-contrasena" className="text-green-400 hover:text-green-300 transition-colors">
              Solicitá un nuevo enlace
            </Link>
          </p>
        </motion.div>
      ) : (
        <form action={action} className="space-y-4">
          {(['nueva_contrasena', 'confirmar_contrasena'] as const).map((name, i) => (
            <div key={name} className="space-y-1.5">
              <label htmlFor={name} className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {i === 0 ? 'Nueva contraseña' : 'Confirmar contraseña'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id={name} name={name} type="password"
                  autoComplete="new-password" required
                  minLength={i === 0 ? 8 : undefined}
                  placeholder={i === 0 ? 'Mínimo 8 caracteres' : 'Repetí la contraseña'}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
            </div>
          ))}

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
        </form>
      )}
    </>
  )
}

// ─── Página raíz ──────────────────────────────────────────────────────────
export default function RecuperarContrasenaPage() {
  // 'idle'   → aún no procesamos el hash (spinner)
  // 'form'   → hash procesado, mostrar formulario nueva contraseña
  // 'request'→ sin token en hash, mostrar form de solicitud
  // 'error'  → token inválido / expirado
  type Stage = 'idle' | 'form' | 'request' | 'error'
  const [stage, setStage]         = useState<Stage>('idle')
  const [hashError, setHashError] = useState<string | null>(null)
  const [initialEmail, setInitialEmail] = useState('')

  useEffect(() => {
    const searchEmail = new URLSearchParams(window.location.search).get('email') ?? ''
    if (searchEmail) setInitialEmail(decodeURIComponent(searchEmail))

    const hash   = window.location.hash.substring(1)
    if (!hash) { setStage('request'); return }

    const params      = new URLSearchParams(hash)
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token') ?? ''
    const type         = params.get('type')

    if (!accessToken || type !== 'recovery') {
      setStage('request')
      return
    }

    // Eliminar tokens de la URL antes de set session
    window.history.replaceState(null, '', window.location.pathname)

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          console.error('[recuperar-contrasena] setSession:', error.message)
          setHashError('El enlace ha expirado o ya fue usado. Solicitá uno nuevo.')
          setStage('error')
        } else {
          setStage('form')
        }
      })
  }, [])

  return (
    <div className="min-h-[100dvh] bg-[#05100a] flex items-center justify-center p-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(66,135,67,0.18) 0%, transparent 60%)' }} />
        <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,162,74,0.07) 0%, transparent 60%)' }} />
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
            {stage === 'idle' && (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-6 h-6 text-[#428743] animate-spin" />
                <p className="text-muted-foreground text-sm">Verificando enlace...</p>
              </div>
            )}

            {stage === 'error' && (
              <>
                <div className="flex flex-col items-center mb-8">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: 'rgba(66,135,67,0.5)' }} />
                    <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center border"
                      style={{ background: 'linear-gradient(145deg, #428743, #2F6534)', borderColor: 'rgba(166,232,81,0.3)', boxShadow: '0 8px 24px rgba(66,135,67,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                      <Leaf className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-semibold text-white tracking-[-0.04em]">Monte Vida</h1>
                </div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <LinkIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{hashError}</p>
                  </div>
                  <p className="text-center text-muted-foreground text-xs">
                    <Link href="/recuperar-contrasena" className="text-green-400 hover:text-green-300 transition-colors">
                      Solicitá un nuevo enlace →
                    </Link>
                  </p>
                </motion.div>
              </>
            )}

            {stage === 'request' && <SolicitarForm initialEmail={initialEmail} />}
            {stage === 'form'    && <NuevaContrasenaForm />}

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
