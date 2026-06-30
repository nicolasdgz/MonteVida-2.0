import { createClient } from '@/lib/supabase/client'
import { toUIProduct, type DBProductWithCategory } from '@/tienda/transforms'
import type { Product as UIProduct } from '@/tienda/types/product'

export async function getStoreProductsClient(): Promise<UIProduct[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('activo', true)
    .eq('visible_web', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return ((data ?? []) as unknown as DBProductWithCategory[]).map(toUIProduct)
}
