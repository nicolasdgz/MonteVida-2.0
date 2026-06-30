'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Mail } from 'lucide-react'
import { invitarUsuario } from '@/app/(admin)/configuracion/actions'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types/database'

interface CreatedUser {
  id: string
  email: string
  full_name: string
  role: UserRole
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (user: CreatedUser) => void
}

export function UsuarioModal({ isOpen, onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState<'admin' | 'staff'>('staff')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (isOpen) { setFullName(''); setEmail(''); setRole('staff') }
  }, [isOpen])

  async function handleSubmit() {
    if (!fullName.trim()) { toast.error('El nombre es obligatorio.'); return }
    if (!email.trim())    { toast.error('El email es obligatorio.'); return }

    setLoading(true)
    const result = await invitarUsuario({ email: email.trim(), full_name: fullName.trim(), role })
    setLoading(false)

    if (result.error || !result.data) { toast.error(result.error ?? 'Error inesperado.'); return }

    toast.success(`Invitación enviada a ${result.data.email}.`)
    onCreated(result.data)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-foreground">Invitar usuario</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Recibirá un email para establecer su contraseña</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre completo *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendedor@email.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Rol</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['staff', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all capitalize ${
                          role === r
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-primary'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-muted-foreground text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : <><Mail className="w-4 h-4" /> Enviar invitación</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
