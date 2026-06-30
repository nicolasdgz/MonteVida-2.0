import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/dal'
import { fetchKpis } from './actions'
import type { KpisData } from '@/reportes/types'
import { ReportesClient } from '@/reportes/components/ReportesClient'

function getMonthRange() {
  const now  = new Date()
  const y    = now.getFullYear()
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    desde: `${y}-${mm}-01`,
    hasta: `${y}-${mm}-${String(last).padStart(2, '0')}`,
  }
}

const emptyKpis: KpisData = {
  totalVentas: 0, totalCosto: 0, utilidadBruta: 0,
  totalGastosOperativos: 0, totalCompras: 0, totalEgresos: 0,
  utilidadNeta: 0, igvRecaudado: 0, cantidadVentas: 0,
}

export default async function ReportesPage() {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/ventas')

  const { desde, hasta } = getMonthRange()
  const { data: kpis } = await fetchKpis(desde, hasta)

  return (
    <ReportesClient
      desde={desde}
      hasta={hasta}
      initialKpis={kpis ?? emptyKpis}
    />
  )
}
