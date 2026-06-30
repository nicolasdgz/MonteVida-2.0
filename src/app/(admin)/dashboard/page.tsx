import { getProfile } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { formatearMonto } from '@/utils/igv'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, ShoppingCart, Receipt,
  AlertTriangle, Package, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { TendenciaChart } from '@/dashboard/components/TendenciaChart'
import { DashboardFiltro } from '@/dashboard/components/DashboardFiltro'

// ─── date helpers ─────────────────────────────────────────────────────────────

function getDateRange(desdeParam?: string) {
  const today = new Date().toISOString().split('T')[0]

  let desde: string
  if (desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam) && desdeParam <= today) {
    desde = desdeParam
  } else {
    // default: primer día del mes actual
    const now = new Date()
    const mm  = String(now.getMonth() + 1).padStart(2, '0')
    desde = `${now.getFullYear()}-${mm}-01`
  }

  const desdeDate = new Date(desde + 'T00:00:00')
  const rangeLabel = desdeDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' — hoy'

  return { desde, hasta: today, today, rangeLabel }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color = 'slate', icon: Icon, featured = false,
}: {
  label: string
  value: string
  sub?: string
  color?: 'slate' | 'emerald' | 'red' | 'violet' | 'amber'
  icon: React.ElementType
  featured?: boolean
}) {
  const valueColor = {
    slate:   'text-foreground',
    emerald: 'text-primary',
    red:     'text-red-600 dark:text-red-400',
    violet:  'text-primary',
    amber:   'text-amber-700 dark:text-amber-400',
  }[color]
  const iconBg = {
    slate:   'bg-muted text-muted-foreground',
    emerald: 'bg-primary/10 text-primary',
    red:     'bg-red-100 text-red-600 dark:bg-red-500/8 dark:text-red-400',
    violet:  'bg-primary/10 text-primary',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-500/8 dark:text-amber-400',
  }[color]
  const borderColor = {
    slate:   'border-border',
    emerald: 'border-primary/20',
    red:     'border-red-200/80 dark:border-red-500/25',
    violet:  'border-primary/20',
    amber:   'border-amber-200/80 dark:border-amber-500/25',
  }[color]

  if (featured) {
    return (
      <div className={`bg-card shadow-sm rounded-xl h-full p-6 flex items-start gap-4 border ${borderColor}`}>
        <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] font-medium mb-2">{label}</p>
          <p className={`text-3xl font-semibold tabular-nums leading-none ${valueColor}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card border rounded-xl flex items-start gap-4 h-full p-4 shadow-sm ${borderColor}`}>
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] font-medium mb-1.5">{label}</p>
        <p className={`text-lg font-semibold tabular-nums leading-none ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}

const METODO_LABEL: Record<string, string> = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  tarjeta: 'Tarjeta', efectivo: 'Efectivo',
}

const STATUS_STYLE: Record<string, string> = {
  completada: 'bg-primary/10 text-primary',
  anulada:    'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  pendiente:  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>
}) {
  const { desde: desdeParam } = await searchParams
  const profile  = await getProfile()
  const isAdmin  = profile?.role === 'admin'
  const supabase = await createClient()
  const { desde, hasta, today, rangeLabel } = getDateRange(desdeParam)

  // ── sales this month ──────────────────────────────────────────────────────
  const salesQuery = supabase
    .from('sales')
    .select('total, igv_monto, staff_id, fecha_venta')
    .eq('status', 'completada')
    .gte('fecha_venta', desde)
    .lte('fecha_venta', hasta)

  if (!isAdmin) salesQuery.eq('staff_id', profile!.id)

  // ── egresos del período (admin): gastos operativos + compras mercadería ──────
  const expensesQuery = isAdmin
    ? supabase.from('expenses').select('monto').gte('fecha', desde).lte('fecha', hasta)
    : Promise.resolve({ data: [] })

  const comprasQuery = isAdmin
    ? supabase.from('compras').select('total').gte('fecha', desde).lte('fecha', hasta)
    : Promise.resolve({ data: [] })

  // ── stock alerts ─────────────────────────────────────────────────────────
  const sinStockQuery  = supabase.from('products').select('id, nombre, codigo, unidad').eq('activo', true).eq('stock', 0).limit(8)
  const stockBajoQuery = supabase.from('products').select('id, nombre, codigo, stock, stock_minimo, unidad').eq('activo', true).gt('stock', 0).filter('stock', 'lte', 'stock_minimo').limit(8)

  // ── tendencia últimos 30 días ─────────────────────────────────────────────
  const hace30 = new Date(); hace30.setDate(hace30.getDate() - 29)
  const tendenciaQuery = supabase
    .from('sales')
    .select('fecha_venta, total')
    .eq('status', 'completada')
    .gte('fecha_venta', hace30.toISOString().split('T')[0])
    .order('fecha_venta', { ascending: true })

  if (!isAdmin) tendenciaQuery.eq('staff_id', profile!.id)

  // ── recent sales ──────────────────────────────────────────────────────────
  const recentQuery = supabase
    .from('sales')
    .select('id, numero_venta, fecha_venta, total, metodo_pago, status, profiles(full_name), clientes(nombre, es_anonimo)')
    .order('fecha_venta', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(7)

  if (!isAdmin) recentQuery.eq('staff_id', profile!.id)

  // ── run all in parallel ───────────────────────────────────────────────────
  const [
    { data: salesData },
    { data: expensesData },
    { data: comprasData },
    { data: sinStockData },
    { data: stockBajoData },
    { data: tendenciaData },
    { data: recentData },
  ] = await Promise.all([
    salesQuery,
    expensesQuery,
    comprasQuery,
    sinStockQuery,
    stockBajoQuery,
    tendenciaQuery,
    recentQuery,
  ])

  // ── compute KPIs ─────────────────────────────────────────────────────────
  type SaleRow = { total: number; fecha_venta: string; staff_id: string }
  const sales = (salesData ?? []) as SaleRow[]

  const ventasMes           = sales.reduce((s, v) => s + v.total, 0)
  const countMes            = sales.length
  const ventasHoy           = sales.filter((v) => v.fecha_venta === today).reduce((s, v) => s + v.total, 0)
  const countHoy            = sales.filter((v) => v.fecha_venta === today).length
  const gastosOperativos    = ((expensesData ?? []) as { monto: number }[]).reduce((s, e) => s + e.monto, 0)
  const comprasMercaderia   = ((comprasData   ?? []) as { total: number }[]).reduce((s, c) => s + c.total, 0)
  const gastosMes           = gastosOperativos + comprasMercaderia
  const utilidadNeta        = ventasMes - gastosMes

  // ── stock alert filter ────────────────────────────────────────────────────
  type ProductRow = { id: string; nombre: string; codigo: string | null; stock: number; stock_minimo: number; unidad: string }
  const sinStock  = (sinStockData ?? []) as { id: string; nombre: string; codigo: string | null; unidad: string }[]
  const allStockBajo = (stockBajoData ?? []) as ProductRow[]
  const stockBajo = allStockBajo.filter((p) => p.stock <= p.stock_minimo)

  // ── recent sales ──────────────────────────────────────────────────────────
  type RecentSale = {
    id: string; numero_venta: number; fecha_venta: string; total: number
    metodo_pago: string; status: string
    profiles: { full_name: string }
    clientes: { nombre: string; es_anonimo: boolean } | null
  }
  const recent = (recentData ?? []) as unknown as RecentSale[]

  const totalAlertas = sinStock.length + stockBajo.length
  const firstName    = profile?.full_name?.split(' ')[0] ?? 'bienvenido'

  // Agrupar tendencia por fecha (sumar ventas del mismo día)
  type TendenciaRow = { fecha_venta: string; total: number }
  const tendenciaAgrupada = Object.values(
    ((tendenciaData ?? []) as TendenciaRow[]).reduce<Record<string, { fecha: string; total: number }>>((acc, row) => {
      const f = row.fecha_venta
      if (!acc[f]) acc[f] = { fecha: f, total: 0 }
      acc[f].total += row.total
      return acc
    }, {})
  ).sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <div className="space-y-7 relative">

      {/* Ambient glow — visible solo en dark mode */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          background: 'radial-gradient(ellipse 55% 45% at 75% 15%, rgba(124,58,237,0.14) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(16,185,129,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between">
          <h1
            className="text-3xl text-foreground italic leading-tight tracking-[-0.02em]"
          >
            Hola, {firstName}
          </h1>
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-[0.07em] border ${
            isAdmin
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {profile?.role}
          </span>
        </div>
        {/* Filtro de fecha */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DashboardFiltro currentDesde={desde} />
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {rangeLabel}
          </span>
        </div>
      </div>

      {/* KPIs — bento grid asimétrico */}
      <div className="relative z-10">
        {isAdmin ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Featured — ventas del mes, ocupa 2 columnas */}
            <div
              className="col-span-2 stagger-item"
              style={{ animationDelay: '0ms' }}
            >
              <KpiCard
                label="Ventas del período"
                value={formatearMonto(ventasMes)}
                sub={`${countMes} ${countMes === 1 ? 'venta completada' : 'ventas completadas'}`}
                color="emerald"
                icon={TrendingUp}
                featured
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: '60ms' }}>
              <KpiCard
                label="Egresos del período"
                value={formatearMonto(gastosMes)}
                sub={comprasMercaderia > 0
                  ? `${formatearMonto(gastosOperativos)} op. · ${formatearMonto(comprasMercaderia)} compras`
                  : gastosOperativos > 0 ? 'Solo gastos operativos' : undefined
                }
                color="red"
                icon={Receipt}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: '120ms' }}>
              <KpiCard
                label="Utilidad neta"
                value={formatearMonto(utilidadNeta)}
                sub={utilidadNeta >= 0 ? '▲ positiva' : '▼ negativa'}
                color={utilidadNeta >= 0 ? 'violet' : 'red'}
                icon={utilidadNeta >= 0 ? TrendingUp : TrendingDown}
              />
            </div>
            {/* Alertas — ocupa toda la fila inferior */}
            <div
              className="col-span-2 md:col-span-4 stagger-item"
              style={{ animationDelay: '180ms' }}
            >
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-6 shadow-sm">
                <div className={`p-2 rounded-lg shrink-0 ${totalAlertas === 0 ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/8 dark:text-amber-400'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] font-medium mb-0.5">Alertas de stock</p>
                  <p className={`text-lg font-semibold tabular-nums ${totalAlertas === 0 ? 'text-foreground' : 'text-amber-700 dark:text-amber-400'}`}>
                    {totalAlertas === 0 ? 'Todo en orden' : `${totalAlertas} alerta${totalAlertas > 1 ? 's' : ''}`}
                  </p>
                </div>
                {totalAlertas > 0 && (
                  <div className="flex gap-4 ml-4 pl-4 border-l border-border">
                    {sinStock.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">Sin stock</p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">{sinStock.length}</p>
                      </div>
                    )}
                    {stockBajo.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">Stock bajo</p>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{stockBajo.length}</p>
                      </div>
                    )}
                  </div>
                )}
                <Link
                  href="/inventario"
                  className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors shrink-0"
                >
                  Ver inventario <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1 stagger-item" style={{ animationDelay: '0ms' }}>
              <KpiCard
                label="Ventas hoy"
                value={formatearMonto(ventasHoy)}
                sub={`${countHoy} ${countHoy === 1 ? 'venta' : 'ventas'}`}
                color="emerald"
                icon={TrendingUp}
                featured
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: '60ms' }}>
              <KpiCard
                label="Ventas del período"
                value={formatearMonto(ventasMes)}
                sub={`${countMes} en total`}
                color="violet"
                icon={ShoppingCart}
              />
            </div>
            <div className="stagger-item" style={{ animationDelay: '120ms' }}>
              <KpiCard
                label="Alertas de stock"
                value={String(totalAlertas)}
                sub={totalAlertas === 0 ? 'todo en orden' : `${sinStock.length} sin stock · ${stockBajo.length} bajo`}
                color={totalAlertas === 0 ? 'slate' : 'amber'}
                icon={AlertTriangle}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tendencia */}
      <div className="relative z-10 bg-card shadow-sm border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em]">
            Ventas — últimos 30 días
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatearMonto(tendenciaAgrupada.reduce((s, d) => s + d.total, 0))} total
          </span>
        </div>
        <div className="px-2 py-4">
          <TendenciaChart data={tendenciaAgrupada} />
        </div>
      </div>

      {/* Body grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Stock alerts */}
        <div className="bg-card shadow-sm border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em] flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-muted-foreground" />
              Inventario
            </h2>
            <Link
              href="/inventario"
              className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-[0.05em]"
            >
              Ver todo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {totalAlertas === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <CheckCircle2 className="w-7 h-7 text-primary/30" />
              <p className="text-sm">Stock en orden</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {sinStock.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3 stagger-item"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] bg-red-500/10 text-red-400 shrink-0">
                    Sin stock
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{p.nombre}</p>
                    {p.codigo && <p className="text-[11px] text-muted-foreground">{p.codigo}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">0 {p.unidad}</span>
                </div>
              ))}
              {stockBajo.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3 stagger-item"
                  style={{ animationDelay: `${(sinStock.length + i) * 50}ms` }}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] bg-amber-500/10 text-amber-400 shrink-0">
                    Stock bajo
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{p.nombre}</p>
                    {p.codigo && <p className="text-[11px] text-muted-foreground">{p.codigo}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {p.stock}/{p.stock_minimo} {p.unidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sales */}
        <div className="bg-card shadow-sm border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em] flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
              Ventas recientes
            </h2>
            <Link
              href="/ventas/historial"
              className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-[0.05em]"
            >
              Ver todo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <ShoppingCart className="w-7 h-7 opacity-20" />
              <p className="text-sm">Sin ventas registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recent.map((sale, i) => {
                const clienteNombre = sale.clientes?.nombre ?? 'Usuario'
                const esAnonimo     = !sale.clientes || sale.clientes.es_anonimo
                return (
                  <div
                    key={sale.id}
                    className="flex items-center gap-3 px-5 py-3 stagger-item"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">#{sale.numero_venta}</span>
                        <span className={`text-sm truncate ${esAnonimo ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {clienteNombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(sale.fecha_venta + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        </span>
                        {isAdmin && (
                          <span className="text-[11px] text-muted-foreground">· {sale.profiles.full_name.split(' ')[0]}</span>
                        )}
                        <span className="text-[11px] text-muted-foreground">· {METODO_LABEL[sale.metodo_pago] ?? sale.metodo_pago}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatearMonto(sale.total)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.04em] ${STATUS_STYLE[sale.status]}`}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
