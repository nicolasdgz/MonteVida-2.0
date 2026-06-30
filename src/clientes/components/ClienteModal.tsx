'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { crearCliente, actualizarCliente } from '@/app/(admin)/clientes/actions'
import type { Cliente } from '@/types/database'

const TIPOS_DOC = ['DNI', 'RUC', 'CE', 'Pasaporte']

const emptyForm = {
  nombre: '',
  telefono: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  email: '',
}

interface Props {
  open: boolean
  onClose: () => void
  cliente?: Cliente | null
  onSaved?: (cliente: Cliente) => void
}

export function ClienteModal({ open, onClose, cliente, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const isEditing = !!cliente

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre,
        telefono: cliente.telefono ?? '',
        tipo_documento: cliente.tipo_documento,
        numero_documento: cliente.numero_documento ?? '',
        email: cliente.email ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [cliente, open])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio.'); return }

    setLoading(true)
    const payload = {
      nombre: form.nombre,
      telefono: form.telefono || undefined,
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento || undefined,
      email: form.email || undefined,
    }

    const result = isEditing
      ? await actualizarCliente(cliente!.id, payload)
      : await crearCliente(payload)

    setLoading(false)
    if (result.error) { toast.error(result.error); return }

    toast.success(isEditing ? 'Cliente actualizado.' : 'Cliente registrado.')

    if (onSaved) {
      onSaved({
        id: result.id ?? cliente!.id,
        nombre: form.nombre,
        telefono: form.telefono || null,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento || null,
        email: form.email || null,
        es_anonimo: false,
        created_at: cliente?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-neu dark:shadow-none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">
                  {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="input-field"
                    required
                  />
                </div>

                {/* Documento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo doc.</label>
                    <select value={form.tipo_documento} onChange={(e) => set('tipo_documento', e.target.value)} className="input-field">
                      {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Número</label>
                    <input
                      value={form.numero_documento}
                      onChange={(e) => set('numero_documento', e.target.value)}
                      placeholder="12345678"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={(e) => set('telefono', e.target.value)}
                    placeholder="999 999 999"
                    className="input-field"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email <span className="text-muted-foreground/60">(opcional)</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="cliente@email.com"
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Guardar cambios' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
