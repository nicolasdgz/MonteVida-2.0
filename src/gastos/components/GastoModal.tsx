'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { crearGasto, actualizarGasto } from '@/app/(admin)/gastos/actions'
import toast from 'react-hot-toast'
import type { Expense, ExpenseCategory } from '@/types/database'

const CATEGORIAS: { value: ExpenseCategory; label: string }[] = [
  { value: 'alquiler',      label: 'Alquiler' },
  { value: 'servicios',     label: 'Servicios' },
  { value: 'personal',      label: 'Personal' },
  { value: 'marketing',     label: 'Marketing' },
  { value: 'logistica',     label: 'Logística' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'impuestos',     label: 'Impuestos' },
  { value: 'mercaderia',    label: 'Mercadería' },
  { value: 'otros',         label: 'Otros' },
]

interface Props {
  isOpen: boolean
  gasto: Expense | null
  onClose: () => void
  onSaved: (expense: Expense, isEdit: boolean) => void
}

export function GastoModal({ isOpen, gasto, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const isEdit = !!gasto

  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState<ExpenseCategory>('otros')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(today)
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setDescripcion(gasto?.descripcion ?? '')
      setCategoria(gasto?.categoria ?? 'otros')
      setMonto(gasto ? String(gasto.monto) : '')
      setFecha(gasto?.fecha ?? today)
      setComprobante(null)
      setComprobantePreview(null)
    }
  }, [isOpen, gasto, today])

  function handleFile(file: File | null) {
    setComprobante(file)
    setComprobantePreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit() {
    if (!descripcion.trim()) { toast.error('La descripción es obligatoria.'); return }
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) { toast.error('El monto debe ser mayor a 0.'); return }

    setLoading(true)
    const fd = new FormData()
    fd.append('descripcion', descripcion.trim())
    fd.append('categoria', categoria)
    fd.append('monto', String(montoNum))
    fd.append('fecha', fecha)
    if (comprobante) fd.append('comprobante', comprobante)
    if (gasto?.comprobante_url) fd.append('comprobanteExistente', gasto.comprobante_url)

    const result = isEdit
      ? await actualizarGasto(gasto!.id, fd)
      : await crearGasto(fd)

    setLoading(false)
    if (result.error) { toast.error(result.error); return }

    toast.success(isEdit ? 'Gasto actualizado.' : 'Gasto registrado.')
    onSaved(result.expense!, isEdit)
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
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">
                  {isEdit ? 'Editar gasto' : 'Nuevo gasto'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/8 dark:hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Descripción */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Pago de luz mes de abril"
                    className="input-field"
                    autoFocus
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
                    className="input-field"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Monto + Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Monto *
                    </label>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Comprobante */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Comprobante
                  </label>
                  {comprobantePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={comprobantePreview}
                        alt="Comprobante"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleFile(null)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-card/80 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : gasto?.comprobante_url ? (
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <a
                        href={gasto.comprobante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors flex-1 min-w-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Ver comprobante actual</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        Reemplazar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center gap-2 py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-xs">Adjuntar imagen</span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
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
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                      : (isEdit ? 'Guardar cambios' : 'Registrar')
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
