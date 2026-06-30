import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { GastosClient } from '@/gastos/components/GastosClient'

export default async function GastosPage() {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/ventas')

  const supabase = await createClient()
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <GastosClient expenses={expenses ?? []} />
  )
}
