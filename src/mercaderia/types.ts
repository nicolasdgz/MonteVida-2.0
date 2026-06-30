/** Tipos del dominio Mercadería (compras a proveedores). */

export interface CompraItemInput {
  product_id: string
  cantidad: number
  precio_costo: number
}

export interface GastoAdicionalInput {
  concepto: string
  monto: number
}

export interface CompraItem {
  id: string
  product_id: string
  cantidad: number
  precio_costo: number
  subtotal: number
  products: { nombre: string; unidad: string }
}

export interface CompraGasto {
  id: string
  concepto: string
  monto: number
}

export interface Compra {
  id: string
  proveedor: string | null
  fecha: string
  total: number
  notas: string | null
  created_at: string
  profiles: { full_name: string }
  compra_items: CompraItem[]
  compra_gastos: CompraGasto[]
}
