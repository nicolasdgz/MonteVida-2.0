import { createClient } from '@/lib/supabase/server'
import { toUIProduct, type DBProductWithCategory } from '@/tienda/transforms'
import type { Product as UIProduct } from '@/tienda/types/product'
import type { Category as UICategory } from '@/tienda/types/category'
import type { Category as DBCategory, ProductReview } from '@/types/database'

export async function getStoreProducts(): Promise<UIProduct[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('activo', true)
    .eq('visible_web', true)
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown as DBProductWithCategory[]).map(toUIProduct)
}

export async function getStoreProductBySlug(slug: string): Promise<UIProduct | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!data) return null
  return toUIProduct(data as unknown as DBProductWithCategory)
}

export async function getStoreCategories(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('nombre')
    .order('nombre')

  return ((data ?? []) as unknown as { nombre: string }[]).map((c) => c.nombre)
}

export async function getStoreCategoriesWithImages(): Promise<UICategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('nombre')

  return ((data ?? []) as unknown as DBCategory[]).map((c) => ({
    id: c.id,
    title: c.nombre,
    img: '',
  }))
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_reviews')
    .select('*, profiles(full_name)')
    .eq('product_id', productId)
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as ProductReview[]
}
