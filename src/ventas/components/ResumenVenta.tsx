'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Receipt, Image as ImageIcon, X, ArrowRight } from 'lucide-react'
import { useSaleForm } from '@/ventas/store'
import { useConfiguracion } from '@/store/configuracion'
import { formatearMonto, calcularIgvMonto } from '@/utils/igv'
import { registrarVenta } from '@/app/(admin)/ventas/actions'
import toast from 'react-hot-toast'
import type { PaymentMethod } from '@/types/database'

const METODOS: { value: PaymentMethod; label: string; color: string }[] = [
  { value: 'yape',          label: 'Yape',          color: 'bg-primary/15 text-primary border-primary/30' },
  { value: 'plin',          label: 'Plin',           color: 'bg-teal-500/10 text-teal-700 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40' },
  { value: 'transferencia', label: 'Transferencia',  color: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40' },
  { value: 'tarjeta',       label: 'Tarjeta débito', color: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40' },
  { value: 'efectivo',      label: 'Efectivo',       color: 'bg-muted text-foreground border-border' },
]

export function ResumenVenta({ onSuccess }: { onSuccess: () => void }) {
  const lineas         = useSaleForm((s) => s.lineas)
  const metodoPago     = useSaleForm((s) => s.metodoPago)
  const notas          = useSaleForm((s) => s.notas)
  const clienteId      = useSaleForm((s) => s.clienteId)
  const fechaVenta     = useSaleForm((s) => s.fechaVenta)
  const descuento      = useSaleForm((s) => s.descuento)
  const tipoDescuento  = useSaleForm((s) => s.tipoDescuento)
  const setMetodoPago    = useSaleForm((s) => s.setMetodoPago)
  const setNotas         = useSaleForm((s) => s.setNotas)
  const setFechaVenta    = useSaleForm((s) => s.setFechaVenta)
  const setDescuento     = useSaleForm((s) => s.setDescuento)
  const setTipoDescuento = useSaleForm((s) => s.setTipoDescuento)
  const resetForm        = useSaleForm((s) => s.resetForm)

  const igvPct = useConfiguracion((s) => (s.data?.igv_porcentaje ?? 18) / 100)

  useEffect(() => {
    setFechaVenta(new Date().toISOString().split('T')[0])
  }, [setFechaVenta])

  const [aplicarIgv, setAplicarIgv] = useState(false)
  const [voucher, setVoucher] = useState<File | null>(null)
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const hayStockInsuficiente = lineas.some((l) => l.cantidad > l.product.stock)
  const subtotalBase = lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)

  const descuentoMonto = tipoDescuento === 'porcentaje'
    ? Math.min(subtotalBase, (subtotalBase * descuento) / 100)
    : Math.min(subtotalBase, descuento)

  const baseConDescuento = subtotalBase - descuentoMonto
  const igvMonto = aplicarIgv ? calcularIgvMonto(baseConDescuento, igvPct) : 0
  const total = baseConDescuento + igvMonto

  function handleVoucher(file: File | null) {
    setVoucher(file)
    setVoucherPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit() {
    if (lineas.length === 0) { toast.error('Agregá al menos un producto.'); return }
    if (hayStockInsuficiente) { toast.error('Hay productos con stock insuficiente.'); return }

    setLoading(true)
    const formData = new FormData()
    formData.append('lines', JSON.stringify(
      lineas.map((l) => ({
        product_id: l.product.id,
        cantidad: l.cantidad,
        precio_unitario: l.precioUnitario,
        precio_costo: l.product.precio_costo,
      }))
    ))
    formData.append('metodoPago', metodoPago)
    formData.append('notas', notas)
    formData.append('clienteId', clienteId)
    formData.append('fechaVenta', fechaVenta)
    if (voucher) formData.append('voucher', voucher)
    formData.append('aplicarIgv', aplicarIgv ? '1' : '0')
    formData.append('descuentoMonto', String(descuentoMonto))

    const result = await registrarVenta(formData)
    setLoading(false)

    if (result.error) { toast.error(result.error); return }

    if (result.voucherWarning) toast.error(result.voucherWarning, { duration: 6000 })
    toast.success('Venta registrada correctamente.')
    resetForm()
    setVoucher(null)
    setVoucherPreview(null)
    setAplicarIgv(false)
    onSuccess()
  }

  return (
    <div className="lg:sticky lg:top-20">
      {/* Outer ring con acento de marca */}
      <div
        className="rounded-[1.25rem] p-px resumen-ring"
      >
      {/* Card con fondo propio */}
      <div
        className="surface-resumen rounded-[calc(1.25rem-1px)] p-4 sm:p-5 space-y-5"
        style={{
          boxShadow: '0 0 40px rgba(109,40,217,0.08)',
        }}
      >
      <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
        <Receipt className="w-4 h-4 text-primary" />
        Resumen
      </h2>

      {/* Totales */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatearMonto(subtotalBase)}</span>
        </div>

        {/* Descuento */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] font-medium">Descuento</p>
            {/* Toggle tipo */}
            <div className="flex rounded-md border border-border overflow-hidden text-[10px] font-medium ml-auto">
              {(['porcentaje', 'monto'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoDescuento(t)}
                  className={`px-2 py-0.5 transition-colors ${tipoDescuento === t ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t === 'porcentaje' ? '%' : 'S/'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={tipoDescuento === 'porcentaje' ? 100 : undefined}
              step={tipoDescuento === 'porcentaje' ? 1 : 0.01}
              value={descuento === 0 ? '' : descuento}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              placeholder={tipoDescuento === 'porcentaje' ? '0%' : '0.00'}
              className="input-field pr-10 text-sm"
            />
            {descuentoMonto > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                −{formatearMonto(descuentoMonto)}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>IGV ({(igvPct * 100).toFixed(0)}%)</span>
            <button
              type="button"
              onClick={() => setAplicarIgv((v) => !v)}
              className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${aplicarIgv ? 'bg-primary dark:bg-primary' : 'bg-input'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${aplicarIgv ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
          <span className="tabular-nums">{formatearMonto(igvMonto)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base text-foreground pt-2 border-t border-border/60 dark:border-white/[0.06]">
          <span>Total</span>
          <span className="tabular-nums text-primary">{formatearMonto(total)}</span>
        </div>
      </div>

      {/* Fecha de venta */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Fecha de venta</label>
        <input
          type="date"
          value={fechaVenta}
          onChange={(e) => setFechaVenta(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Método de pago */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-2">Método de pago</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {METODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMetodoPago(m.value)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                metodoPago === m.value
                  ? m.color
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voucher */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-2">Voucher</p>
        {voucherPreview ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={voucherPreview} alt="Voucher" className="w-full h-32 object-cover" />
            <button
              type="button"
              onClick={() => handleVoucher(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
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
          onChange={(e) => handleVoucher(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Notas */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-2">Notas</p>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones opcionales..."
          rows={2}
          className="input-field resize-none text-xs"
        />
      </div>

      {/* Submit — Button-in-Button pattern */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || lineas.length === 0 || hayStockInsuficiente}
        className="group w-full py-3 px-5 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-full flex items-center justify-between gap-2"
        style={{
          background: 'linear-gradient(135deg, #428743 0%, #2F6534 100%)',
          boxShadow: '0 0 0 1px rgba(66,135,67,0.3), 0 6px 20px rgba(66,135,67,0.25)',
          transition: 'all 350ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <span className="flex items-center gap-2 text-sm">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Registrando...' : 'Registrar venta'}
        </span>
        {!loading && (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
            style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {lineas.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'} · {lineas.reduce((a, l) => a + l.cantidad, 0)} unidades
        </p>
      )}
      </div>
      </div>
    </div>
  )
}
