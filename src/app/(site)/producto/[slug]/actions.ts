'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ResenaPayload {
  productId: string
  productSlug: string
  rating: number
  titulo?: string
  contenido: string
}

interface ActionResult { error: string | null; success?: boolean }

export async function crearResena(payload: ResenaPayload): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión para dejar una reseña' }

  const { rating, titulo, contenido, productId, productSlug } = payload

  if (!contenido.trim()) return { error: 'El comentario es obligatorio' }
  if (rating < 1 || rating > 5) return { error: 'Calificación inválida' }

  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    user_id: user.id,
    rating,
    titulo: titulo?.trim() || null,
    contenido: contenido.trim(),
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya enviaste una reseña para este producto' }
    return { error: error.message }
  }

  revalidatePath(`/producto/${productSlug}`)
  return { error: null, success: true }
}
