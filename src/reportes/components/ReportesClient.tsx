'use client'

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  fetchKpis,
  fetchVentasPorMetodo,
  fetchGastosPorCategoria,
  fetchTopProductos,
} from '@/app/(admin)/reportes/actions'
import type {
  KpisData,
  VentaPorMetodo,
  GastoPorCategoria,
  TopProducto,
} from '@/reportes/types'
import { formatearMonto } from '@/utils/igv'
import toast from 'react-hot-toast'
import type { PaymentMethod } from '@/types/database'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getMonthRange(year: number, month: number) {
  const mm   = String(month + 1).padStart(2, '0')
  const last = new Date(year, month + 1, 0).getDate()
  return {
    desde: `${year}-${mm}-01`,
    hasta: `${year}-${mm}-${String(last).padStart(2, '0')}`,
  }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ─── labels ──────────────────────────────────────────────────────────────────

const METODO_LABEL: Record<PaymentMethod, string> = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  tarjeta: 'Tarjeta débito', efectivo: 'Efectivo', whatsapp: 'WhatsApp',
}

const CATEGORIA_LABEL: Record<string, string> = {
  alquiler: 'Alquiler', servicios: 'Servicios', personal: 'Personal',
  marketing: 'Marketing', logistica: 'Logística', mantenimiento: 'Mantenimiento',
  impuestos: 'Impuestos', mercaderia: 'Mercadería', otros: 'Otros',
  compras_mercaderia: 'Compras mercadería',
}

// ─── tabs ────────────────────────────────────────────────────────────────────

type TabKey = 'resumen' | 'ventas' | 'gastos' | 'productos'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resumen',   label: 'Resumen financiero' },
  { key: 'ventas',    label: 'Ventas por método' },
  { key: 'gastos',    label: 'Gastos por categoría' },
  { key: 'productos', label: 'Productos más vendidos' },
]

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color = 'slate',
}: {
  label: string
  value: string
  sub?: string
  color?: 'slate' | 'emerald' | 'red' | 'violet' | 'amber'
}) {
  const valueColor = {
    slate:   'text-foreground',
    emerald: 'text-emerald-400',
    red:     'text-red-400',
    violet:  'text-primary',
    amber:   'text-amber-400',
  }[color]

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] font-medium mb-2">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function BarList({
  items, total, labelFn,
}: {
  items: { key: string; total: number; cantidad: number }[]
  total: number
  labelFn: (key: string) => string
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
  const max = Math.max(...items.map((i) => i.total), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{labelFn(item.key)}</span>
            <span className="text-foreground tabular-nums font-medium">{formatearMonto(item.total)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all duration-500"
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.cantidad} {item.cantidad === 1 ? 'registro' : 'registros'} · {total > 0 ? ((item.total / total) * 100).toFixed(1) : 0}%
          </p>
        </div>
      ))}
    </div>
  )
}

function ResumenTab({ kpis }: { kpis: KpisData }) {
  const utilidadNetaColor = kpis.utilidadNeta > 0 ? 'emerald' : kpis.utilidadNeta < 0 ? 'red' : 'slate'
  const utilidadNetaIcon  = kpis.utilidadNeta > 0
    ? <TrendingUp className="w-3.5 h-3.5" />
    : kpis.utilidadNeta < 0
    ? <TrendingDown className="w-3.5 h-3.5" />
    : <Minus className="w-3.5 h-3.5" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Total ventas"       value={formatearMonto(kpis.totalVentas)}           sub={`${kpis.cantidadVentas} ${kpis.cantidadVentas === 1 ? 'venta' : 'ventas'}`} color="slate" />
        <KpiCard label="Costo de ventas"    value={formatearMonto(kpis.totalCosto)}            color="slate" />
        <KpiCard label="Utilidad bruta"     value={formatearMonto(kpis.utilidadBruta)}         color={kpis.utilidadBruta >= 0 ? 'emerald' : 'red'} />
        <KpiCard label="Gastos operativos"  value={formatearMonto(kpis.totalGastosOperativos)} color="red" />
        <KpiCard label="Compras mercadería" value={formatearMonto(kpis.totalCompras)}          color="red" />
        <KpiCard label="Total egresos"      value={formatearMonto(kpis.totalEgresos)}          color="red" />
        <KpiCard label="Utilidad neta"      value={formatearMonto(kpis.utilidadNeta)}          sub={kpis.utilidadNeta !== 0 ? (kpis.utilidadNeta > 0 ? '▲ positiva' : '▼ negativa') : undefined} color={utilidadNetaColor} />
        <KpiCard label="IGV recaudado"      value={formatearMonto(kpis.igvRecaudado)}          color="amber" />
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        kpis.utilidadNeta > 0
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
          : kpis.utilidadNeta < 0
          ? 'bg-red-500/5 border-red-500/20 text-red-400'
          : 'bg-card/50 border-border text-muted-foreground'
      }`}>
        {utilidadNetaIcon}
        <span className="text-sm font-medium">
          Utilidad neta del período:{' '}
          <span className="font-bold tabular-nums">{formatearMonto(kpis.utilidadNeta)}</span>
        </span>
      </div>
    </div>
  )
}

function VentasPorMetodoTab({ data }: { data: VentaPorMetodo[] }) {
  const total = data.reduce((s, v) => s + v.total, 0)
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em] mb-4">Ventas por método de pago</h3>
      <BarList
        items={data.map((v) => ({ key: v.metodo, total: v.total, cantidad: v.cantidad }))}
        total={total}
        labelFn={(k) => METODO_LABEL[k as PaymentMethod] ?? k}
      />
    </div>
  )
}

function GastosPorCategoriaTab({ data }: { data: GastoPorCategoria[] }) {
  const total = data.reduce((s, g) => s + g.total, 0)
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em] mb-4">Gastos por categoría</h3>
      <BarList
        items={data.map((g) => ({ key: g.categoria, total: g.total, cantidad: g.cantidad }))}
        total={total}
        labelFn={(k) => CATEGORIA_LABEL[k] ?? k}
      />
    </div>
  )
}

function TopProductosTab({ data }: { data: TopProducto[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">Productos más vendidos</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos en este período</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left  py-3 px-5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">#</th>
                <th className="text-left  py-3 px-5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Producto</th>
                <th className="text-right py-3 px-5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Unidades</th>
                <th className="text-right py-3 px-5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((p, i) => (
                <tr key={i} className="hover:bg-primary/8 transition-colors">
                  <td className="py-3 px-5 text-muted-foreground text-xs font-mono">{i + 1}</td>
                  <td className="py-3 px-5">
                    <p className="text-foreground">{p.nombre}</p>
                    {p.codigo && <p className="text-xs text-muted-foreground">{p.codigo}</p>}
                  </td>
                  <td className="py-3 px-5 text-right text-muted-foreground tabular-nums">{p.cantidad}</td>
                  <td className="py-3 px-5 text-right font-semibold text-foreground tabular-nums">
                    {formatearMonto(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── presets ─────────────────────────────────────────────────────────────────

function getPresets() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  const lastM = m === 0 ? 11 : m - 1
  const lastY = m === 0 ? y - 1 : y

  const q = Math.floor(m / 3)
  const qStart = q * 3

  return [
    { label: 'Este mes',       ...getMonthRange(y, m) },
    { label: 'Mes anterior',   ...getMonthRange(lastY, lastM) },
    { label: 'Este trimestre', desde: `${y}-${String(qStart + 1).padStart(2, '0')}-01`, hasta: todayStr() },
    { label: 'Este año',       desde: `${y}-01-01`, hasta: todayStr() },
  ]
}

// ─── cache type ──────────────────────────────────────────────────────────────

interface CacheEntry<T> { key: string; data: T }

interface Cache {
  resumen:   CacheEntry<KpisData>           | null
  ventas:    CacheEntry<VentaPorMetodo[]>   | null
  gastos:    CacheEntry<GastoPorCategoria[]> | null
  productos: CacheEntry<TopProducto[]>      | null
}

// ─── main component ──────────────────────────────────────────────────────────

interface Props {
  desde: string
  hasta: string
  initialKpis: KpisData
}

export function ReportesClient({ desde: initDesde, hasta: initHasta, initialKpis }: Props) {
  const presets = getPresets()

  // applied (drive fetch)
  const [desde, setDesde]           = useState(initDesde)
  const [hasta, setHasta]           = useState(initHasta)
  // form inputs (custom mode)
  const [formDesde, setFormDesde]   = useState(initDesde)
  const [formHasta, setFormHasta]   = useState(initHasta)

  const [activeTab, setActiveTab]   = useState<TabKey>('resumen')
  const [activePreset, setActive]   = useState(presets[0].label)
  const [customMode, setCustomMode] = useState(false)
  const [loading, setLoading]       = useState(false)

  const initialKey = `${initDesde}_${initHasta}`
  const [cache, setCache] = useState<Cache>({
    resumen:   { key: initialKey, data: initialKpis },
    ventas:    null,
    gastos:    null,
    productos: null,
  })

  const currentKey = `${desde}_${hasta}`

  // Fetch the active tab's data if not cached for the current range
  useEffect(() => {
    const entry = cache[activeTab]
    if (entry?.key === currentKey) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function run() {
      try {
        if (activeTab === 'resumen') {
          const { data, error } = await fetchKpis(desde, hasta)
          if (cancelled) return
          if (error) { toast.error(error); return }
          setCache((c) => ({ ...c, resumen: { key: currentKey, data: data! } }))
        } else if (activeTab === 'ventas') {
          const { data, error } = await fetchVentasPorMetodo(desde, hasta)
          if (cancelled) return
          if (error) { toast.error(error); return }
          setCache((c) => ({ ...c, ventas: { key: currentKey, data: data ?? [] } }))
        } else if (activeTab === 'gastos') {
          const { data, error } = await fetchGastosPorCategoria(desde, hasta)
          if (cancelled) return
          if (error) { toast.error(error); return }
          setCache((c) => ({ ...c, gastos: { key: currentKey, data: data ?? [] } }))
        } else {
          const { data, error } = await fetchTopProductos(desde, hasta)
          if (cancelled) return
          if (error) { toast.error(error); return }
          setCache((c) => ({ ...c, productos: { key: currentKey, data: data ?? [] } }))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentKey])

  function selectPreset(p: { label: string; desde: string; hasta: string }) {
    setActive(p.label)
    setCustomMode(false)
    setDesde(p.desde);    setHasta(p.hasta)
    setFormDesde(p.desde); setFormHasta(p.hasta)
  }

  function handleCustom() {
    if (!formDesde || !formHasta || formDesde > formHasta) {
      toast.error('Rango de fechas inválido.')
      return
    }
    setDesde(formDesde)
    setHasta(formHasta)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen financiero del negocio</p>
      </div>

      {/* Date range selector */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => selectPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activePreset === p.label && !customMode
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-primary hover:border-primary/30'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => { setCustomMode(true); setActive('') }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              customMode
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:text-primary hover:border-primary/30'
            }`}
          >
            Personalizado
          </button>
        </div>

        {customMode && (
          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Desde</label>
              <input
                type="date"
                value={formDesde}
                onChange={(e) => setFormDesde(e.target.value)}
                className="input-field w-full sm:w-40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
              <input
                type="date"
                value={formHasta}
                onChange={(e) => setFormHasta(e.target.value)}
                className="input-field w-full sm:w-40 text-sm"
              />
            </div>
            <button
              onClick={handleCustom}
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
            >
              Consultar
            </button>
          </div>
        )}

        {!customMode && (
          <p className="text-xs text-muted-foreground">
            {new Date(desde + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' — '}
            {new Date(hasta + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = activeTab === t.key
          const cached = cache[t.key]?.key === currentKey
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {!cached && !active && (
                <span className="w-1 h-1 rounded-full bg-muted-foreground" title="Sin cargar para este período" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className={`transition-opacity ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        {activeTab === 'resumen' && (
          cache.resumen?.key === currentKey
            ? <ResumenTab kpis={cache.resumen.data} />
            : <TabSkeleton />
        )}
        {activeTab === 'ventas' && (
          cache.ventas?.key === currentKey
            ? <VentasPorMetodoTab data={cache.ventas.data} />
            : <TabSkeleton />
        )}
        {activeTab === 'gastos' && (
          cache.gastos?.key === currentKey
            ? <GastosPorCategoriaTab data={cache.gastos.data} />
            : <TabSkeleton />
        )}
        {activeTab === 'productos' && (
          cache.productos?.key === currentKey
            ? <TopProductosTab data={cache.productos.data} />
            : <TabSkeleton />
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex items-center gap-3 px-4 py-3 bg-card/90 border border-border rounded-xl shadow-neu dark:shadow-xl">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Cargando…</span>
          </div>
        </div>
      )}
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted border border-border rounded-xl" />
        ))}
      </div>
    </div>
  )
}
