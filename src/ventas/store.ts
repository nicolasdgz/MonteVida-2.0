import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Product, PaymentMethod } from '@/types/database'
import { ANONYMOUS_CLIENT_ID, ANONYMOUS_CLIENT_NAME } from '@/lib/constants'

export interface SaleLineItem {
  product: Product
  cantidad: number
  precioUnitario: number
}

interface SaleFormState {
  lineas: SaleLineItem[]
  metodoPago: PaymentMethod
  notas: string
  clienteId: string
  clienteNombre: string
  fechaVenta: string
  descuento: number
  tipoDescuento: 'porcentaje' | 'monto'

  agregarLinea: (product: Product) => void
  quitarLinea: (productId: string) => void
  actualizarCantidad: (productId: string, cantidad: number) => void
  actualizarPrecio: (productId: string, precio: number) => void
  setCliente: (id: string, nombre: string) => void
  setMetodoPago: (m: PaymentMethod) => void
  setNotas: (n: string) => void
  setFechaVenta: (f: string) => void
  setDescuento: (d: number) => void
  setTipoDescuento: (t: 'porcentaje' | 'monto') => void
  resetForm: () => void
}

const todayISO = () => new Date().toISOString().split('T')[0]

const initialFormData = {
  lineas: [] as SaleLineItem[],
  metodoPago: 'yape' as PaymentMethod,
  notas: '',
  clienteId: ANONYMOUS_CLIENT_ID,
  clienteNombre: ANONYMOUS_CLIENT_NAME,
  fechaVenta: todayISO(),
  descuento: 0,
  tipoDescuento: 'porcentaje' as const,
}

export const useSaleForm = create<SaleFormState>()(
  persist(
    immer((set) => ({
      ...initialFormData,

      agregarLinea: (product) =>
        set((state) => {
          const existing = state.lineas.find((l) => l.product.id === product.id)
          if (existing) {
            existing.cantidad += 1
          } else {
            state.lineas.push({
              product,
              cantidad: 1,
              precioUnitario: product.precio_venta,
            })
          }
        }),

      quitarLinea: (productId) =>
        set((state) => {
          state.lineas = state.lineas.filter((l) => l.product.id !== productId)
        }),

      actualizarCantidad: (productId, cantidad) =>
        set((state) => {
          if (cantidad <= 0) {
            state.lineas = state.lineas.filter((l) => l.product.id !== productId)
            return
          }
          const linea = state.lineas.find((l) => l.product.id === productId)
          if (linea) linea.cantidad = cantidad
        }),

      actualizarPrecio: (productId, precio) =>
        set((state) => {
          const linea = state.lineas.find((l) => l.product.id === productId)
          if (linea) linea.precioUnitario = precio
        }),

      setCliente: (id, nombre) =>
        set((state) => {
          state.clienteId = id
          state.clienteNombre = nombre
        }),

      setMetodoPago: (metodoPago) => set((state) => { state.metodoPago = metodoPago }),
      setNotas: (notas) => set((state) => { state.notas = notas }),
      setFechaVenta: (fechaVenta) => set((state) => { state.fechaVenta = fechaVenta }),
      setDescuento: (d) => set((state) => { state.descuento = d < 0 ? 0 : d }),
      setTipoDescuento: (tipoDescuento) =>
        set((state) => {
          state.tipoDescuento = tipoDescuento
          state.descuento = 0
        }),
      resetForm: () =>
        set((state) => {
          state.lineas = []
          state.metodoPago = 'yape'
          state.notas = ''
          state.clienteId = ANONYMOUS_CLIENT_ID
          state.clienteNombre = ANONYMOUS_CLIENT_NAME
          state.fechaVenta = todayISO()
          state.descuento = 0
          state.tipoDescuento = 'porcentaje'
        }),
    })),
    {
      name: 'saleForm',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lineas: state.lineas,
        metodoPago: state.metodoPago,
        notas: state.notas,
        clienteId: state.clienteId,
        clienteNombre: state.clienteNombre,
        fechaVenta: state.fechaVenta,
        descuento: state.descuento,
        tipoDescuento: state.tipoDescuento,
      }),
    }
  )
)
