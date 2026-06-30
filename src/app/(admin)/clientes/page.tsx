import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import { ClientesClient } from '@/clientes/components/ClientesClient'
import type { Cliente } from '@/types/database'

const PAGE_SIZE = 50

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await verifySession()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .eq('es_anonimo', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('es_anonimo', false),
  ])

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <ClientesClient
      clientes={(data ?? []) as Cliente[]}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  )
}
