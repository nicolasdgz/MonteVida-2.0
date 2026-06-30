/** Tipos del dominio Caja (cierre de caja diario). */

export interface CierreData {
  fecha: string
  efectivoEsperado: number
  cantidadVentas: number
}

export interface CierreRegistrado {
  id: string
  fecha: string
  efectivo_esperado: number
  efectivo_real: number
  diferencia: number
  notas: string | null
  profiles: { full_name: string }
  created_at: string
}
