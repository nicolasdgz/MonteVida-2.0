import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { HistorialClient } from '@/ventas/components/HistorialClient'
import type { SaleStatus, PaymentMethod } from '@/types/database'

const PAGE_SIZE = 50

const VALID_STATUSES  = new Set<string>(['pendiente', 'completada', 'anulada'])
const VALID_METODOS   = new Set<string>(['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin', 'whatsapp'])
const DATE_RE         = /^\d{4}-\d{2}-\d{2}$/

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?:   string
    status?: string
    metodo?: string
    desde?:  string
    hasta?:  string
  }>
}) {
  const { page: pageParam, status, metodo, desde, hasta } = await searchParams

  const page   = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const filtroStatus = VALID_STATUSES.has(status ?? '')  ? (status as SaleStatus)  : null
  const filtroMetodo = VALID_METODOS.has(metodo ?? '')   ? (metodo as PaymentMethod) : null
  const filtroDesde  = desde && DATE_RE.test(desde)      ? desde                    : null
  const filtroHasta  = hasta && DATE_RE.test(hasta)      ? hasta                    : null

  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('sales')
    .select('*, profiles(full_name), clientes(nombre, es_anonimo)')
    .order('fecha_venta', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  let qCount = supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })

  if (!isAdmin)       { query = query.eq('staff_id', profile!.id);   qCount = qCount.eq('staff_id', profile!.id)   }
  if (filtroStatus)   { query = query.eq('status', filtroStatus);     qCount = qCount.eq('status', filtroStatus)    }
  if (filtroMetodo)   { query = query.eq('metodo_pago', filtroMetodo); qCount = qCount.eq('metodo_pago', filtroMetodo) }
  if (filtroDesde)    { query = query.gte('fecha_venta', filtroDesde); qCount = qCount.gte('fecha_venta', filtroDesde) }
  if (filtroHasta)    { query = query.lte('fecha_venta', filtroHasta); qCount = qCount.lte('fecha_venta', filtroHasta) }

  const [{ data: sales, error: salesError }, { count }] = await Promise.all([query, qCount])

  if (salesError) {
    console.error('[HistorialPage] query error:', JSON.stringify(salesError))
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <HistorialClient
      sales={(sales ?? []) as Parameters<typeof HistorialClient>[0]['sales']}
      isAdmin={isAdmin}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      initStatus={filtroStatus ?? 'todos'}
      initMetodo={filtroMetodo ?? 'todos'}
      initDesde={filtroDesde ?? ''}
      initHasta={filtroHasta ?? ''}
    />
  )
}
