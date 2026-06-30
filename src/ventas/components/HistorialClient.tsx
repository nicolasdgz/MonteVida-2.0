'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Download, Search, Trash2, Pencil } from 'lucide-react'
import { VentaDetalleModal } from './VentaDetalleModal'
import { EditarVentaModal } from './EditarVentaModal'
import { eliminarVenta } from '@/app/(admin)/ventas/actions'
import { Paginacion } from '@/components/ui/Paginacion'
import { formatearMonto } from '@/utils/igv'
import toast from 'react-hot-toast'
import type { Sale } from '@/types/database'

interface SaleRow extends Sale {
  profiles: { full_name: string } | null
  clientes: { nombre: string; es_anonimo: boolean } | null
}

interface Props {
  sales: SaleRow[]
  isAdmin: boolean
  currentPage: number
  totalPages: number
  totalCount: number
  initStatus: string
  initMetodo: string
  initDesde: string
  initHasta: string
}

const METODO_LABEL: Record<string, string> = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  tarjeta: 'Tarjeta', efectivo: 'Efectivo', whatsapp: 'WhatsApp',
}

const STATUS_STYLE: Record<string, string> = {
  completada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  anulada:    'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  pendiente:  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

function exportarCSV(sales: SaleRow[], isAdmin: boolean) {
  const bom = '﻿'
  const headers = ['#', 'Fecha', 'Cliente', ...(isAdmin ? ['Staff'] : []), 'Método', 'Estado', 'Total']
  const rows = sales.map((s) => [
    `#${s.numero_venta}`,
    new Date(s.fecha_venta + 'T12:00:00').toLocaleDateString('es-PE'),
    s.clientes?.nombre ?? 'Usuario',
    ...(isAdmin ? [s.profiles?.full_name ?? '—'] : []),
    METODO_LABEL[s.metodo_pago] ?? s.metodo_pago,
    s.status,
    String(s.total),
  ])
  const csv = bom + [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function HistorialClient({
  sales: initial,
  isAdmin,
  currentPage,
  totalPages,
  totalCount,
  initStatus,
  initMetodo,
  initDesde,
  initHasta,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [sales, setSales]             = useState(initial)
  const [selected, setSelected]       = useState<Sale | null>(null)
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [desde, setDesde]         = useState(initDesde)
  const [hasta, setHasta]         = useState(initHasta)

  useEffect(() => { setSales(initial) },   [initial])
  useEffect(() => { setDesde(initDesde) }, [initDesde])
  useEffect(() => { setHasta(initHasta) }, [initHasta])

  const buildUrl = useCallback((overrides: Record<string, string>, resetPage = true) => {
    const params = new URLSearchParams()
    const base: Record<string, string> = {
      status: initStatus !== 'todos' ? initStatus : '',
      metodo: initMetodo !== 'todos' ? initMetodo : '',
      desde:  initDesde,
      hasta:  initHasta,
      page:   resetPage ? '' : String(currentPage),
    }
    const merged = { ...base, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== 'todos') params.set(k, v)
    }
    const str = params.toString()
    return `/ventas/historial${str ? `?${str}` : ''}`
  }, [initStatus, initMetodo, initDesde, initHasta, currentPage])

  function handleBuscarFecha() {
    if (desde && hasta && desde > hasta) { toast.error('Rango de fechas inválido.'); return }
    router.push(buildUrl({ desde, hasta, page: '' }))
  }

  function handleLimpiarFecha() {
    setDesde('')
    setHasta('')
    router.push(buildUrl({ desde: '', hasta: '', page: '' }))
  }

  const filtradas = sales.filter((s) => {
    const q = filtroTexto.toLowerCase()
    return !filtroTexto || (
      (s.clientes?.nombre ?? 'Usuario').toLowerCase().includes(q) ||
      String(s.numero_venta).includes(filtroTexto) ||
      (isAdmin && (s.profiles?.full_name ?? '').toLowerCase().includes(q))
    )
  })

  function handleAnulada(saleId: string) {
    setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, status: 'anulada' as const } : s))
  }

  function handleFechaActualizada(saleId: string, fechaVenta: string) {
    setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, fecha_venta: fechaVenta } : s))
  }

  function handleVoucherActualizado(saleId: string, voucherUrl: string) {
    setSales((prev) => prev.map((s) => s.id === saleId ? { ...s, voucher_url: voucherUrl } : s))
  }

  function handleEditar(e: React.MouseEvent, sale: SaleRow) {
    e.stopPropagation()
    setEditingSale(sale)
  }

  async function handleEliminar(e: React.MouseEvent, sale: SaleRow) {
    e.stopPropagation()
    const ok = window.confirm(
      `¿Eliminar permanentemente la venta #${sale.numero_venta}?\n\nEsta acción no se puede deshacer. Solo eliminá ventas de prueba o errores.`
    )
    if (!ok) return
    const result = await eliminarVenta(sale.id)
    if (result.error) { toast.error(result.error); return }
    setSales((prev) => prev.filter((s) => s.id !== sale.id))
    toast.success(`Venta #${sale.numero_venta} eliminada.`)
  }

  const hayFiltrosFecha = !!(initDesde || initHasta)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ventas" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="inline-block mb-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-muted text-muted-foreground border border-border">
              Registros
            </span>
            <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Historial de ventas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} {totalCount === 1 ? 'venta' : 'ventas'}
              {(initStatus !== 'todos' || initMetodo !== 'todos' || hayFiltrosFecha) && (
                <span className="ml-1 text-primary">(filtrado)</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => exportarCSV(filtradas, isAdmin)}
          disabled={filtradas.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 text-sm transition-colors disabled:opacity-40 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>

      {/* Rango de fechas */}
      <div className="bg-card shadow-neu dark:shadow-none border border-border rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="input-field w-full sm:w-40 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="input-field w-full sm:w-40 text-sm"
            />
          </div>
          <button
            onClick={handleBuscarFecha}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            Buscar
          </button>
          {hayFiltrosFecha && (
            <button
              onClick={handleLimpiarFecha}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

      {/* Filtros secundarios */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar cliente o #venta..."
            className="input-field pl-9 w-full text-sm"
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {['todos', 'completada', 'pendiente', 'anulada'].map((f) => (
            <button
              key={f}
              onClick={() => router.push(buildUrl({ status: f, page: '' }))}
              className={`px-3 py-2 font-medium transition-colors capitalize ${initStatus === f ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              {f === 'todos' ? 'Todos' : f}
            </button>
          ))}
        </div>
        <select
          value={initMetodo}
          onChange={(e) => router.push(buildUrl({ metodo: e.target.value, page: '' }))}
          className="input-field w-full sm:w-44 text-sm"
        >
          <option value="todos">Todos los métodos</option>
          {Object.entries(METODO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-card shadow-neu dark:shadow-none border border-border rounded-2xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Sin ventas en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 dark:bg-transparent">
                  <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">#</th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Fecha</th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Cliente</th>
                  {isAdmin && <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Staff</th>}
                  <th className="text-center py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Método</th>
                  <th className="text-center py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Estado</th>
                  <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Total</th>
                  {isAdmin && <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtradas.map((sale, i) => {
                  const clienteNombre = sale.clientes?.nombre ?? 'Usuario'
                  const esAnonimo = !sale.clientes || sale.clientes.es_anonimo
                  return (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelected(sale)}
                      className="cursor-pointer bg-background/60 dark:bg-transparent hover:bg-primary/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="text-muted-foreground">#{sale.numero_venta}</span>
                      </td>
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
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs text-muted-foreground">{METODO_LABEL[sale.metodo_pago] ?? sale.metodo_pago}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] ${STATUS_STYLE[sale.status]}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground tabular-nums">
                        {formatearMonto(sale.total)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleEditar(e, sale)}
                              disabled={sale.status === 'anulada'}
                              title={sale.status === 'anulada' ? 'No se puede editar una venta anulada' : 'Editar ítems y montos'}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleEliminar(e, sale)}
                              disabled={sale.status !== 'anulada'}
                              title={sale.status === 'anulada' ? 'Eliminar permanentemente' : 'Anulá la venta primero'}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemLabel="ventas"
        onPageChange={(n) => router.push(buildUrl({ page: String(n) }, false))}
      />

      <VentaDetalleModal
        sale={selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onAnulada={handleAnulada}
        onFechaActualizada={handleFechaActualizada}
        onVoucherActualizado={handleVoucherActualizado}
      />

      {editingSale && (
        <EditarVentaModal
          saleId={editingSale.id}
          saleNumero={editingSale.numero_venta}
          onClose={() => setEditingSale(null)}
          onSaved={() => { setEditingSale(null); startTransition(() => router.refresh()) }}
        />
      )}
    </div>
  )
}
