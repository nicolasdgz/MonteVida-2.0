'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Loader2 } from 'lucide-react'
import { fetchClienteSales } from '@/app/(admin)/clientes/actions'
import { formatearMonto } from '@/utils/igv'
import type { Cliente } from '@/types/database'

type ClienteSale = {
  id: string
  numero_venta: number
  fecha_venta: string
  total: number
  metodo_pago: string
  status: string
}

const METODO_LABEL: Record<string, string> = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  tarjeta: 'Tarjeta', efectivo: 'Efectivo',
}

const STATUS_STYLE: Record<string, string> = {
  completada: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  anulada:    'bg-red-500/15 text-red-400 border-red-500/20',
  pendiente:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

interface Props {
  cliente: Cliente | null
  onClose: () => void
}

export function ClienteHistorialModal({ cliente, onClose }: Props) {
  const [sales, setSales] = useState<ClienteSale[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cliente) return
    setSales([])
    setLoading(true)
    fetchClienteSales(cliente.id).then((result) => {
      setLoading(false)
      if (!result.error) setSales(result.sales as ClienteSale[])
    })
  }, [cliente])

  function handleClose() {
    onClose()
    setSales([])
  }

  const completadas = sales.filter((s) => s.status === 'completada')
  const totalGastado = completadas.reduce((acc, s) => acc + s.total, 0)

  return (
    <AnimatePresence>
      {!!cliente && (
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
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div>
                  <h2 className="font-semibold text-foreground">{cliente?.nombre}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completadas.length} {completadas.length === 1 ? 'compra' : 'compras'} · {formatearMonto(totalGastado)} total
                  </p>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : sales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Sin ventas registradas</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Método</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-primary/8 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">#{sale.numero_venta}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(sale.fecha_venta + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs text-muted-foreground">{METODO_LABEL[sale.metodo_pago] ?? sale.metodo_pago}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[sale.status] ?? 'border-border text-muted-foreground'}`}>
                              {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground tabular-nums">
                            {formatearMonto(sale.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
