'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, AlertTriangle } from 'lucide-react'
import { useSaleForm } from '@/ventas/store'
import type { Product } from '@/types/database'

export function BuscadorProductos({ products }: { products: Product[] }) {
  const lineas = useSaleForm((s) => s.lineas)
  const agregarLinea = useSaleForm((s) => s.agregarLinea)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const resultados = products.filter(
    (p) =>
      p.activo &&
      (p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 8)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function seleccionar(product: Product) {
    agregarLinea(product)
  }

  const yaAgregado = (id: string) => lineas.some((l) => l.product.id === id)

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar producto por nombre o código..."
          className="input-field pl-9"
        />
      </div>

      {open && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-neu dark:shadow-2xl z-20 overflow-hidden">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            <ul>
              {resultados.map((p) => {
                const agregado = yaAgregado(p.id)
                const sinStock = p.stock === 0
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => !sinStock && seleccionar(p)}
                      disabled={sinStock}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        sinStock
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-primary/5 cursor-pointer'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.codigo && <span className="mr-2">{p.codigo}</span>}
                          Stock: {p.stock} {p.unidad}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">S/ {p.precio_venta.toFixed(2)}</p>
                        {sinStock && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle className="w-3 h-3" /> Sin stock
                          </span>
                        )}
                      </div>
                      {!sinStock && (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${agregado ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
