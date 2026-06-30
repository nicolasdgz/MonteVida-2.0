import { getProfile } from '@/lib/dal'
import { calcularEfectivoEsperado, fetchCierresCaja } from './actions'
import { CajaClient } from '@/caja/components/CajaClient'

export default async function CajaPage() {
  await getProfile()

  const hoy = new Date().toISOString().split('T')[0]
  const [resumenResult, historialResult] = await Promise.all([
    calcularEfectivoEsperado(hoy),
    fetchCierresCaja(),
  ])

  return (
    <CajaClient
      hoy={hoy}
      resumenInicial={resumenResult.data}
      historialInicial={historialResult.data}
    />
  )
}
