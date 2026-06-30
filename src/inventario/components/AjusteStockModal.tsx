'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { ajustarStock } from '@/app/(admin)/inventario/actions'
import type { ProductWithCategory } from '@/types/database'

interface Props {
  product: ProductWithCategory | null
  onClose: () => void
  onAjustado: (product: ProductWithCategory) => void
}

export function AjusteStockModal({ product, onClose, onAjustado }: Props) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [loading, setLoading] = useState(false)

  const delta = tipo === 'entrada' ? +(cantidad || 0) : -(+(cantidad || 0))
  const nuevoStock = product ? Math.max(0, product.stock + delta) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !cantidad || +cantidad <= 0) { toast.error('Ingresá una cantidad válida.'); return }
    setLoading(true)
    const result = await ajustarStock(product.id, delta)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Stock ajustado.')
    onAjustado(result.product!)
    handleClose()
  }

  function handleClose() {
    onClose()
    setCantidad('')
    setTipo('entrada')
  }

  return (
    <AnimatePresence>
      {!!product && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-neu dark:shadow-none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-foreground">Ajuste de stock</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{product?.nombre}</p>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Tipo */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tipo de ajuste</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipo('entrada')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        tipo === 'entrada'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo('salida')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        tipo === 'salida'
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Salida
                    </button>
                  </div>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0"
                    className="input-field"
                    required
                    autoFocus
                  />
                </div>

                {/* Preview */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg text-sm border border-border">
                  <span className="text-muted-foreground">Stock resultante</span>
                  <span className="font-bold tabular-nums">
                    <span className="text-muted-foreground">{product?.stock ?? 0}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className={nuevoStock <= (product?.stock_minimo ?? 0) ? 'text-red-400' : 'text-emerald-400'}>
                      {nuevoStock}
                    </span>
                  </span>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !cantidad || +cantidad <= 0}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar
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
