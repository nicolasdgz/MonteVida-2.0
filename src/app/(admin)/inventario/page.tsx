import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import { InventarioClient } from '@/inventario/components/InventarioClient'
import type { ProductWithCategory, Category } from '@/types/database'

const PAGE_SIZE = 50

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await verifySession()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const [{ data: products }, { data: categories }, { count }] = await Promise.all([
    supabase
      .from('products')
      .select('*, categories(id, nombre)')
      .order('nombre')
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from('categories')
      .select('*')
      .order('nombre'),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true }),
  ])

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <InventarioClient
      products={(products ?? []) as unknown as ProductWithCategory[]}
      categories={(categories ?? []) as Category[]}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  )
}
