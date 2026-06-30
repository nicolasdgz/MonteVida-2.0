'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Plus, Search, AlertTriangle, Settings2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProductosTable } from './ProductosTable'
import { ProductoModal } from './ProductoModal'
import { AjusteStockModal } from './AjusteStockModal'
import { toggleActivoProducto, eliminarProducto, eliminarCategoria } from '@/app/(admin)/inventario/actions'
import { Paginacion } from '@/components/ui/Paginacion'
import type { ProductWithCategory, Category } from '@/types/database'

interface InventarioClientProps {
  products: ProductWithCategory[]
  categories: Category[]
  currentPage: number
  totalPages: number
  totalCount: number
}

type FiltroStock = 'todos' | 'con_stock' | 'bajo' | 'sin_stock'

export function InventarioClient({ products: initial, categories: initialCats, currentPage, totalPages, totalCount }: InventarioClientProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initial)
  const [categories, setCategories] = useState(initialCats)

  useEffect(() => {
    setProducts(initial)
  }, [initial])
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('todos')
  const [gestionCats, setGestionCats] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<ProductWithCategory | null>(null)
  const [ajustando, setAjustando] = useState<ProductWithCategory | null>(null)

  const productosFiltrados = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(search.toLowerCase())

      const matchCat = !filtroCategoria || p.category_id === filtroCategoria

      const matchStock =
        filtroStock === 'todos' ||
        (filtroStock === 'con_stock' && p.stock > 0) ||
        (filtroStock === 'bajo' && p.stock > 0 && p.stock <= p.stock_minimo) ||
        (filtroStock === 'sin_stock' && p.stock === 0)

      return matchSearch && matchCat && matchStock
    })
  }, [products, search, filtroCategoria, filtroStock])

  const stockBajoCount = products.filter((p) => p.activo && p.stock > 0 && p.stock <= p.stock_minimo).length
  const sinStockCount = products.filter((p) => p.activo && p.stock === 0).length
  const totalStock = products.reduce((s, p) => s + p.stock, 0)
  const totalStockFiltrado = productosFiltrados.reduce((s, p) => s + p.stock, 0)
  const hayFiltro = productosFiltrados.length !== products.length

  function handleEditar(product: ProductWithCategory) {
    setEditando(product)
    setModalOpen(true)
  }

  function handleNuevo() {
    setEditando(null)
    setModalOpen(true)
  }

  async function handleToggleActivo(product: ProductWithCategory) {
    const result = await toggleActivoProducto(product.id, !product.activo)
    if (result.error) { toast.error(result.error); return }
    setProducts((prev) =>
      prev.map((p) => p.id === product.id ? { ...p, activo: !product.activo } : p)
    )
    toast.success(product.activo ? 'Producto desactivado.' : 'Producto activado.')
  }

  async function handleEliminar(product: ProductWithCategory) {
    const ok = window.confirm(
      `¿Eliminar "${product.nombre}" permanentemente?\n\nSolo se puede eliminar si no tiene ventas ni compras registradas. Para ocultar un producto con historial, usá "Desactivar".`
    )
    if (!ok) return

    const result = await eliminarProducto(product.id)
    if (result.error) { toast.error(result.error); return }
    setProducts((prev) => prev.filter((p) => p.id !== product.id))
    toast.success(`"${product.nombre}" eliminado.`)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditando(null)
  }

  function handleSaved(product: ProductWithCategory, isEdit: boolean) {
    if (isEdit) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? product : p))
    } else {
      setProducts((prev) => [product, ...prev])
    }
  }

  function handleAjustado(product: ProductWithCategory) {
    setProducts((prev) => prev.map((p) => p.id === product.id ? product : p))
  }

  function handleCategoryCreated(cat: Category) {
    setCategories((prev) => [...prev, cat].sort((a, b) => a.nombre.localeCompare(b.nombre)))
  }

  async function handleEliminarCategoria(cat: Category) {
    const asignados = products.filter((p) => p.category_id === cat.id).length
    const msg = asignados > 0
      ? `¿Eliminar la categoría "${cat.nombre}"?\n\n${asignados} producto(s) quedarán sin categoría.`
      : `¿Eliminar la categoría "${cat.nombre}"?`
    if (!window.confirm(msg)) return

    const result = await eliminarCategoria(cat.id)
    if (result.error) { toast.error(result.error); return }

    if (filtroCategoria === cat.id) setFiltroCategoria('')
    setProducts((prev) => prev.map((p) => p.category_id === cat.id ? { ...p, category_id: null, categories: null } : p))
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== cat.id)
      if (updated.length === 0) setGestionCats(false)
      return updated
    })
    toast.success(`Categoría "${cat.nombre}" eliminada.`)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block mb-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-muted text-muted-foreground border border-border">
            Control de stock
          </span>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Inventario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hayFiltro
              ? <>{productosFiltrados.length} de {totalCount} productos · <span className="tabular-nums">{totalStockFiltrado.toLocaleString('es-PE')}</span> unidades</>
              : <>{totalCount} productos · <span className="tabular-nums">{totalStock.toLocaleString('es-PE')}</span> unidades en stock</>
            }
          </p>
        </div>
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-neu-sm dark:shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo producto</span>
        </button>
      </div>

      {/* Alertas de stock */}
      {(stockBajoCount > 0 || sinStockCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3"
        >
          {sinStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>{sinStockCount}</strong> {sinStockCount === 1 ? 'producto sin stock' : 'productos sin stock'}</span>
            </div>
          )}
          {stockBajoCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>{stockBajoCount}</strong> {stockBajoCount === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="input-field !pl-9 w-full"
          />
        </div>

        {/* Categoría */}
        <div className="flex items-center gap-1.5">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="input-field sm:!w-44"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {categories.length > 0 && (
            <button
              onClick={() => setGestionCats((g) => !g)}
              title="Gestionar categorías"
              className={`p-2 rounded-lg border transition-colors ${gestionCats ? 'bg-muted border-border text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stock */}
        <select
          value={filtroStock}
          onChange={(e) => setFiltroStock(e.target.value as FiltroStock)}
          className="input-field sm:!w-20"
        >
          <option value="todos">Todos</option>
          <option value="con_stock">Con stock</option>
          <option value="bajo">Bajo</option>
          <option value="sin_stock">Agotado</option>
        </select>
      </div>

      {/* Panel gestión de categorías */}
      {gestionCats && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted border border-border rounded-xl">
          <p className="text-xs font-medium text-muted-foreground w-full">Categorías — presioná × para eliminar</p>
          {categories.map((cat) => (
            <span key={cat.id} className="flex items-center gap-1.5 pl-3 pr-2 py-1 bg-card border border-border rounded-lg text-sm text-foreground">
              {cat.nombre}
              <button
                onClick={() => handleEliminarCategoria(cat)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title={`Eliminar ${cat.nombre}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-card shadow-neu dark:shadow-none border border-border rounded-2xl overflow-hidden">
        <ProductosTable
          products={productosFiltrados}
          onEdit={handleEditar}
          onToggleActivo={handleToggleActivo}
          onAjustar={setAjustando}
          onEliminar={handleEliminar}
        />
      </div>

      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemLabel="productos"
        onPageChange={(n) => router.push(`/inventario?page=${n}`)}
      />

      {/* Modales */}
      <ProductoModal
        open={modalOpen}
        onClose={handleModalClose}
        producto={editando}
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
        onSaved={handleSaved}
      />

      <AjusteStockModal
        product={ajustando}
        onClose={() => setAjustando(null)}
        onAjustado={handleAjustado}
      />
    </div>
  )
}
