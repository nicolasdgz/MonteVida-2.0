'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { editarVenta } from '@/app/(admin)/ventas/actions'
import { formatearMonto } from '@/utils/igv'
import toast from 'react-hot-toast'

interface EditItem {
  product_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  precio_costo: number
}

interface ProductOption {
  id: string
  nombre: string
  precio_venta: number
  precio_costo: number
  stock: number
}

interface Props {
  saleId: string
  saleNumero: number
  onClose: () => void
  onSaved: () => void
}

export function EditarVentaModal({ saleId, saleNumero, onClose, onSaved }: Props) {
  const [items, setItems]           = useState<EditItem[]>([])
  const [products, setProducts]     = useState<ProductOption[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: saleItems, error: itemsError }, { data: allProducts, error: productsError }] = await Promise.all([
        supabase
          .from('sale_items')
          .select('product_id, cantidad, precio_unitario, precio_costo, products(nombre)')
          .eq('sale_id', saleId),
        supabase
          .from('products')
          .select('id, nombre, precio_venta, precio_costo, stock')
          .eq('activo', true)
          .order('nombre'),
      ])

      if (itemsError || productsError) {
        toast.error('Error al cargar los datos de la venta.')
        setLoading(false)
        return
      }

      type RawItem = { product_id: string; cantidad: number; precio_unitario: number; precio_costo: number; products: { nombre: string } | null }
      setItems(
        ((saleItems ?? []) as unknown as RawItem[]).map((i) => ({
          product_id:      i.product_id,
          nombre:          i.products?.nombre ?? i.product_id,
          cantidad:        i.cantidad,
          precio_unitario: i.precio_unitario,
          precio_costo:    i.precio_costo,
        }))
      )
      setProducts((allProducts ?? []) as unknown as ProductOption[])
      setLoading(false)
    }
    load()
  }, [saleId])

  function handleAdd() {
    if (!selectedId) return
    const p = products.find((x) => x.id === selectedId)
    if (!p) return
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id)
      if (existing) {
        return prev.map((i) => i.product_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, {
        product_id:      p.id,
        nombre:          p.nombre,
        cantidad:        1,
        precio_unitario: p.precio_venta,
        precio_costo:    p.precio_costo,
      }]
    })
    setSelectedId('')
  }

  function handleRemove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleField(index: number, field: 'cantidad' | 'precio_unitario', raw: string) {
    const value = field === 'cantidad' ? parseInt(raw, 10) : parseFloat(raw)
    if (isNaN(value) || value < 0) return
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    if (!items.length) { toast.error('Debe haber al menos un producto.'); return }
    if (items.some((i) => i.cantidad <= 0)) { toast.error('Todas las cantidades deben ser mayores a 0.'); return }
    setSaving(true)
    try {
      const result = await editarVenta(saleId, items.map((i) => ({
        product_id:      i.product_id,
        cantidad:        i.cantidad,
        precio_unitario: i.precio_unitario,
        precio_costo:    i.precio_costo,
      })))
      if (result.error) { toast.error(result.error); return }
      toast.success('Venta actualizada.')
      onSaved()
      onClose()
    } catch (err) {
      console.error('[EditarVentaModal] handleSave error:', err)
      toast.error('Error inesperado al guardar. Revisá la consola.')
    } finally {
      setSaving(false)
    }
  }

  const subtotal = items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
      <div className="bg-card border border-border rounded-2xl shadow-neu dark:shadow-none w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-foreground font-semibold">
            Editar venta <span className="text-muted-foreground font-normal">#{saleNumero}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <>
              {/* Tabla de ítems */}
              <div className="bg-muted rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Producto</th>
                      <th className="text-center px-3 py-2.5 text-muted-foreground font-medium w-24">Cant.</th>
                      <th className="text-right px-3 py-2.5 text-muted-foreground font-medium w-32">P. Unit.</th>
                      <th className="text-right px-3 py-2.5 text-muted-foreground font-medium w-28">Subtotal</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">
                          Sin productos. Agregá uno abajo.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-4 py-2.5 text-foreground text-sm">{item.nombre}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={item.cantidad}
                              onChange={(e) => handleField(i, 'cantidad', e.target.value)}
                              className="w-full text-center bg-background border border-input rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.precio_unitario}
                              onChange={(e) => handleField(i, 'precio_unitario', e.target.value)}
                              className="w-full text-right bg-background border border-input rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right text-foreground tabular-nums">
                            {formatearMonto(item.cantidad * item.precio_unitario)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => handleRemove(i)}
                              className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border">
                        <td colSpan={3} className="px-4 py-2.5 text-right text-muted-foreground font-medium text-sm">
                          Total estimado
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatearMonto(subtotal)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Agregar producto */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Agregar producto</p>
                <div className="flex gap-2">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {formatearMonto(p.precio_venta)} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-primary/8 border border-border rounded-xl text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || items.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
