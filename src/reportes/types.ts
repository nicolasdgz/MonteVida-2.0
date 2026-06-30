import type { PaymentMethod } from '@/types/database'

/** Tipos del dominio Reportes (KPIs financieros). */

export interface KpisData {
  totalVentas: number
  totalCosto: number
  utilidadBruta: number
  totalGastosOperativos: number
  totalCompras: number
  totalEgresos: number
  utilidadNeta: number
  igvRecaudado: number
  cantidadVentas: number
}

export interface VentaPorMetodo {
  metodo: PaymentMethod
  total: number
  cantidad: number
}

export interface GastoPorCategoria {
  categoria: string
  total: number
  cantidad: number
}

export interface TopProducto {
  nombre: string
  codigo: string | null
  cantidad: number
  revenue: number
}
