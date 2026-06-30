import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import { ProductoVentasClient } from '@/inventario/components/ProductoVentasClient'
import type { ProductWithCategory } from '@/types/database'

interface PageProps {
  params: Promise<{ productId: string }>
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { productId } = await params
  const user = await verifySession()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = (profile as { role: string } | null)?.role === 'admin'

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(id, nombre)')
    .eq('id', productId)
    .single()

  if (!product) notFound()

  const q = supabase
    .from('sales')
    .select(`
      *,
      profiles(full_name),
      clientes(nombre, es_anonimo),
      sale_items!inner(id, cantidad, precio_unitario, subtotal, product_id)
    `)
    .eq('sale_items.product_id', productId)
    .order('fecha_venta', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (!isAdmin) q.eq('staff_id', user.id)

  const { data: sales } = await q

  return (
    <ProductoVentasClient
      product={product as unknown as ProductWithCategory}
      sales={(sales ?? []) as unknown as never[]}
      isAdmin={isAdmin}
    />
  )
}
