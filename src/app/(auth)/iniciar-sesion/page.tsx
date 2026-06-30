'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, Leaf, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { signIn } from './actions'
import toast from 'react-hot-toast'

const initialState = { error: null }
const SPRING = [0.32, 0.72, 0, 1] as const

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signIn, initialState)
  const [emailValue, setEmailValue] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  function handleRecuperar() {
    const email = emailValue.trim()
    if (!email) {
      toast.error('Ingresá tu correo para recuperar la contraseña.')
      return
    }
    router.push(`/recuperar-contrasena?email=${encodeURIComponent(email)}`)
  }

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
        {/* Outer ring */}
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
              <p className="text-muted-foreground text-sm mt-1.5">Ingresá con tu cuenta</p>
            </div>

            {/* Form */}
            <form action={action} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: SPRING }}
                className="space-y-1.5"
              >
                <label htmlFor="email" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email" name="email" type="email"
                    autoComplete="email" required placeholder="tu@email.com"
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(66,135,67,0.5)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(66,135,67,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27, duration: 0.5, ease: SPRING }}
                className="space-y-1.5"
              >
                <label htmlFor="password" className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password" name="password" type="password"
                    autoComplete="current-password" required placeholder="••••••••"
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(66,135,67,0.5)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(66,135,67,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  />
                </div>
              </motion.div>

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
                    {isPending ? 'Ingresando...' : 'Ingresar'}
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

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={handleRecuperar}
                className="text-muted-foreground text-xs hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-4">
          <Link href="/" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
            ← Volver a la tienda
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
