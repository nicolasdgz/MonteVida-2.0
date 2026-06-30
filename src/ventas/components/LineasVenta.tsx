'use client'

import { Trash2, AlertTriangle } from 'lucide-react'
import { useSaleForm } from '@/ventas/store'
import { formatearMonto } from '@/utils/igv'

export function LineasVenta() {
  const lineas             = useSaleForm((s) => s.lineas)
  const quitarLinea        = useSaleForm((s) => s.quitarLinea)
  const actualizarCantidad = useSaleForm((s) => s.actualizarCantidad)
  const actualizarPrecio   = useSaleForm((s) => s.actualizarPrecio)

  if (lineas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
        <p className="text-sm">Buscá un producto arriba para agregarlo</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lineas.map((linea) => {
        const stockInsuficiente = linea.cantidad > linea.product.stock
        const subtotal = linea.cantidad * linea.precioUnitario

        return (
          <div
            key={linea.product.id}
            className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border transition-colors ${
              stockInsuficiente
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-card border-border'
            }`}
          >
            {/* Producto — ocupa todo el ancho en mobile */}
            <div className="w-full sm:flex-1 sm:w-auto min-w-0 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{linea.product.nombre}</p>
                {stockInsuficiente && (
                  <p className="flex items-center gap-1 text-xs text-red-400 mt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Stock disponible: {linea.product.stock}
                  </p>
                )}
              </div>
              {/* Borrar — visible arriba a la derecha en mobile */}
              <button
                type="button"
                onClick={() => quitarLinea(linea.product.id)}
                className="sm:hidden p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {/* Cantidad */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => actualizarCantidad(linea.product.id, linea.cantidad - 1)}
                  className="w-6 h-6 rounded-md bg-muted hover:bg-accent text-foreground flex items-center justify-center text-sm font-bold transition-colors"
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={linea.cantidad}
                  onChange={(e) => actualizarCantidad(linea.product.id, parseInt(e.target.value) || 1)}
                  className="w-12 text-center input-field py-0.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => actualizarCantidad(linea.product.id, linea.cantidad + 1)}
                  className="w-6 h-6 rounded-md bg-muted hover:bg-accent text-foreground flex items-center justify-center text-sm font-bold transition-colors"
                >+</button>
              </div>

              {/* Precio unitario */}
              <div className="relative w-20 sm:w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={linea.precioUnitario}
                  onChange={(e) => actualizarPrecio(linea.product.id, parseFloat(e.target.value) || 0)}
                  className="w-full input-field pl-6 pr-1 py-1 text-sm text-right"
                />
              </div>

              {/* Subtotal */}
              <div className="w-16 sm:w-20 text-right">
                <p className="text-sm font-semibold text-foreground tabular-nums">{formatearMonto(subtotal)}</p>
              </div>

              {/* Borrar — oculto en mobile (está arriba), visible en sm+ */}
              <button
                type="button"
                onClick={() => quitarLinea(linea.product.id)}
                className="hidden sm:block p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
