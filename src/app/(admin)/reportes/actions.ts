'use server'

import { requireAdmin } from '@/lib/dal'
import type { PaymentMethod, ExpenseCategory } from '@/types/database'
import type { KpisData, VentaPorMetodo, GastoPorCategoria, TopProducto } from '@/reportes/types'

interface ActionResult<T> { error: string | null; data: T | null }

// ─── KPIs (tab "Resumen financiero") ─────────────────────────────────────────
export async function fetchKpis(desde: string, hasta: string): Promise<ActionResult<KpisData>> {
  let supabase
  try { ({ supabase } = await requireAdmin()) } catch { return { error: 'Sin permiso.', data: null } }

  type SaleRow    = { id: string; total: number; igv_monto: number }
  type ExpenseRow = { monto: number }
  type CompraRow  = { total: number }

  const [salesRes, expensesRes, comprasRes] = await Promise.all([
    supabase.from('sales').select('id, total, igv_monto').eq('status', 'completada').gte('fecha_venta', desde).lte('fecha_venta', hasta),
    supabase.from('expenses').select('monto').gte('fecha', desde).lte('fecha', hasta),
    supabase.from('compras').select('total').gte('fecha', desde).lte('fecha', hasta),
  ])

  const sales       = salesRes.data    ?? []
  const expenses    = expensesRes.data ?? []
  const comprasData = comprasRes.data  ?? []
  const saleIds     = sales.map((s) => s.id)

  type ItemRow = { cantidad: number; precio_costo: number }
  let items: ItemRow[] = []
  if (saleIds.length > 0) {
    const { data } = await supabase
      .from('sale_items')
      .select('cantidad, precio_costo')
      .in('sale_id', saleIds)
    items = (data ?? []) as ItemRow[]
  }

  const totalVentas           = sales.reduce((s, v) => s + v.total, 0)
  const igvRecaudado          = sales.reduce((s, v) => s + v.igv_monto, 0)
  const cantidadVentas        = sales.length
  const totalCosto            = items.reduce((s, i) => s + i.cantidad * i.precio_costo, 0)
  const utilidadBruta         = totalVentas - totalCosto
  const totalGastosOperativos = expenses.reduce((s, e) => s + e.monto, 0)
  const totalCompras          = comprasData.reduce((s, c) => s + c.total, 0)
  const totalEgresos          = totalGastosOperativos + totalCompras
  const utilidadNeta          = utilidadBruta - totalEgresos

  return {
    error: null,
    data: { totalVentas, totalCosto, utilidadBruta, totalGastosOperativos, totalCompras, totalEgresos, utilidadNeta, igvRecaudado, cantidadVentas },
  }
}

// ─── Ventas por método de pago ───────────────────────────────────────────────
export async function fetchVentasPorMetodo(desde: string, hasta: string): Promise<ActionResult<VentaPorMetodo[]>> {
  let supabase
  try { ({ supabase } = await requireAdmin()) } catch { return { error: 'Sin permiso.', data: null } }

  const { data } = await supabase
    .from('sales')
    .select('total, metodo_pago')
    .eq('status', 'completada')
    .gte('fecha_venta', desde)
    .lte('fecha_venta', hasta)

  const byMethod: Record<string, { total: number; cantidad: number }> = {}
  for (const s of data ?? []) {
    const m = s.metodo_pago
    if (!byMethod[m]) byMethod[m] = { total: 0, cantidad: 0 }
    byMethod[m].total    += s.total
    byMethod[m].cantidad += 1
  }

  const result = Object.entries(byMethod)
    .map(([metodo, v]) => ({ metodo: metodo as PaymentMethod, ...v }))
    .sort((a, b) => b.total - a.total)

  return { error: null, data: result }
}

// ─── Gastos por categoría ────────────────────────────────────────────────────
export async function fetchGastosPorCategoria(desde: string, hasta: string): Promise<ActionResult<GastoPorCategoria[]>> {
  let supabase
  try { ({ supabase } = await requireAdmin()) } catch { return { error: 'Sin permiso.', data: null } }

  type ExpenseRow = { categoria: ExpenseCategory; monto: number }
  type CompraRow  = { total: number }

  const [expensesRes, comprasRes] = await Promise.all([
    supabase.from('expenses').select('categoria, monto').gte('fecha', desde).lte('fecha', hasta),
    supabase.from('compras').select('total').gte('fecha', desde).lte('fecha', hasta),
  ])

  const byCat: Record<string, { total: number; cantidad: number }> = {}
  for (const e of expensesRes.data ?? []) {
    const c = e.categoria
    if (!byCat[c]) byCat[c] = { total: 0, cantidad: 0 }
    byCat[c].total    += e.monto
    byCat[c].cantidad += 1
  }

  const compras = comprasRes.data ?? []
  if (compras.length > 0) {
    byCat['compras_mercaderia'] = {
      total: compras.reduce((s, c) => s + c.total, 0),
      cantidad: compras.length,
    }
  }

  const result = Object.entries(byCat)
    .map(([categoria, v]) => ({ categoria, ...v }))
    .sort((a, b) => b.total - a.total)

  return { error: null, data: result }
}

// ─── Productos más vendidos ──────────────────────────────────────────────────
export async function fetchTopProductos(desde: string, hasta: string): Promise<ActionResult<TopProducto[]>> {
  let supabase
  try { ({ supabase } = await requireAdmin()) } catch { return { error: 'Sin permiso.', data: null } }

  type SaleIdRow = { id: string }
  const { data: sales } = await supabase
    .from('sales')
    .select('id')
    .eq('status', 'completada')
    .gte('fecha_venta', desde)
    .lte('fecha_venta', hasta)

  const saleIds = (sales ?? []).map((s) => s.id)
  if (saleIds.length === 0) return { error: null, data: [] }

  type ItemRow = {
    cantidad: number
    subtotal: number
    product_id: string
    products: { nombre: string; codigo: string | null } | null
  }
  const { data: items } = await supabase
    .from('sale_items')
    .select('cantidad, subtotal, product_id, products(nombre, codigo)')
    .in('sale_id', saleIds)

  const productMap: Record<string, TopProducto> = {}
  for (const item of items ?? []) {
    const p = item.products
    if (!p) continue
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = { nombre: p.nombre, codigo: p.codigo, cantidad: 0, revenue: 0 }
    }
    productMap[item.product_id].cantidad += item.cantidad
    productMap[item.product_id].revenue  += item.subtotal ?? 0
  }

  const result = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return { error: null, data: result }
}
