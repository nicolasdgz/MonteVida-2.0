import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import { RegistroVentaClient } from '@/ventas/components/RegistroVentaClient'
import type { Product, Cliente } from '@/types/database'

export default async function VentasPage() {
  await verifySession()
  const supabase = await createClient()

  const [{ data: products }, { data: clientes }] = await Promise.all([
    supabase.from('products').select('*').eq('activo', true).order('nombre'),
    supabase.from('clientes').select('id, nombre, numero_documento')
      .eq('es_anonimo', false).order('nombre').limit(500),
  ])

  return (
    <RegistroVentaClient
      products={(products ?? []) as Product[]}
      clientes={(clientes ?? []) as Pick<Cliente, 'id' | 'nombre' | 'numero_documento'>[]}
    />
  )
}
