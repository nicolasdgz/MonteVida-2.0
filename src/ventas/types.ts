/** Tipos del dominio Ventas (POS). */

/** Una línea del formulario POS — enviada como JSON en `formData.get('lines')`. */
export interface LineaInput {
  product_id: string
  cantidad: number
  precio_unitario: number
  precio_costo: number
}

/** Resultado de `registrarVenta()`. `voucherWarning` es un error no-bloqueante de upload. */
export interface RegistrarResult {
  error: string | null
  saleId: string | null
  voucherWarning?: string
}
