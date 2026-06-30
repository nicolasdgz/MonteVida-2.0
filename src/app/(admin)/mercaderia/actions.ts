'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/dal'
import { redondearMonto } from '@/utils/igv'
import type { Database } from '@/types/database'
import type { CompraItemInput, GastoAdicionalInput, CompraItem, CompraGasto, Compra } from '@/mercaderia/types'

async function ajustarStock(
  supabase: SupabaseClient<Database>,
  productId: string,
  delta: number,
): Promise<string | null> {
  const { data: prod, error: fetchError } = await supabase
    .from('products').select('stock').eq('id', productId).single()
  if (fetchError || !prod) {
    return `No se pudo leer el stock del producto: ${fetchError?.message ?? 'producto no encontrado'}`
  }
  const actual = (prod as { stock: number }).stock
  const nuevoStock = delta >= 0 ? actual + delta : Math.max(0, actual + delta)
  const { error: updateError } = await supabase
    .from('products').update({ stock: nuevoStock }).eq('id', productId)
  if (updateError) {
    return `No se pudo actualizar el stock: ${updateError.message}`
  }
  return null
}

export async function registrarCompra(
  items: CompraItemInput[],
  gastos: GastoAdicionalInput[],
  proveedor: string,
  fecha: string,
  notas: string,
): Promise<{ error: string | null }> {
  let user, supabase
  try {
    ({ user, supabase } = await requireAdmin())
  } catch (e) {
    return { error: (e as Error).message }
  }

  if (!items.length) return { error: 'Agregá al menos un producto.' }

  const totalProductos = items.reduce((s, i) => s + i.cantidad * i.precio_costo, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const total = redondearMonto(totalProductos + totalGastos)

  const { data: compraData, error: compraError } = await supabase
    .from('compras')
    .insert({
      admin_id: user.id,
      proveedor: proveedor.trim() || null,
      fecha,
      total,
      notas: notas.trim() || null,
    })
    .select('id')
    .single()

  if (compraError) return { error: compraError.message }
  const compraId = (compraData as { id: string }).id

  const { error: itemsError } = await supabase
    .from('compra_items')
    .insert(items.map((i) => ({
      compra_id: compraId,
      product_id: i.product_id,
      cantidad: i.cantidad,
      precio_costo: i.precio_costo,
      subtotal: redondearMonto(i.cantidad * i.precio_costo),
    })))

  if (itemsError) {
    await supabase.from('compras').delete().eq('id', compraId)
    return { error: itemsError.message }
  }

  // Insertar gastos adicionales si los hay
  if (gastos.length > 0) {
    const { error: gastosError } = await supabase
      .from('compra_gastos')
      .insert(gastos.map((g) => ({
        compra_id: compraId,
        concepto: g.concepto.trim(),
        monto: redondearMonto(g.monto),
      })))

    if (gastosError) return { error: `Error al guardar gastos adicionales: ${gastosError.message}` }
  }

  for (const item of items) {
    const stockError = await ajustarStock(supabase, item.product_id, item.cantidad)
    if (stockError) {
      revalidatePath('/mercaderia')
      revalidatePath('/inventario')
      return { error: `Compra registrada, pero falló el ajuste de stock: ${stockError}` }
    }
  }

  revalidatePath('/mercaderia')
  revalidatePath('/inventario')
  return { error: null }
}

export async function fetchHistorialCompras(
  desde: string,
  hasta: string,
): Promise<{ error: string | null; data: Compra[] }> {
  try {
    const { supabase } = await requireAdmin()

    const { data, error } = await supabase
      .from('compras')
      .select('*, profiles(full_name), compra_items(id, product_id, cantidad, precio_costo, subtotal, products(nombre, unidad))')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return { error: error.message, data: [] }

    const compras = (data ?? []) as (Omit<Compra, 'compra_gastos'>)[]
    if (compras.length === 0) return { error: null, data: [] }

    // Query separada para evitar dependencia del cache de relaciones de PostgREST
    const { data: gastosData, error: gastosError } = await supabase
      .from('compra_gastos')
      .select('id, compra_id, concepto, monto')
      .in('compra_id', compras.map((c) => c.id))

    if (gastosError) {
      return { error: `Error al cargar gastos adicionales: ${gastosError.message}`, data: [] }
    }

    const gastosPorCompra = ((gastosData ?? []) as { id: string; compra_id: string; concepto: string; monto: number }[])
      .reduce<Record<string, CompraGasto[]>>((acc, g) => {
        if (!acc[g.compra_id]) acc[g.compra_id] = []
        acc[g.compra_id].push({ id: g.id, concepto: g.concepto, monto: g.monto })
        return acc
      }, {})

    return {
      error: null,
      data: compras.map((c) => ({ ...c, compra_gastos: gastosPorCompra[c.id] ?? [] })),
    }
  } catch (e) {
    return { error: (e as Error).message, data: [] }
  }
}

export async function actualizarCompra(
  id: string,
  itemsActualizar: { id: string; cantidad: number; precio_costo: number }[],
  itemsEliminar: { id: string; product_id: string; cantidad: number }[],
  itemsNuevos: CompraItemInput[],
  gastos: GastoAdicionalInput[],
  proveedor: string,
  fecha: string,
  notas: string,
): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requireAdmin()

    if (itemsActualizar.length + itemsNuevos.length === 0) {
      return { error: 'La compra debe tener al menos un producto.' }
    }

    const totalActualizar = itemsActualizar.reduce((s, i) => s + i.cantidad * i.precio_costo, 0)
    const totalNuevos = itemsNuevos.reduce((s, i) => s + i.cantidad * i.precio_costo, 0)
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
    const total = redondearMonto(totalActualizar + totalNuevos + totalGastos)

    const { error: headerError } = await supabase
      .from('compras')
      .update({ proveedor: proveedor.trim() || null, fecha, notas: notas.trim() || null, total })
      .eq('id', id)

    if (headerError) return { error: headerError.message }

    for (const item of itemsActualizar) {
      await supabase
        .from('compra_items')
        .update({
          cantidad: item.cantidad,
          precio_costo: item.precio_costo,
          subtotal: redondearMonto(item.cantidad * item.precio_costo),
        })
        .eq('id', item.id)
    }

    if (itemsEliminar.length > 0) {
      await supabase
        .from('compra_items')
        .delete()
        .in('id', itemsEliminar.map((i) => i.id))

      for (const item of itemsEliminar) {
        const stockError = await ajustarStock(supabase, item.product_id, -item.cantidad)
        if (stockError) return { error: stockError }
      }
    }

    if (itemsNuevos.length > 0) {
      const { error: insertError } = await supabase
        .from('compra_items')
        .insert(itemsNuevos.map((i) => ({
          compra_id: id,
          product_id: i.product_id,
          cantidad: i.cantidad,
          precio_costo: i.precio_costo,
          subtotal: redondearMonto(i.cantidad * i.precio_costo),
        })))

      if (insertError) return { error: insertError.message }

      for (const item of itemsNuevos) {
        const stockError = await ajustarStock(supabase, item.product_id, item.cantidad)
        if (stockError) return { error: stockError }
      }
    }

    await supabase.from('compra_gastos').delete().eq('compra_id', id)

    if (gastos.length > 0) {
      await supabase
        .from('compra_gastos')
        .insert(gastos.map((g) => ({
          compra_id: id,
          concepto: g.concepto.trim(),
          monto: redondearMonto(g.monto),
        })))
    }

    revalidatePath('/mercaderia')
    if (itemsEliminar.length > 0 || itemsNuevos.length > 0) {
      revalidatePath('/inventario')
    }
    return { error: null }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function eliminarCompra(id: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requireAdmin()

    const { data: items } = await supabase
      .from('compra_items')
      .select('product_id, cantidad')
      .eq('compra_id', id)

    for (const item of (items ?? []) as { product_id: string; cantidad: number }[]) {
      const stockError = await ajustarStock(supabase, item.product_id, -item.cantidad)
      if (stockError) return { error: `No se eliminó la compra: ${stockError}` }
    }

    const { error } = await supabase.from('compras').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/mercaderia')
    revalidatePath('/inventario')
    return { error: null }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
