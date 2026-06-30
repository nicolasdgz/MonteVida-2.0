export const IGV_DEFAULT_PCT = 18 // porcentaje
const IGV_DEFAULT = IGV_DEFAULT_PCT / 100

export function redondearMonto(monto: number): number {
  return Math.round(monto * 100) / 100
}

export function calcularConIgv(montoBase: number, igvPct = IGV_DEFAULT): number {
  return montoBase * (1 + igvPct)
}

export function calcularSinIgv(montoConIgv: number, igvPct = IGV_DEFAULT): number {
  return montoConIgv / (1 + igvPct)
}

export function calcularIgvMonto(montoBase: number, igvPct = IGV_DEFAULT): number {
  return montoBase * igvPct
}

export function formatearMonto(monto: number, moneda = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto)
}
