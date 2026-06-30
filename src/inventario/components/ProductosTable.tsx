'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Pencil, ToggleLeft, ToggleRight, Package, SlidersHorizontal, ChevronsUpDown, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { StockBadge } from './StockBadge'
import { useConfiguracion } from '@/store/configuracion'
import { formatearMonto, calcularConIgv } from '@/utils/igv'
import type { ProductWithCategory } from '@/types/database'

type SortDir = 'none' | 'desc' | 'asc'

interface ProductosTableProps {
  products: ProductWithCategory[]
  onEdit: (product: ProductWithCategory) => void
  onToggleActivo: (product: ProductWithCategory) => void
  onAjustar: (product: ProductWithCategory) => void
  onEliminar: (product: ProductWithCategory) => void
}

export function ProductosTable({ products, onEdit, onToggleActivo, onAjustar, onEliminar }: ProductosTableProps) {
  const showIgv = useConfiguracion((s) => s.showIgv)
  const igvPct  = useConfiguracion((s) => (s.data?.igv_porcentaje ?? 18) / 100)
  const [sortDir, setSortDir] = useState<SortDir>('none')

  function toggleSort() {
    setSortDir((d) => d === 'none' ? 'desc' : d === 'desc' ? 'asc' : 'none')
  }

  const sorted = sortDir === 'none' ? products : [...products].sort((a, b) =>
    sortDir === 'desc' ? b.stock - a.stock : a.stock - b.stock
  )

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-medium">Sin productos</p>
        <p className="text-sm mt-1">Creá el primero con el botón de arriba.</p>
      </div>
    )
  }

  function precio(valor: number) {
    const monto = showIgv ? calcularConIgv(valor, igvPct) : valor
    return formatearMonto(monto)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Producto</th>
            <th className="text-left py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Categoría</th>
            <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Costo</th>
            <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">
              Precio {showIgv ? <span className="text-emerald-500/70">+IGV</span> : <span className="text-muted-foreground">s/IGV</span>}
            </th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">
              <button
                onClick={toggleSort}
                className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                title="Ordenar por stock"
              >
                Stock
                {sortDir === 'none' && <ChevronsUpDown className="w-3 h-3" />}
                {sortDir === 'desc' && <ArrowDown className="w-3 h-3 text-primary" />}
                {sortDir === 'asc'  && <ArrowUp   className="w-3 h-3 text-primary" />}
              </button>
            </th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Estado</th>
            <th className="text-right py-3 px-4 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((product, i) => (
            <motion.tr
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`group hover:bg-primary/8 transition-colors ${!product.activo ? 'opacity-50' : ''}`}
            >
              {/* Producto */}
              <td className="py-3 px-4">
                <Link
                  href={`/inventario/${product.id}`}
                  className="block group/link -mx-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
                  title="Ver historial de ventas"
                >
                  <p className="font-medium text-foreground group-hover/link:text-primary transition-colors">
                    {product.nombre}
                  </p>
                  {product.codigo && (
                    <p className="text-xs text-muted-foreground mt-0.5">{product.codigo}</p>
                  )}
                </Link>
              </td>

              {/* Categoría */}
              <td className="py-3 px-4">
                {product.categories ? (
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                    {product.categories.nombre}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>

              {/* Costo */}
              <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                {formatearMonto(product.precio_costo)}
              </td>

              {/* Precio venta */}
              <td className="py-3 px-4 text-right font-medium text-foreground tabular-nums">
                {precio(product.precio_venta)}
              </td>

              {/* Stock */}
              <td className="py-3 px-4 text-center">
                <StockBadge stock={product.stock} stockMinimo={product.stock_minimo} />
              </td>

              {/* Estado */}
              <td className="py-3 px-4 text-center">
                <span className={`text-xs font-medium ${product.activo ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {product.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>

              {/* Acciones */}
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onAjustar(product)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer"
                    title="Ajustar stock"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleActivo(product)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                    title={product.activo ? 'Desactivar' : 'Activar'}
                  >
                    {product.activo
                      ? <ToggleRight className="w-3.5 h-3.5" />
                      : <ToggleLeft className="w-3.5 h-3.5" />
                    }
                  </button>
                  <button
                    onClick={() => onEliminar(product)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
