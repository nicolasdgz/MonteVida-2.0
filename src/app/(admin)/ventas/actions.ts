'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { verifySession, requireAdmin } from '@/lib/dal'
import { uploadFile, getFileExt } from '@/lib/storage'
import { ANONYMOUS_CLIENT_ID } from '@/lib/constants'
import { redondearMonto, IGV_DEFAULT_PCT } from '@/utils/igv'
import type { PaymentMethod } from '@/types/database'
import type { LineaInput, RegistrarResult } from '@/ventas/types'

export async function registrarVenta(formData: FormData): Promise<RegistrarResult> {
  const user = await verifySession()
  const supabase = await createClient()

  const linesJson   = formData.get('lines') as string
  const metodoPago  = formData.get('metodoPago') as PaymentMethod
  const notas       = formData.get('notas') as string
  const clienteId   = (formData.get('clienteId') as string) || ANONYMOUS_CLIENT_ID
  const fechaVenta  = (formData.get('fechaVenta') as string) || new Date().toISOString().split('T')[0]
  const voucherFile = formData.get('voucher') as File | null
  const aplicarIgv     = formData.get('aplicarIgv') !== '0'
  const descuentoMonto = parseFloat(formData.get('descuentoMonto') as string || '0') || 0

  if (!linesJson) return { error: 'Sin líneas de venta.', saleId: null }
  const lineas: LineaInput[] = JSON.parse(linesJson)
  if (!lineas.length) return { error: 'Agregá al menos un producto.', saleId: null }

  // Crear cabecera
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert({
      staff_id:    user.id,
      metodo_pago: metodoPago,
      notas:       notas || null,
      status:      'completada',
      cliente_id:  clienteId,
      fecha_venta: fechaVenta,
    })
    .select('id')
    .single()

  if (saleError) return { error: saleError.message, saleId: null }
  const saleId = (saleData as { id: string }).id

  // Insertar líneas (triggers manejan stock y totales)
  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(lineas.map((l) => ({
      sale_id:         saleId,
      product_id:      l.product_id,
      cantidad:        l.cantidad,
      precio_unitario: l.precio_unitario,
      precio_costo:    l.precio_costo,
    })))

  if (itemsError) {
    await supabase.from('sales').update({ status: 'anulada' }).eq('id', saleId)
    return { error: itemsError.message, saleId: null }
  }

  // Recalcular totales si hay descuento o sin IGV
  if (!aplicarIgv || descuentoMonto > 0) {
    const subtotalCalc = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
    const baseConDescuento = subtotalCalc - descuentoMonto
    const igvCalc = aplicarIgv
      ? await (async () => {
          const { data: cfg } = await supabase.from('configuracion').select('igv_porcentaje').single()
          const pct = ((cfg as { igv_porcentaje: number } | null)?.igv_porcentaje ?? IGV_DEFAULT_PCT) / 100
          return redondearMonto(baseConDescuento * pct)
        })()
      : 0
    await supabase.from('sales').update({
      descuento:  descuentoMonto,
      igv_monto:  igvCalc,
      total:      redondearMonto(baseConDescuento + igvCalc),
    }).eq('id', saleId)
  }

  // Subir voucher si se adjuntó
  let voucherWarning: string | undefined
  if (voucherFile && voucherFile.size > 0) {
    const { publicUrl, error: uploadError } = await uploadFile(
      'vouchers',
      `${saleId}.${getFileExt(voucherFile.name)}`,
      voucherFile,
    )
    if (uploadError) {
      console.error('[registrarVenta] Voucher upload error:', uploadError)
      voucherWarning = `No se pudo subir el comprobante: ${uploadError}`
    } else if (publicUrl) {
      const { error: updateError } = await supabase
        .from('sales').update({ voucher_url: publicUrl }).eq('id', saleId)
      if (updateError) {
        console.error('[registrarVenta] voucher_url update error:', updateError)
        voucherWarning = `Comprobante subido pero no se pudo asociar a la venta: ${updateError.message}`
      }
    }
  }

  revalidatePath('/ventas')
  revalidatePath('/ventas/historial')
  return { error: null, saleId, voucherWarning }
}

export async function fetchHistorialVentas(
  desde: string | null,
  hasta: string | null
): Promise<{ error: string | null; sales: unknown[] }> {
  const user = await verifySession()
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profile as { role: string } | null)?.role === 'admin'

  const q = supabase
    .from('sales')
    .select('*, profiles(full_name), clientes(nombre, es_anonimo)')
    .order('fecha_venta', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (desde) q.gte('fecha_venta', desde)
  if (hasta) q.lte('fecha_venta', hasta)
  if (!isAdmin) q.eq('staff_id', user.id)

  const { data, error } = await q
  if (error) return { error: error.message, sales: [] }
  return { error: null, sales: data ?? [] }
}

export async function anularVenta(saleId: string): Promise<{ error: string | null }> {
  let supabase
  try {
    ({ supabase } = await requireAdmin())
  } catch {
    return { error: 'Solo el administrador puede anular ventas.' }
  }

  const { error } = await supabase
    .from('sales').update({ status: 'anulada' }).eq('id', saleId).eq('status', 'completada')

  if (error) return { error: error.message }
  revalidatePath('/ventas/historial')
  return { error: null }
}

export async function subirVoucherVenta(
  formData: FormData
): Promise<{ error: string | null; voucherUrl?: string }> {
  let supabase
  try {
    ({ supabase } = await requireAdmin())
  } catch {
    return { error: 'Solo el administrador puede adjuntar comprobantes.' }
  }

  const saleId = formData.get('saleId') as string
  const file   = formData.get('voucher') as File | null
  if (!saleId) return { error: 'Falta saleId.' }
  if (!file || file.size === 0) return { error: 'Adjuntá una imagen.' }

  const { data: existing, error: fetchError } = await supabase
    .from('sales').select('id').eq('id', saleId).single()
  if (fetchError || !existing) return { error: 'Venta no encontrada.' }

  const path = `${saleId}.${getFileExt(file.name)}`
  const { publicUrl, error: uploadError } = await uploadFile('vouchers', path, file)
  if (uploadError || !publicUrl) {
    console.error('[subirVoucherVenta] upload error:', uploadError)
    return { error: `No se pudo subir: ${uploadError}` }
  }

  // Cache buster para forzar reload de imagen si era reemplazo
  const finalUrl = `${publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('sales').update({ voucher_url: finalUrl }).eq('id', saleId)
  if (updateError) return { error: updateError.message }

  revalidatePath('/ventas/historial')
  return { error: null, voucherUrl: finalUrl }
}

export async function actualizarFechaVenta(
  saleId: string,
  fechaVenta: string
): Promise<{ error: string | null }> {
  let supabase
  try {
    ({ supabase } = await requireAdmin())
  } catch {
    return { error: 'Solo el administrador puede modificar la fecha de una venta.' }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVenta)) {
    return { error: 'Fecha inválida. Usá formato AAAA-MM-DD.' }
  }

  const { error } = await supabase
    .from('sales').update({ fecha_venta: fechaVenta }).eq('id', saleId)

  if (error) return { error: error.message }
  revalidatePath('/ventas/historial')
  return { error: null }
}


export async function editarVenta(
  saleId: string,
  items: Array<{
    product_id: string
    cantidad: number
    precio_unitario: number
    precio_costo: number
  }>
): Promise<{ error: string | null }> {
  try { await requireAdmin() } catch { return { error: 'Solo el administrador puede editar ventas.' } }

  if (!items.length) return { error: 'Debe haber al menos un producto.' }
  for (const item of items) {
    if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) return { error: 'La cantidad debe ser mayor a 0.' }
    if (!Number.isFinite(item.precio_unitario) || item.precio_unitario < 0) return { error: 'El precio no puede ser negativo.' }
  }

  const adminClient = await createAdminClient()
  console.log('[editarVenta] adminClient ready, saleId:', saleId)

  const { data: sale, error: fetchError } = await adminClient
    .from('sales').select('status').eq('id', saleId).single()
  if (fetchError || !sale) return { error: 'Venta no encontrada.' }
  if ((sale as { status: string }).status === 'anulada') return { error: 'No se puede editar una venta anulada.' }
  console.log('[editarVenta] sale status:', (sale as { status: string }).status)

  // Restaurar stock de los ítems actuales antes de borrarlos
  const { error: restoreError } = await adminClient.rpc('restaurar_stock_venta', { p_sale_id: saleId })
  if (restoreError) {
    console.error('[editarVenta] restoreError:', restoreError)
    return { error: `Error al restaurar stock: ${restoreError.message}` }
  }
  console.log('[editarVenta] stock restaurado')

  // Borrar ítems actuales (trigger recalcula totales a 0)
  const { error: deleteError } = await adminClient.from('sale_items').delete().eq('sale_id', saleId)
  if (deleteError) {
    console.error('[editarVenta] deleteError:', deleteError)
    return { error: deleteError.message }
  }
  console.log('[editarVenta] items borrados')

  // Insertar nuevos ítems (trigger descuenta stock y recalcula totales)
  const { error: insertError } = await adminClient.from('sale_items').insert(
    items.map((item) => ({
      sale_id:         saleId,
      product_id:      item.product_id,
      cantidad:        item.cantidad,
      precio_unitario: item.precio_unitario,
      precio_costo:    item.precio_costo,
    }))
  )
  if (insertError) {
    console.error('[editarVenta] insertError:', insertError)
    return { error: insertError.message }
  }
  console.log('[editarVenta] items insertados OK')

  revalidatePath('/ventas/historial')
  return { error: null }
}

export async function eliminarVenta(saleId: string): Promise<{ error: string | null }> {
  let supabase
  try {
    ({ supabase } = await requireAdmin())
  } catch {
    return { error: 'Solo el administrador puede eliminar ventas.' }
  }

  const { data: sale, error: fetchError } = await supabase
    .from('sales')
    .select('status')
    .eq('id', saleId)
    .single()

  if (fetchError) return { error: fetchError.message }

  const status = (sale as { status: string } | null)?.status
  if (status !== 'anulada') {
    return { error: 'Solo se pueden eliminar ventas ya anuladas. Anulá la venta primero (eso restaura el stock).' }
  }

  // RLS de `sales` no tiene policy DELETE → bypass con service role.
  const adminClient = await createAdminClient()
  const { error, count } = await adminClient
    .from('sales').delete({ count: 'exact' }).eq('id', saleId)
  if (error) return { error: error.message }
  if (!count) return { error: 'No se eliminó ninguna fila. Verificá permisos o si la venta existe.' }

  revalidatePath('/ventas/historial')
  return { error: null }
}
