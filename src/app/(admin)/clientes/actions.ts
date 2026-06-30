'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'

interface ClientePayload {
  nombre: string
  telefono?: string
  tipo_documento?: string
  numero_documento?: string
  email?: string
}

interface ActionResult {
  error: string | null
  id?: string
}

export async function crearCliente(payload: ClientePayload): Promise<ActionResult> {
  await verifySession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: payload.nombre.trim(),
      telefono: payload.telefono?.trim() || null,
      tipo_documento: payload.tipo_documento || 'DNI',
      numero_documento: payload.numero_documento?.trim() || null,
      email: payload.email?.trim() || null,
      es_anonimo: false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null, id: (data as { id: string }).id }
}

export async function eliminarCliente(id: string): Promise<ActionResult> {
  await verifySession()
  const supabase = await createClient()

  const { count } = await supabase
    .from('sales').select('id', { count: 'exact', head: true }).eq('cliente_id', id)

  if ((count ?? 0) > 0) return { error: 'No se puede eliminar un cliente con ventas registradas.' }

  const { error } = await supabase.from('clientes').delete().eq('id', id).eq('es_anonimo', false)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}

export async function fetchClienteSales(clienteId: string): Promise<{ error: string | null; sales: unknown[] }> {
  await verifySession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales')
    .select('id, numero_venta, fecha_venta, total, metodo_pago, status')
    .eq('cliente_id', clienteId)
    .eq('status', 'completada')
    .order('fecha_venta', { ascending: false })
    .limit(100)

  if (error) return { error: error.message, sales: [] }
  return { error: null, sales: data ?? [] }
}

export async function actualizarCliente(id: string, payload: ClientePayload): Promise<ActionResult> {
  await verifySession()
  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .update({
      nombre: payload.nombre.trim(),
      telefono: payload.telefono?.trim() || null,
      tipo_documento: payload.tipo_documento || 'DNI',
      numero_documento: payload.numero_documento?.trim() || null,
      email: payload.email?.trim() || null,
    })
    .eq('id', id)
    .eq('es_anonimo', false)

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { error: null }
}
