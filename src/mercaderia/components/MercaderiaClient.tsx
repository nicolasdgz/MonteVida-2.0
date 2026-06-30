'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Search, Plus, Trash2, Loader2, ArrowRight,
  ChevronDown, ChevronUp, Package, Receipt, Pencil, X, Info,
} from 'lucide-react'
import {
  registrarCompra, actualizarCompra, fetchHistorialCompras,
} from '@/app/(admin)/mercaderia/actions'
import type { Compra, CompraItemInput, GastoAdicionalInput } from '@/mercaderia/types'
import { formatearMonto } from '@/utils/igv'
import { formatFecha } from '@/utils/fechas'
import toast from 'react-hot-toast'
import type { Product } from '@/types/database'

interface CompraLine {
  product: Product
  cantidad: number
  precioCosto: number
}

interface GastoLocal {
  id: string
  concepto: string
  monto: number
}

const CONCEPTOS_SUGERIDOS = [
  'Transporte', 'Delivery', 'Flete', 'Aduana', 'Embalaje',
  'Almacenaje', 'Seguro', 'Comisión', 'Otros',
]

interface Props {
  products: Product[]
  historialInicial: Compra[]
  initDesde: string
  initHasta: string
}

function gastosValidos(gastos: GastoLocal[]): boolean {
  return gastos.every((g) => g.concepto.trim() && g.monto > 0)
}

// ─── Buscador ────────────────────────────────────────────────────────────────

function BuscadorMercaderia({
  products,
  isAlreadyAdded,
  onAgregar,
}: {
  products: Product[]
  isAlreadyAdded: (id: string) => boolean
  onAgregar: (product: Product) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const resultados = products
    .filter((p) =>
      p.nombre.toLowerCase().includes(query.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 8)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const yaAgregado = (id: string) => isAlreadyAdded(id)

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
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            <ul>
              {resultados.map((p) => {
                const agregado = yaAgregado(p.id)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { onAgregar(p); setQuery(''); setOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/8 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.codigo && <span className="mr-2">{p.codigo}</span>}
                          Stock actual: {p.stock} {p.unidad}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Último costo</p>
                        <p className="text-sm font-semibold text-teal-400">S/ {p.precio_costo.toFixed(2)}</p>
                      </div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        agregado ? 'bg-teal-600/20 text-teal-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Plus className="w-4 h-4" />
                      </div>
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

// ─── Líneas ───────────────────────────────────────────────────────────────────

function LineasCompra({
  lineas,
  onCantidad,
  onCosto,
  onQuitar,
}: {
  lineas: CompraLine[]
  onCantidad: (id: string, v: number) => void
  onCosto: (id: string, v: number) => void
  onQuitar: (id: string) => void
}) {
  if (lineas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
        <Package className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Buscá un producto arriba para agregarlo</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_32px] gap-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">
        <span>Producto</span>
        <span className="text-center">Cantidad</span>
        <span className="text-right">Precio costo</span>
        <span className="text-right">Subtotal</span>
        <span />
      </div>

      {lineas.map((linea) => {
        const subtotal = linea.cantidad * linea.precioCosto

        return (
          <div
            key={linea.product.id}
            className="flex flex-wrap items-center gap-2 p-3 rounded-xl border bg-muted/50 border-border"
          >
            {/* Producto */}
            <div className="w-full sm:flex-1 sm:w-auto min-w-0 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{linea.product.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock actual: {linea.product.stock} {linea.product.unidad}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onQuitar(linea.product.id)}
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
                  onClick={() => onCantidad(linea.product.id, Math.max(1, linea.cantidad - 1))}
                  className="w-6 h-6 rounded-md bg-muted hover:bg-primary/8 text-foreground flex items-center justify-center text-sm font-bold transition-colors"
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={linea.cantidad}
                  onChange={(e) => onCantidad(linea.product.id, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center bg-background border border-input rounded-md text-sm text-foreground py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => onCantidad(linea.product.id, linea.cantidad + 1)}
                  className="w-6 h-6 rounded-md bg-muted hover:bg-primary/8 text-foreground flex items-center justify-center text-sm font-bold transition-colors"
                >+</button>
              </div>

              {/* Precio costo editable */}
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={linea.precioCosto}
                  onChange={(e) => onCosto(linea.product.id, parseFloat(e.target.value) || 0)}
                  className="w-full pl-6 pr-1 py-1 bg-background border border-input rounded-md text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Subtotal */}
              <div className="w-20 text-right">
                <p className="text-sm font-semibold text-foreground tabular-nums">{formatearMonto(subtotal)}</p>
              </div>

              <button
                type="button"
                onClick={() => onQuitar(linea.product.id)}
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

// ─── Gastos adicionales ───────────────────────────────────────────────────────

function GastosAdicionalesSection({
  gastos,
  onAgregar,
  onConcepto,
  onMonto,
  onQuitar,
}: {
  gastos: GastoLocal[]
  onAgregar: () => void
  onConcepto: (id: string, v: string) => void
  onMonto: (id: string, v: number) => void
  onQuitar: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Gastos adicionales</span>
        </div>
        <button
          type="button"
          onClick={onAgregar}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-muted-foreground text-xs font-medium transition-colors"
        >
          <Plus className="w-3 h-3" />
          Agregar
        </button>
      </div>

      {gastos.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 px-1">Transporte, delivery, flete... (opcional)</p>
      ) : (
        <div className="space-y-2">
          {/* datalist para autocompletar conceptos */}
          <datalist id="conceptos-gasto">
            {CONCEPTOS_SUGERIDOS.map((c) => <option key={c} value={c} />)}
          </datalist>

          {gastos.map((g) => (
            <div key={g.id} className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/30 border-border">
              <input
                type="text"
                list="conceptos-gasto"
                value={g.concepto}
                onChange={(e) => onConcepto(g.id, e.target.value)}
                placeholder="Concepto (ej. Transporte)"
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
              />
              <div className="relative shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={g.monto === 0 ? '' : g.monto}
                  onChange={(e) => onMonto(g.id, parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-24 pl-6 pr-1 py-1 bg-background border border-input rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <button
                type="button"
                onClick={() => onQuitar(g.id)}
                className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal de edición ────────────────────────────────────────────────────────

interface ItemExistente {
  id: string
  product_id: string
  cantidad: number
  precio_costo: number
  nombre: string
  unidad: string
}

interface ItemEliminado {
  id: string
  product_id: string
  cantidad: number
  nombre: string
}

function EditarCompraModal({
  compra,
  products,
  onClose,
  onSaved,
}: {
  compra: Compra
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [proveedor, setProveedor] = useState(compra.proveedor ?? '')
  const [fecha, setFecha]         = useState(compra.fecha)
  const [notas, setNotas]         = useState(compra.notas ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [items, setItems] = useState<ItemExistente[]>(
    compra.compra_items.map((i) => ({
      id: i.id,
      product_id: i.product_id,
      cantidad: i.cantidad,
      precio_costo: i.precio_costo,
      nombre: i.products.nombre,
      unidad: i.products.unidad,
    }))
  )
  const [itemsEliminados, setItemsEliminados] = useState<ItemEliminado[]>([])
  const [lineasNuevas, setLineasNuevas] = useState<CompraLine[]>([])
  const [gastos, setGastos] = useState<GastoLocal[]>(
    compra.compra_gastos.map((g) => ({ id: g.id, concepto: g.concepto, monto: g.monto }))
  )

  const totalProductos = items.reduce((s, i) => s + i.cantidad * i.precio_costo, 0)
                       + lineasNuevas.reduce((s, l) => s + l.cantidad * l.precioCosto, 0)
  const totalGastos    = gastos.reduce((s, g) => s + g.monto, 0)
  const total          = totalProductos + totalGastos

  function setItemCantidad(id: string, v: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, cantidad: Math.max(1, v) } : i))
  }
  function setItemCosto(id: string, v: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, precio_costo: v } : i))
  }
  function quitarItemExistente(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item) return prev
      setItemsEliminados((prevElim) => [
        ...prevElim,
        { id: item.id, product_id: item.product_id, cantidad: item.cantidad, nombre: item.nombre },
      ])
      return prev.filter((i) => i.id !== id)
    })
  }
  function deshacerEliminar(id: string) {
    setItemsEliminados((prevElim) => {
      const eliminado = prevElim.find((e) => e.id === id)
      if (!eliminado) return prevElim
      const original = compra.compra_items.find((ci) => ci.id === id)
      if (original) {
        setItems((prev) => [...prev, {
          id: original.id,
          product_id: original.product_id,
          cantidad: original.cantidad,
          precio_costo: original.precio_costo,
          nombre: original.products.nombre,
          unidad: original.products.unidad,
        }])
      }
      return prevElim.filter((e) => e.id !== id)
    })
  }
  function agregarNuevaLinea(product: Product) {
    setLineasNuevas((prev) => {
      if (prev.some((l) => l.product.id === product.id)) return prev
      return [...prev, { product, cantidad: 1, precioCosto: product.precio_costo }]
    })
  }
  function setNuevaCantidad(id: string, v: number) {
    setLineasNuevas((prev) => prev.map((l) => l.product.id === id ? { ...l, cantidad: v } : l))
  }
  function setNuevoCosto(id: string, v: number) {
    setLineasNuevas((prev) => prev.map((l) => l.product.id === id ? { ...l, precioCosto: v } : l))
  }
  function quitarNuevaLinea(id: string) {
    setLineasNuevas((prev) => prev.filter((l) => l.product.id !== id))
  }
  function agregarGasto() {
    setGastos((prev) => [...prev, { id: crypto.randomUUID(), concepto: '', monto: 0 }])
  }
  function setGastoConcepto(id: string, v: string) {
    setGastos((prev) => prev.map((g) => g.id === id ? { ...g, concepto: v } : g))
  }
  function setGastoMonto(id: string, v: number) {
    setGastos((prev) => prev.map((g) => g.id === id ? { ...g, monto: v } : g))
  }
  function quitarGasto(id: string) {
    setGastos((prev) => prev.filter((g) => g.id !== id))
  }

  async function handleSubmit() {
    if (items.length === 0 && lineasNuevas.length === 0) {
      toast.error('La compra debe tener al menos un producto.')
      return
    }
    if (!gastosValidos(gastos)) {
      toast.error('Completá concepto y monto en todos los gastos adicionales.')
      return
    }
    setIsSubmitting(true)
    const result = await actualizarCompra(
      compra.id,
      items.map((i) => ({ id: i.id, cantidad: i.cantidad, precio_costo: i.precio_costo })),
      itemsEliminados.map((e) => ({ id: e.id, product_id: e.product_id, cantidad: e.cantidad })),
      lineasNuevas.map((l) => ({ product_id: l.product.id, cantidad: l.cantidad, precio_costo: l.precioCosto })),
      gastos.map((g) => ({ concepto: g.concepto, monto: g.monto })),
      proveedor, fecha, notas,
    )
    setIsSubmitting(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Compra actualizada.')
    onSaved()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              <h2 className="font-semibold text-foreground">Editar compra</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{formatFecha(compra.fecha)}{compra.proveedor ? ` · ${compra.proveedor}` : ''}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body scrollable */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Aviso stock */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              Cambiar cantidad o precio no modifica el stock. Quitar o agregar productos sí ajusta el stock del inventario automáticamente.
            </div>

            {/* Proveedor + Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Proveedor</label>
                <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Opcional" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field" />
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-2">Productos</p>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 px-3 rounded-xl border border-dashed border-border">
                  No hay productos en la compra. Agregá al menos uno abajo.
                </p>
              ) : (
                <div className="rounded-xl overflow-hidden border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Producto</th>
                        <th className="text-right py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] w-24">Cantidad</th>
                        <th className="text-right py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] w-28">Precio costo</th>
                        <th className="text-right py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] w-24">Subtotal</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 text-foreground">
                            {item.nombre}
                            <span className="ml-1 text-xs text-muted-foreground">{item.unidad}</span>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number" min="1" value={item.cantidad}
                              onChange={(e) => setItemCantidad(item.id, parseInt(e.target.value) || 1)}
                              className="w-full text-right bg-background border border-input rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">S/</span>
                              <input
                                type="number" min="0" step="0.01" value={item.precio_costo}
                                onChange={(e) => setItemCosto(item.id, parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 text-right bg-background border border-input rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-foreground tabular-nums">
                            {formatearMonto(item.cantidad * item.precio_costo)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => quitarItemExistente(item.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Quitar producto (revierte su stock)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {itemsEliminados.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {itemsEliminados.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-xs">
                      <span className="text-red-400/80">
                        <span className="line-through">{e.nombre}</span>
                        <span className="ml-2 text-muted-foreground">Se revertirá el stock (−{e.cantidad})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => deshacerEliminar(e.id)}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Deshacer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agregar productos nuevos */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Agregar productos</p>
              <BuscadorMercaderia
                products={products}
                isAlreadyAdded={(id) =>
                  items.some((i) => i.product_id === id) ||
                  lineasNuevas.some((l) => l.product.id === id)
                }
                onAgregar={agregarNuevaLinea}
              />
              {lineasNuevas.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-teal-500/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-teal-500/20 bg-teal-500/5">
                        <th className="text-left py-2 px-3 text-[11px] font-medium text-teal-400 uppercase tracking-[0.07em]">Nuevo producto</th>
                        <th className="text-right py-2 px-3 text-[11px] font-medium text-teal-400 uppercase tracking-[0.07em] w-24">Cantidad</th>
                        <th className="text-right py-2 px-3 text-[11px] font-medium text-teal-400 uppercase tracking-[0.07em] w-28">Precio costo</th>
                        <th className="text-right py-2 px-3 text-[11px] font-medium text-teal-400 uppercase tracking-[0.07em] w-24">Subtotal</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lineasNuevas.map((l) => (
                        <tr key={l.product.id}>
                          <td className="py-2 px-3 text-foreground">
                            {l.product.nombre}
                            <span className="ml-1 text-xs text-muted-foreground">{l.product.unidad}</span>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number" min="1" value={l.cantidad}
                              onChange={(e) => setNuevaCantidad(l.product.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full text-right bg-background border border-input rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">S/</span>
                              <input
                                type="number" min="0" step="0.01" value={l.precioCosto}
                                onChange={(e) => setNuevoCosto(l.product.id, parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 text-right bg-background border border-input rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-foreground tabular-nums">
                            {formatearMonto(l.cantidad * l.precioCosto)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => quitarNuevaLinea(l.product.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Gastos adicionales */}
            <GastosAdicionalesSection
              gastos={gastos}
              onAgregar={agregarGasto}
              onConcepto={setGastoConcepto}
              onMonto={setGastoMonto}
              onQuitar={quitarGasto}
            />

            {/* Notas */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Notas</label>
              <textarea
                value={notas} onChange={(e) => setNotas(e.target.value)}
                placeholder="Número de factura, observaciones..."
                rows={2} className="input-field resize-none text-sm"
              />
            </div>

            {/* Total */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Productos</span>
                <span className="tabular-nums">{formatearMonto(totalProductos)}</span>
              </div>
              {totalGastos > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Gastos adicionales</span>
                  <span className="tabular-nums">{formatearMonto(totalGastos)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-white/[0.05]">
                <span>Total</span>
                <span className="tabular-nums text-teal-300">{formatearMonto(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-muted-foreground text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button" onClick={handleSubmit} disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Historial ────────────────────────────────────────────────────────────────

function HistorialCompras({
  compras,
  desde,
  hasta,
  onDesdChange,
  onHastaChange,
  onBuscar,
  onEliminar,
  onEditar,
  isFetching,
}: {
  compras: Compra[]
  desde: string
  hasta: string
  onDesdChange: (v: string) => void
  onHastaChange: (v: string) => void
  onBuscar: () => void
  onEliminar: (id: string) => void
  onEditar: (compra: Compra) => void
  isFetching: boolean
}) {
  const [expandido, setExpandido] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta compra? Se revertirá el stock de todos sus productos.')) return
    setEliminandoId(id)
    await onEliminar(id)
    setEliminandoId(null)
  }

  const totalMes = compras.reduce((s, c) => s + c.total, 0)

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1">Desde</label>
          <input type="date" value={desde} onChange={(e) => onDesdChange(e.target.value)} className="input-field w-full sm:w-40" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => onHastaChange(e.target.value)} className="input-field w-full sm:w-40" />
        </div>
        <button
          type="button"
          onClick={onBuscar}
          disabled={isFetching}
          className="px-4 py-2 bg-muted border border-border hover:bg-primary/8 text-foreground rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Buscar
        </button>
        {compras.length > 0 && (
          <div className="ml-auto text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em]">Total período</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatearMonto(totalMes)}</p>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {compras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Truck className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Sin compras en el período</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_100px_80px_40px] gap-2 px-5 py-3">
              {['Fecha / Proveedor', 'Responsable', 'Productos', 'Total', ''].map((h) => (
                <span key={h} className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">{h}</span>
              ))}
            </div>

            {compras.map((compra) => (
              <div key={compra.id}>
                <button
                  type="button"
                  onClick={() => setExpandido(expandido === compra.id ? null : compra.id)}
                  className="w-full grid grid-cols-[1fr_120px_100px_80px_40px] gap-2 px-5 py-3 text-left hover:bg-primary/8 transition-colors"
                >
                  <div>
                    <p className="text-sm text-foreground">{formatFecha(compra.fecha)}</p>
                    {compra.proveedor && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{compra.proveedor}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground truncate self-center">{compra.profiles?.full_name ?? '—'}</span>
                  <span className="text-sm text-muted-foreground self-center">
                    {compra.compra_items.length} {compra.compra_items.length === 1 ? 'ítem' : 'ítems'}
                    {compra.compra_gastos?.length > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">+{compra.compra_gastos.length} gasto{compra.compra_gastos.length > 1 ? 's' : ''}</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums self-center">{formatearMonto(compra.total)}</span>
                  <span className="flex items-center justify-center self-center text-muted-foreground">
                    {expandido === compra.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {expandido === compra.id && (
                  <div className="px-5 pb-4 space-y-3">
                    {/* Items */}
                    <div className="rounded-xl overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Producto</th>
                            <th className="text-right py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Cantidad</th>
                            <th className="text-right py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Costo unit.</th>
                            <th className="text-right py-2 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {compra.compra_items.map((item) => (
                            <tr key={item.id} className="hover:bg-primary/8 transition-colors">
                              <td className="py-2 px-3 text-foreground">{item.products.nombre}</td>
                              <td className="py-2 px-3 text-right text-muted-foreground tabular-nums">
                                {item.cantidad} {item.products.unidad}
                              </td>
                              <td className="py-2 px-3 text-right text-muted-foreground tabular-nums">{formatearMonto(item.precio_costo)}</td>
                              <td className="py-2 px-3 text-right font-medium text-foreground tabular-nums">{formatearMonto(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Gastos adicionales */}
                    {compra.compra_gastos?.length > 0 && (
                      <div className="rounded-xl overflow-hidden border border-border">
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                          <Receipt className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">Gastos adicionales</span>
                        </div>
                        <div className="divide-y divide-border">
                          {compra.compra_gastos.map((g) => (
                            <div key={g.id} className="flex items-center justify-between px-3 py-2">
                              <span className="text-sm text-foreground">{g.concepto}</span>
                              <span className="text-sm font-medium text-foreground tabular-nums">{formatearMonto(g.monto)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {compra.notas && (
                      <p className="text-xs text-muted-foreground italic">Notas: {compra.notas}</p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditar(compra)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-400 border border-teal-500/20 rounded-lg hover:bg-teal-500/10 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(compra.id)}
                        disabled={eliminandoId === compra.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {eliminandoId === compra.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                        Eliminar y revertir stock
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cliente principal ────────────────────────────────────────────────────────

export function MercaderiaClient({ products, historialInicial, initDesde, initHasta }: Props) {
  const [lineas, setLineas] = useState<CompraLine[]>([])
  const [gastosLocales, setGastosLocales] = useState<GastoLocal[]>([])
  const [proveedor, setProveedor] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [historial, setHistorial] = useState<Compra[]>(historialInicial)
  const [desde, setDesde] = useState(initDesde)
  const [hasta, setHasta] = useState(initHasta)
  const [isFetching, startFetch] = useTransition()
  const [editando, setEditando] = useState<Compra | null>(null)

  const totalProductos = lineas.reduce((s, l) => s + l.cantidad * l.precioCosto, 0)
  const totalGastos = gastosLocales.reduce((s, g) => s + g.monto, 0)
  const total = totalProductos + totalGastos

  function handleAgregar(product: Product) {
    setLineas((prev) => {
      if (prev.some((l) => l.product.id === product.id)) return prev
      return [...prev, { product, cantidad: 1, precioCosto: product.precio_costo }]
    })
  }

  function handleCantidad(id: string, v: number) {
    setLineas((prev) => prev.map((l) => l.product.id === id ? { ...l, cantidad: v } : l))
  }

  function handleCosto(id: string, v: number) {
    setLineas((prev) => prev.map((l) => l.product.id === id ? { ...l, precioCosto: v } : l))
  }

  function handleQuitar(id: string) {
    setLineas((prev) => prev.filter((l) => l.product.id !== id))
  }

  function handleAgregarGasto() {
    setGastosLocales((prev) => [...prev, { id: crypto.randomUUID(), concepto: '', monto: 0 }])
  }

  function handleGastoConcepto(id: string, v: string) {
    setGastosLocales((prev) => prev.map((g) => g.id === id ? { ...g, concepto: v } : g))
  }

  function handleGastoMonto(id: string, v: number) {
    setGastosLocales((prev) => prev.map((g) => g.id === id ? { ...g, monto: v } : g))
  }

  function handleQuitarGasto(id: string) {
    setGastosLocales((prev) => prev.filter((g) => g.id !== id))
  }

  async function handleSubmit() {
    if (lineas.length === 0) { toast.error('Agregá al menos un producto.'); return }

    if (!gastosValidos(gastosLocales)) {
      toast.error('Completá concepto y monto en todos los gastos adicionales.')
      return
    }

    const items: CompraItemInput[] = lineas.map((l) => ({
      product_id: l.product.id,
      cantidad: l.cantidad,
      precio_costo: l.precioCosto,
    }))

    const gastos: GastoAdicionalInput[] = gastosLocales.map((g) => ({
      concepto: g.concepto,
      monto: g.monto,
    }))

    setIsSubmitting(true)
    const result = await registrarCompra(items, gastos, proveedor, fecha, notas)
    setIsSubmitting(false)

    if (result.error) { toast.error(result.error); return }

    toast.success('Compra registrada. Stock actualizado.')
    setLineas([])
    setGastosLocales([])
    setProveedor('')
    setNotas('')
    setFecha(new Date().toISOString().split('T')[0])

    // Refrescar historial
    startFetch(async () => {
      const updated = await fetchHistorialCompras(desde, hasta)
      if (updated.data) setHistorial(updated.data)
    })
  }

  async function handleEliminar(id: string) {
    const { eliminarCompra } = await import('@/app/(admin)/mercaderia/actions')
    const result = await eliminarCompra(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Compra eliminada. Stock revertido.')
    setHistorial((prev) => prev.filter((c) => c.id !== id))
  }

  function handleBuscar() {
    startFetch(async () => {
      const result = await fetchHistorialCompras(desde, hasta)
      if (result.error) { toast.error(result.error); return }
      setHistorial(result.data)
    })
  }

  function handleEditarSaved() {
    setEditando(null)
    startFetch(async () => {
      const result = await fetchHistorialCompras(desde, hasta)
      if (result.data) setHistorial(result.data)
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-500/25 bg-teal-500/8 mb-3">
          <Truck className="w-3 h-3 text-teal-400" />
          <span className="text-[11px] font-medium text-teal-400 uppercase tracking-[0.07em]">Compras</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Ingreso de mercadería</h1>
        <p className="text-sm text-muted-foreground mt-1">Registrá las compras de stock. El inventario y precio costo se actualizan automáticamente.</p>
      </div>

      {/* Formulario — dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* Izquierda: buscador + líneas + gastos adicionales */}
        <div className="space-y-4">
          <BuscadorMercaderia
            products={products}
            isAlreadyAdded={(id) => lineas.some((l) => l.product.id === id)}
            onAgregar={handleAgregar}
          />
          <LineasCompra
            lineas={lineas}
            onCantidad={handleCantidad}
            onCosto={handleCosto}
            onQuitar={handleQuitar}
          />
          <div className="border-t border-border pt-4">
            <GastosAdicionalesSection
              gastos={gastosLocales}
              onAgregar={handleAgregarGasto}
              onConcepto={handleGastoConcepto}
              onMonto={handleGastoMonto}
              onQuitar={handleQuitarGasto}
            />
          </div>
        </div>

        {/* Derecha: resumen sticky */}
        <div className="lg:sticky lg:top-20">
          <div
            className="rounded-[1.25rem] p-px"
            style={{ background: 'linear-gradient(145deg, rgba(20,184,166,0.30) 0%, rgba(20,184,166,0.04) 50%, rgba(13,148,136,0.18) 100%)' }}
          >
            <div
              className="rounded-[calc(1.25rem-1px)] p-5 space-y-5"
              style={{ background: 'linear-gradient(160deg, #0d1f1e 0%, #0a1210 100%)' }}
            >
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-teal-400" />
                Resumen de compra
              </h2>

              {/* Desglose */}
              <div className="space-y-1.5 py-2 border-y border-white/[0.06]">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Productos</span>
                  <span className="tabular-nums">{formatearMonto(totalProductos)}</span>
                </div>
                {totalGastos > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Gastos adicionales</span>
                    <span className="tabular-nums">{formatearMonto(totalGastos)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-white/[0.04]">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-xl font-semibold text-teal-300 tabular-nums">{formatearMonto(total)}</span>
                </div>
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Proveedor</label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Nombre del proveedor (opcional)"
                  className="input-field"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Notas</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Número de factura, observaciones..."
                  rows={2}
                  className="input-field resize-none text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || lineas.length === 0}
                className="group w-full py-3 px-5 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-full flex items-center justify-between gap-2"
                style={{
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  boxShadow: '0 0 0 1px rgba(20,184,166,0.2), 0 6px 20px rgba(13,148,136,0.25)',
                }}
              >
                <span className="flex items-center gap-2 text-sm">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Registrando...' : 'Registrar compra'}
                </span>
                {!isSubmitting && (
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>

              {lineas.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'} ·{' '}
                  {lineas.reduce((a, l) => a + l.cantidad, 0)} unidades
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Historial de compras</h2>
        <HistorialCompras
          compras={historial}
          desde={desde}
          hasta={hasta}
          onDesdChange={setDesde}
          onHastaChange={setHasta}
          onBuscar={handleBuscar}
          onEliminar={handleEliminar}
          onEditar={setEditando}
          isFetching={isFetching}
        />
      </div>

      {/* Modal edición */}
      {editando && (
        <EditarCompraModal
          compra={editando}
          products={products}
          onClose={() => setEditando(null)}
          onSaved={handleEditarSaved}
        />
      )}
    </div>
  )
}
