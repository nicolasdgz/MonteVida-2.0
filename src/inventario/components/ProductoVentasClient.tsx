'use client'

import { useMemo, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Package, TrendingUp, Hash, Globe, GlobeLock, Loader2, ImageIcon } from 'lucide-react'
import { VentaDetalleModal } from '@/ventas/components/VentaDetalleModal'
import { formatearMonto, calcularConIgv } from '@/utils/igv'
import { useConfiguracion } from '@/store/configuracion'
import { subirImagenProducto, actualizarWebProducto } from '@/app/(admin)/inventario/actions'
import toast from 'react-hot-toast'
import type { ProductWithCategory, Sale } from '@/types/database'

interface SaleItemMin {
  id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  product_id: string
}

interface SaleRow extends Sale {
  profiles: { full_name: string } | null
  clientes: { nombre: string; es_anonimo: boolean } | null
  sale_items: SaleItemMin[]
}

interface Props {
  product: ProductWithCategory
  sales: SaleRow[]
  isAdmin: boolean
}

const METODO_LABEL: Record<string, string> = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  tarjeta: 'Tarjeta', efectivo: 'Efectivo', whatsapp: 'WhatsApp',
}

const STATUS_STYLE: Record<string, string> = {
  completada: 'bg-emerald-500/10 text-emerald-400',
  anulada:    'bg-red-500/10 text-red-400',
  pendiente:  'bg-amber-500/10 text-amber-400',
}

export function ProductoVentasClient({ product, sales: initial, isAdmin }: Props) {
  const showIgv = useConfiguracion((s) => s.showIgv)
  const igvPct  = useConfiguracion((s) => (s.data?.igv_porcentaje ?? 18) / 100)
  const [sales, setSales]     = useState<SaleRow[]>(initial)
  const [selected, setSelected] = useState<Sale | null>(null)

  // Web presence state
  const [imageUrl, setImageUrl]       = useState<string | null>(product.imagen_url)
  const [visible, setVisible]         = useState(product.visible_web)
  const [oferta, setOferta]           = useState(String(product.precio_oferta ?? ''))
  const [uploadingImg, setUploadingImg] = useState(false)
  const [savingWeb, setSavingWeb]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    const fd = new FormData()
    fd.append('image', file)
    const result = await subirImagenProducto(product.id, fd)
    setUploadingImg(false)
    if (result.error) { toast.error(result.error); return }
    setImageUrl(result.imageUrl ?? null)
    toast.success('Imagen actualizada.')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleToggleVisible() {
    const next = !visible
    setSavingWeb(true)
    const result = await actualizarWebProducto(product.id, { visible_web: next })
    setSavingWeb(false)
    if (result.error) { toast.error(result.error); return }
    setVisible(next)
    toast.success(next ? 'Producto visible en la tienda.' : 'Producto ocultado de la tienda.')
  }

  async function handleSaveOferta() {
    const precio_oferta = oferta.trim() === '' ? null : parseFloat(oferta)
    if (precio_oferta !== null && (isNaN(precio_oferta) || precio_oferta < 0)) {
      toast.error('Precio de oferta inválido.')
      return
    }
    setSavingWeb(true)
    const result = await actualizarWebProducto(product.id, { precio_oferta })
    setSavingWeb(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Precio de oferta guardado.')
  }

  const completadas = useMemo(
    () => sales.filter((s) => s.status === 'completada'),
    [sales]
  )

  const stats = useMemo(() => {
    let unidades = 0
    let monto = 0
    for (const s of completadas) {
      for (const item of s.sale_items) {
        if (item.product_id !== product.id) continue
        unidades += item.cantidad
        monto    += item.subtotal
      }
    }
    return { ventas: completadas.length, unidades, monto }
  }, [completadas, product.id])

  function handleAnulada(saleId: string) {
    setSales((prev) => prev.map((s) =>
      s.id === saleId ? { ...s, status: 'anulada' as const } : s
    ))
  }

  function handleFechaActualizada(saleId: string, fechaVenta: string) {
    setSales((prev) => prev.map((s) =>
      s.id === saleId ? { ...s, fecha_venta: fechaVenta } : s
    ))
  }

  function handleVoucherActualizado(saleId: string, voucherUrl: string) {
    setSales((prev) => prev.map((s) =>
      s.id === saleId ? { ...s, voucher_url: voucherUrl } : s
    ))
  }

  const precioMostrado = showIgv
    ? calcularConIgv(product.precio_venta, igvPct)
    : product.precio_venta

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/inventario"
          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <span className="inline-block mb-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-muted text-muted-foreground border border-border">
            Historial de ventas
          </span>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em] truncate">
            {product.nombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            {product.codigo && (
              <span className="font-mono text-xs text-muted-foreground">{product.codigo}</span>
            )}
            {product.categories && (
              <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                {product.categories.nombre}
              </span>
            )}
            <span>·</span>
            <span>Stock actual: <strong className="text-foreground tabular-nums">{product.stock}</strong></span>
            <span>·</span>
            <span>Precio: <strong className="text-foreground tabular-nums">{formatearMonto(precioMostrado)}</strong> {showIgv ? <span className="text-emerald-500/70 text-[10px]">+IGV</span> : <span className="text-muted-foreground text-[10px]">s/IGV</span>}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Hash className="w-3.5 h-3.5" />
            Ventas (completadas)
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{stats.ventas}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Package className="w-3.5 h-3.5" />
            Unidades vendidas
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{stats.unidades}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Monto vendido
          </div>
          <p className="text-2xl font-bold text-primary tabular-nums">{formatearMonto(stats.monto)}</p>
        </div>
      </div>

      {/* Presencia web — solo admin */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            Presencia web
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Imagen */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Imagen principal</label>
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={product.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImg}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-muted-foreground transition-colors disabled:opacity-50"
                  >
                    {uploadingImg
                      ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Subiendo...</span>
                      : imageUrl ? 'Reemplazar' : 'Subir imagen'
                    }
                  </button>
                  {product.slug && (
                    <p className="text-[10px] text-muted-foreground font-mono break-all">/producto/{product.slug}</p>
                  )}
                </div>
                <input
                  ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                  className="hidden" onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Configuración web */}
            <div className="space-y-4">
              {/* visible_web toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Visible en tienda</p>
                  <p className="text-xs text-muted-foreground">Requiere imagen para mostrarse</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVisible}
                  disabled={savingWeb || (!imageUrl && !visible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
                    visible ? 'bg-primary' : 'bg-input'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    visible ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                {visible
                  ? <Globe className="w-3.5 h-3.5 text-primary ml-1" />
                  : <GlobeLock className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                }
              </div>

              {/* precio_oferta */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Precio oferta <span className="text-muted-foreground">(opcional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={oferta}
                    onChange={(e) => setOferta(e.target.value)}
                    placeholder={String(product.precio_venta)}
                    min="0"
                    step="0.01"
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSaveOferta}
                    disabled={savingWeb}
                    className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-primary hover:border-muted-foreground transition-colors disabled:opacity-50"
                  >
                    {savingWeb ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Precio normal: {formatearMonto(product.precio_venta)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla ventas */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Este producto aún no se ha vendido</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">#</th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Fecha</th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Cliente</th>
                  {isAdmin && <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Staff</th>}
                  <th className="text-center py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Cant.</th>
                  <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">P. Unit.</th>
                  <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Subtotal prod.</th>
                  <th className="text-center py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Estado</th>
                  <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Total venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale, i) => {
                  const item = sale.sale_items.find((it) => it.product_id === product.id)
                  if (!item) return null
                  const clienteNombre = sale.clientes?.nombre ?? 'Usuario'
                  const esAnonimo = !sale.clientes || sale.clientes.es_anonimo

                  return (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelected(sale)}
                      className="cursor-pointer hover:bg-primary/8 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">#{sale.numero_venta}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(sale.fecha_venta + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${esAnonimo ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {clienteNombre}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-muted-foreground text-sm">{sale.profiles?.full_name ?? '—'}</td>
                      )}
                      <td className="py-3 px-4 text-center text-foreground font-medium tabular-nums">
                        {item.cantidad}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                        {formatearMonto(item.precio_unitario)}
                      </td>
                      <td className="py-3 px-4 text-right text-foreground font-medium tabular-nums">
                        {formatearMonto(item.subtotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] ${STATUS_STYLE[sale.status]}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                        <span className="text-[10px] text-muted-foreground mr-1">{METODO_LABEL[sale.metodo_pago] ?? sale.metodo_pago}</span>
                        {formatearMonto(sale.total)}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VentaDetalleModal
        sale={selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onAnulada={handleAnulada}
        onFechaActualizada={handleFechaActualizada}
        onVoucherActualizado={handleVoucherActualizado}
      />
    </div>
  )
}
