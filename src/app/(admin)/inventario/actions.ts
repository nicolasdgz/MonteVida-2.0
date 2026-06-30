'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin as dalRequireAdmin } from '@/lib/dal'
import { uploadFile, getFileExt } from '@/lib/storage'

interface ProductoPayload {
  nombre: string
  codigo?: string
  descripcion?: string
  category_id?: string
  precio_costo: number
  precio_venta: number
  stock: number
  stock_minimo: number
  unidad: string
  activo: boolean
}

import type { ProductWithCategory } from '@/types/database'

interface ActionResult {
  error: string | null
}

interface ProductResult {
  error: string | null
  product: ProductWithCategory | null
}

async function requireAdmin(): Promise<string | null> {
  try { await dalRequireAdmin(); return null } catch { return 'Sin permisos.' }
}

export async function crearProducto(payload: ProductoPayload): Promise<ProductResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError, product: null }

  const supabase = await createClient()
  const { data, error } = await supabase.from('products').insert({
    nombre: payload.nombre,
    codigo: payload.codigo || null,
    descripcion: payload.descripcion || null,
    category_id: payload.category_id || null,
    precio_costo: payload.precio_costo,
    precio_venta: payload.precio_venta,
    stock: payload.stock,
    stock_minimo: payload.stock_minimo,
    unidad: payload.unidad,
    activo: payload.activo,
  }).select('*, categories(*)').single()

  if (error) return { error: error.message, product: null }
  revalidatePath('/inventario')
  return { error: null, product: data as ProductWithCategory }
}

export async function actualizarProducto(
  id: string,
  payload: Partial<ProductoPayload>
): Promise<ProductResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError, product: null }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*, categories(*)')
    .single()

  if (error) return { error: error.message, product: null }
  revalidatePath('/inventario')
  return { error: null, product: data as ProductWithCategory }
}

export async function eliminarProducto(id: string): Promise<ActionResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError }

  const supabase = await createClient()

  const [ventasRes, comprasRes] = await Promise.all([
    supabase.from('sale_items').select('id', { count: 'exact', head: true }).eq('product_id', id),
    supabase.from('compra_items').select('id', { count: 'exact', head: true }).eq('product_id', id),
  ])

  const ventasCount  = (ventasRes.count  ?? 0) as number
  const comprasCount = (comprasRes.count ?? 0) as number

  if (ventasCount > 0) {
    return { error: `No se puede eliminar: tiene ${ventasCount} ${ventasCount === 1 ? 'venta asociada' : 'ventas asociadas'}. Usá "Desactivar" para ocultarlo del catálogo.` }
  }
  if (comprasCount > 0) {
    return { error: `No se puede eliminar: figura en ${comprasCount} ${comprasCount === 1 ? 'compra registrada' : 'compras registradas'}. Usá "Desactivar".` }
  }

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/inventario')
  return { error: null }
}

export async function toggleActivoProducto(id: string, activo: boolean): Promise<ActionResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError }
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ activo }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/inventario')
  return { error: null }
}

export async function ajustarStock(id: string, delta: number): Promise<ProductResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError, product: null }

  const supabase = await createClient()
  const { data: current, error: fetchError } = await supabase
    .from('products').select('stock').eq('id', id).single()

  if (fetchError) return { error: fetchError.message, product: null }
  const newStock = Math.max(0, (current as { stock: number }).stock + delta)

  const { data, error } = await supabase
    .from('products').update({ stock: newStock }).eq('id', id).select('*, categories(*)').single()

  if (error) return { error: error.message, product: null }
  revalidatePath('/inventario')
  return { error: null, product: data as ProductWithCategory }
}

export async function crearCategoria(nombre: string): Promise<{ id: string | null; error: string | null }> {
  const permError = await requireAdmin()
  if (permError) return { id: null, error: permError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({ nombre: nombre.trim() })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  revalidatePath('/inventario')
  return { id: (data as { id: string }).id, error: null }
}

export async function eliminarCategoria(id: string): Promise<ActionResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError }

  const supabase = await createClient()
  await supabase.from('products').update({ category_id: null }).eq('category_id', id)
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/inventario')
  return { error: null }
}

export async function subirImagenProducto(
  productId: string,
  formData: FormData
): Promise<{ error: string | null; imageUrl?: string }> {
  const permError = await requireAdmin()
  if (permError) return { error: permError }

  const file = formData.get('image') as File | null
  if (!file || file.size === 0) return { error: 'Seleccioná una imagen.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'La imagen no puede superar 5 MB.' }

  const path = `${productId}.${getFileExt(file.name)}`
  const { publicUrl, error: uploadError } = await uploadFile('product-images', path, file)
  if (uploadError || !publicUrl) return { error: uploadError ?? 'Error subiendo imagen.' }
  const finalUrl = `${publicUrl}?v=${Date.now()}`

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('products')
    .update({ imagen_url: finalUrl })
    .eq('id', productId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/inventario/${productId}`)
  revalidatePath('/inventario')
  return { error: null, imageUrl: finalUrl }
}

export async function actualizarWebProducto(
  productId: string,
  payload: { visible_web?: boolean; precio_oferta?: number | null }
): Promise<ActionResult> {
  const permError = await requireAdmin()
  if (permError) return { error: permError }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)

  if (error) return { error: error.message }
  revalidatePath(`/inventario/${productId}`)
  revalidatePath('/inventario')
  return { error: null }
}
