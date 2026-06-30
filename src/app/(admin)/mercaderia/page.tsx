import { getProfile } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { fetchHistorialCompras } from './actions'
import { MercaderiaClient } from '@/mercaderia/components/MercaderiaClient'
import { redirect } from 'next/navigation'
import type { Product } from '@/types/database'

export default async function MercaderiaPage() {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/admin')

  const supabase = await createClient()
  const now = new Date()
  const desde = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const hasta = now.toISOString().split('T')[0]

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  const historialResult = await fetchHistorialCompras(desde, hasta)

  return (
    <MercaderiaClient
      products={(products ?? []) as Product[]}
      historialInicial={historialResult.data}
      initDesde={desde}
      initHasta={hasta}
    />
  )
}
