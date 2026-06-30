'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { crearProducto, actualizarProducto, crearCategoria } from '@/app/(admin)/inventario/actions'
import type { ProductWithCategory, Category } from '@/types/database'

interface ProductoModalProps {
  open: boolean
  onClose: () => void
  producto?: ProductWithCategory | null
  categories: Category[]
  onCategoryCreated: (cat: Category) => void
  onSaved: (product: ProductWithCategory, isEdit: boolean) => void
}

const UNIDADES = ['und', 'kg', 'g', 'lt', 'ml', 'caja', 'paq', 'doc']

const emptyForm = {
  nombre: '',
  codigo: '',
  descripcion: '',
  category_id: '',
  precio_costo: '',
  precio_venta: '',
  stock: '',
  stock_minimo: '5',
  unidad: 'und',
  activo: true,
}

export function ProductoModal({ open, onClose, producto, categories, onCategoryCreated, onSaved }: ProductoModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [newCategoria, setNewCategoria] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const isEditing = !!producto

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre,
        codigo: producto.codigo ?? '',
        descripcion: producto.descripcion ?? '',
        category_id: producto.category_id ?? '',
        precio_costo: String(producto.precio_costo),
        precio_venta: String(producto.precio_venta),
        stock: String(producto.stock),
        stock_minimo: String(producto.stock_minimo),
        unidad: producto.unidad,
        activo: producto.activo,
      })
    } else {
      setForm(emptyForm)
    }
  }, [producto, open])

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.precio_venta || !form.stock) {
      toast.error('Completá los campos obligatorios.')
      return
    }
    setLoading(true)
    const payload = {
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      category_id: form.category_id || undefined,
      precio_costo: parseFloat(form.precio_costo) || 0,
      precio_venta: parseFloat(form.precio_venta),
      stock: parseInt(form.stock),
      stock_minimo: parseInt(form.stock_minimo) || 5,
      unidad: form.unidad,
      activo: form.activo,
    }

    const result = isEditing
      ? await actualizarProducto(producto!.id, payload)
      : await crearProducto(payload)

    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(isEditing ? 'Producto actualizado.' : 'Producto creado.')
    onSaved(result.product!, isEditing)
    onClose()
  }

  async function handleCrearCategoria() {
    if (!newCategoria.trim()) return
    setAddingCat(true)
    const result = await crearCategoria(newCategoria.trim())
    setAddingCat(false)
    if (result.error) { toast.error(result.error); return }
    const cat: Category = { id: result.id!, nombre: newCategoria.trim(), descripcion: null, created_at: new Date().toISOString() }
    onCategoryCreated(cat)
    set('category_id', result.id!)
    setNewCategoria('')
    toast.success('Categoría creada.')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-neu dark:shadow-none overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">
                  {isEditing ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    placeholder="Ej: Arroz premium 1kg"
                    className="input-field"
                    required
                  />
                </div>

                {/* Código + Unidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Código</label>
                    <input
                      value={form.codigo}
                      onChange={(e) => set('codigo', e.target.value)}
                      placeholder="SKU-001"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unidad</label>
                    <select value={form.unidad} onChange={(e) => set('unidad', e.target.value)} className="input-field">
                      {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoría</label>
                  <div className="flex gap-2">
                    <select
                      value={form.category_id}
                      onChange={(e) => set('category_id', e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newCategoria}
                      onChange={(e) => setNewCategoria(e.target.value)}
                      placeholder="Nueva categoría..."
                      className="input-field flex-1 text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCrearCategoria() }}}
                    />
                    <button
                      type="button"
                      onClick={handleCrearCategoria}
                      disabled={addingCat || !newCategoria.trim()}
                      className="px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-accent border border-border disabled:opacity-40 transition-colors text-xs flex items-center gap-1"
                    >
                      {addingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Precios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Precio costo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">S/</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.precio_costo}
                        onChange={(e) => set('precio_costo', e.target.value)}
                        placeholder="0.00"
                        className="input-field pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Precio venta <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">S/</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.precio_venta}
                        onChange={(e) => set('precio_venta', e.target.value)}
                        placeholder="0.00"
                        className="input-field pl-8"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Stock actual <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number" min="0"
                      value={form.stock}
                      onChange={(e) => set('stock', e.target.value)}
                      placeholder="0"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Stock mínimo</label>
                    <input
                      type="number" min="0"
                      value={form.stock_minimo}
                      onChange={(e) => set('stock_minimo', e.target.value)}
                      placeholder="5"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => set('descripcion', e.target.value)}
                    placeholder="Descripción opcional..."
                    rows={2}
                    className="input-field resize-none"
                  />
                </div>

                {/* Activo toggle */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Producto activo</span>
                  <button
                    type="button"
                    onClick={() => set('activo', !form.activo)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-primary' : 'bg-input'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Guardar cambios' : 'Crear producto'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
