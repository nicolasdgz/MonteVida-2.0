'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/dal'
import { uploadFile, getFileExt } from '@/lib/storage'
import type { Expense, ExpenseCategory } from '@/types/database'

async function uploadComprobante(gastoId: string, file: File): Promise<string | null> {
  const { publicUrl, error } = await uploadFile('comprobantes', `${gastoId}.${getFileExt(file.name)}`, file)
  if (error || !publicUrl) return null
  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('expenses')
    .update({ comprobante_url: publicUrl })
    .eq('id', gastoId)
  if (updateError) {
    console.error('[gastos] Error guardando comprobante_url:', updateError.message)
    return null
  }
  return publicUrl
}

export async function crearGasto(
  formData: FormData
): Promise<{ error: string | null; expense: Expense | null }> {
  let user, supabase
  try {
    ({ user, supabase } = await requireAdmin())
  } catch (e) {
    return { error: (e as Error).message, expense: null }
  }

  const categoria = formData.get('categoria') as ExpenseCategory
  const descripcion = (formData.get('descripcion') as string).trim()
  const monto = parseFloat(formData.get('monto') as string)
  const fecha = formData.get('fecha') as string
  const comprobanteFile = formData.get('comprobante') as File | null

  const { data, error } = await supabase
    .from('expenses')
    .insert({ admin_id: user.id, categoria, descripcion, monto, fecha })
    .select('id')
    .single()

  if (error) return { error: error.message, expense: null }
  const id = (data as { id: string }).id

  let comprobanteUrl: string | null = null
  if (comprobanteFile && comprobanteFile.size > 0) {
    comprobanteUrl = await uploadComprobante(id, comprobanteFile)
  }

  revalidatePath('/gastos')

  const expense: Expense = {
    id,
    admin_id: user.id,
    categoria,
    descripcion,
    monto,
    fecha,
    comprobante_url: comprobanteUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return { error: null, expense }
}

export async function actualizarGasto(
  id: string,
  formData: FormData
): Promise<{ error: string | null; expense: Expense | null }> {
  let user, supabase
  try {
    ({ user, supabase } = await requireAdmin())
  } catch (e) {
    return { error: (e as Error).message, expense: null }
  }

  const categoria = formData.get('categoria') as ExpenseCategory
  const descripcion = (formData.get('descripcion') as string).trim()
  const monto = parseFloat(formData.get('monto') as string)
  const fecha = formData.get('fecha') as string
  const comprobanteFile = formData.get('comprobante') as File | null
  const comprobanteExistente = formData.get('comprobanteExistente') as string | null

  const { error } = await supabase
    .from('expenses')
    .update({ categoria, descripcion, monto, fecha })
    .eq('id', id)

  if (error) return { error: error.message, expense: null }

  let comprobanteUrl: string | null = comprobanteExistente
  if (comprobanteFile && comprobanteFile.size > 0) {
    comprobanteUrl = await uploadComprobante(id, comprobanteFile)
  }

  revalidatePath('/gastos')

  const expense: Expense = {
    id,
    admin_id: user.id,
    categoria,
    descripcion,
    monto,
    fecha,
    comprobante_url: comprobanteUrl,
    created_at: '',
    updated_at: new Date().toISOString(),
  }

  return { error: null, expense }
}

export async function eliminarGasto(id: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/gastos')
    return { error: null }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
