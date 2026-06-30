'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2, ExternalLink, User, Pencil, Check, Download, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { anularVenta, actualizarFechaVenta, subirVoucherVenta } from '@/app/(admin)/ventas/actions'
import { formatearMonto } from '@/utils/igv'
import toast from 'react-hot-toast'
import type { Sale } from '@/types/database'

interface SaleDetalle extends Sale {
  profiles: { full_name: string } | null
  clientes: { nombre: string; es_anonimo: boolean } | null
  sale_items: {
    id: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    products: { nombre: string; codigo: string | null }
  }[]
}

interface Props {
  sale: Sale | null
  isAdmin: boolean
  onClose: () => void
  onAnulada: (saleId: string) => void
  onFechaActualizada?: (saleId: string, fechaVenta: string) => void
  onVoucherActualizado?: (saleId: string, voucherUrl: string) => void
}

const METODO_LABEL: Record<string, string> = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  tarjeta: 'Tarjeta débito', efectivo: 'Efectivo', whatsapp: 'WhatsApp',
}

const ENVIO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', preparando: 'Preparando', enviado: 'Enviado', entregado: 'Entregado',
}

const ENVIO_STYLE: Record<string, string> = {
  pendiente:  'bg-amber-500/15 text-amber-400',
  preparando: 'bg-sky-500/15 text-sky-400',
  enviado:    'bg-primary/15 text-primary',
  entregado:  'bg-emerald-500/15 text-emerald-400',
}

const STATUS_STYLE: Record<string, string> = {
  completada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  anulada:    'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  pendiente:  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
}

export function VentaDetalleModal({ sale, isAdmin, onClose, onAnulada, onFechaActualizada, onVoucherActualizado }: Props) {
  const [detalle, setDetalle] = useState<SaleDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [anulando, setAnulando]           = useState(false)
  const [editandoFecha, setEditandoFecha] = useState(false)
  const [fechaDraft, setFechaDraft] = useState('')
  const [guardandoFecha, setGuardandoFecha] = useState(false)
  const [subiendoVoucher, setSubiendoVoucher] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!sale) { setDetalle(null); return }
    setEditandoFecha(false)
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('sales')
      .select('*, profiles(full_name), clientes(nombre, es_anonimo), sale_items(id, cantidad, precio_unitario, subtotal, products(nombre, codigo))')
      .eq('id', sale.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error('No se pudo cargar el detalle de la venta.')
          setDetalle(null)
        } else {
          setDetalle(data as unknown as SaleDetalle)
        }
        setLoading(false)
      })
  }, [sale])

  async function handleAnular() {
    if (!sale) return
    setAnulando(true)
    const result = await anularVenta(sale.id)
    setAnulando(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Venta anulada. El stock fue restaurado.')
    onAnulada(sale.id)
    onClose()
  }

  function abrirEdicionFecha() {
    if (!detalle) return
    setFechaDraft(detalle.fecha_venta)
    setEditandoFecha(true)
  }

  async function guardarFecha() {
    if (!sale || !detalle) return
    if (fechaDraft === detalle.fecha_venta) { setEditandoFecha(false); return }
    setGuardandoFecha(true)
    const result = await actualizarFechaVenta(sale.id, fechaDraft)
    setGuardandoFecha(false)
    if (result.error) { toast.error(result.error); return }
    setDetalle({ ...detalle, fecha_venta: fechaDraft })
    setEditandoFecha(false)
    onFechaActualizada?.(sale.id, fechaDraft)
    toast.success('Fecha actualizada.')
  }

  async function handleVoucherFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !sale || !detalle) return
    if (!file.type.startsWith('image/')) {
      toast.error('El comprobante debe ser una imagen.')
      return
    }
    setSubiendoVoucher(true)
    const fd = new FormData()
    fd.append('saleId', sale.id)
    fd.append('voucher', file)
    const result = await subirVoucherVenta(fd)
    setSubiendoVoucher(false)
    if (result.error) { toast.error(result.error); return }
    if (result.voucherUrl) {
      setDetalle({ ...detalle, voucher_url: result.voucherUrl })
      onVoucherActualizado?.(sale.id, result.voucherUrl)
    }
    toast.success('Comprobante adjuntado.')
  }

  const clienteNombre = detalle?.clientes?.nombre ?? 'Usuario'
  const esAnonimo = !detalle?.clientes || detalle.clientes.es_anonimo

  return (
    <AnimatePresence>
      {sale && (
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
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-neu dark:shadow-none overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">Venta #{sale.numero_venta}</h2>
                  {editandoFecha ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="date"
                        value={fechaDraft}
                        onChange={(e) => setFechaDraft(e.target.value)}
                        disabled={guardandoFecha}
                        className="input-field text-xs py-1 px-2 w-40"
                      />
                      <button
                        onClick={guardarFecha}
                        disabled={guardandoFecha || !fechaDraft}
                        title="Guardar fecha"
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 transition-colors"
                      >
                        {guardandoFecha
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditandoFecha(false)}
                        disabled={guardandoFecha}
                        title="Cancelar"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {new Date(((detalle?.fecha_venta ?? sale.fecha_venta) ?? sale.created_at) + 'T12:00:00').toLocaleDateString('es-PE', { dateStyle: 'long' })}
                      </p>
                      {isAdmin && detalle && (
                        <button
                          onClick={abrirEdicionFecha}
                          title="Editar fecha"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : detalle && (
                <div className="px-6 py-5 space-y-5">
                  {/* Meta */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[detalle.status]}`}>
                      {detalle.status.charAt(0).toUpperCase() + detalle.status.slice(1)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {METODO_LABEL[detalle.metodo_pago] ?? detalle.metodo_pago}
                    </span>
                    {detalle.estado_envio && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ENVIO_STYLE[detalle.estado_envio] ?? 'bg-muted text-muted-foreground'}`}>
                        {ENVIO_LABEL[detalle.estado_envio] ?? detalle.estado_envio}
                      </span>
                    )}
                    {isAdmin && detalle.profiles && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {detalle.profiles.full_name}
                      </span>
                    )}
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm ${esAnonimo ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {clienteNombre}
                    </span>
                  </div>

                  {/* Ítems */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Productos</p>
                    <div className="space-y-1.5">
                      {detalle.sale_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                          <div className="min-w-0">
                            <p className="text-foreground truncate">{item.products.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.cantidad} × {formatearMonto(item.precio_unitario)}
                            </p>
                          </div>
                          <p className="font-medium text-foreground tabular-nums ml-4">{formatearMonto(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="space-y-1.5 text-sm bg-muted rounded-xl p-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{formatearMonto(detalle.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>IGV</span>
                      <span className="tabular-nums">{formatearMonto(detalle.igv_monto)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
                      <span>Total</span>
                      <span className="tabular-nums text-primary">{formatearMonto(detalle.total)}</span>
                    </div>
                  </div>

                  {/* Notas */}
                  {detalle.notas && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
                      <p className="text-sm text-muted-foreground">{detalle.notas}</p>
                    </div>
                  )}

                  {/* Voucher preview (solo si existe) */}
                  {detalle.voucher_url && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Comprobante</p>
                      <a href={detalle.voucher_url} target="_blank" rel="noopener noreferrer" className="block relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={detalle.voucher_url} alt="Voucher" className="w-full rounded-xl border border-border max-h-48 object-contain bg-muted" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Acciones de comprobante */}
                  <div className="space-y-2">
                    {detalle.voucher_url ? (
                      <a
                        href={detalle.voucher_url}
                        className="w-full py-2.5 rounded-xl border border-primary/20 text-primary hover:bg-primary/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar comprobante
                      </a>
                    ) : (
                      !isAdmin && (
                        <button
                          type="button"
                          disabled
                          title="Esta venta no tiene comprobante adjunto."
                          className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          Sin comprobante adjunto
                        </button>
                      )
                    )}

                    {isAdmin && !detalle.voucher_url && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={subiendoVoucher}
                          className="w-full py-2.5 rounded-xl border border-border text-foreground hover:bg-muted disabled:opacity-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          {subiendoVoucher
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Upload className="w-4 h-4" />}
                          Adjuntar comprobante
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleVoucherFile}
                        />
                      </>
                    )}
                  </div>

                  {/* Anular */}
                  {isAdmin && detalle.status === 'completada' && (
                    <button
                      onClick={handleAnular}
                      disabled={anulando}
                      className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {anulando ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                      Anular venta
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
