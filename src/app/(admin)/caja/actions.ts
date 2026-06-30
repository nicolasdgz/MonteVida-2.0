'use server'

import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import type { CierreData, CierreRegistrado } from '@/caja/types'

export async function calcularEfectivoEsperado(fecha: string): Promise<{ error: string | null; data: CierreData | null }> {
  const user = await verifySession()
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profile as { role: string } | null)?.role === 'admin'

  const q = supabase
    .from('sales')
    .select('total')
    .eq('status', 'completada')
    .eq('metodo_pago', 'efectivo')
    .eq('fecha_venta', fecha)

  if (!isAdmin) q.eq('staff_id', user.id)

  const { data, error } = await q
  if (error) return { error: error.message, data: null }

  const rows = (data ?? []) as { total: number }[]
  return {
    error: null,
    data: {
      fecha,
      efectivoEsperado: rows.reduce((s, r) => s + r.total, 0),
      cantidadVentas: rows.length,
    },
  }
}

export async function registrarCierre(
  fecha: string,
  efectivoEsperado: number,
  efectivoReal: number,
  notas: string
): Promise<{ error: string | null }> {
  const user = await verifySession()
  const supabase = await createClient()

  const { error } = await supabase.from('cierres_caja').insert({
    fecha,
    staff_id: user.id,
    efectivo_esperado: efectivoEsperado,
    efectivo_real: efectivoReal,
    diferencia: Math.round((efectivoReal - efectivoEsperado) * 100) / 100,
    notas: notas || null,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function fetchCierresCaja(): Promise<{ error: string | null; data: CierreRegistrado[] }> {
  const user = await verifySession()
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profile as { role: string } | null)?.role === 'admin'

  const q = supabase
    .from('cierres_caja')
    .select('*, profiles(full_name)')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (!isAdmin) q.eq('staff_id', user.id)

  const { data, error } = await q
  if (error) return { error: error.message, data: [] }
  return { error: null, data: (data ?? []) as CierreRegistrado[] }
}
