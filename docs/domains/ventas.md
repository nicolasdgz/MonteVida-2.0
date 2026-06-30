# Spec: Ventas (POS)

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Sistema POS interno para que staff y admin registren ventas presenciales, gestionen historial y procesen pedidos web entrantes. Dominio central del panel admin.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/ventas` | Server Component | staff+ | Formulario POS principal |
| `/ventas/historial` | Server Component | staff+ | Historial filtrable con acciones admin |

---

## Server Actions

### `registrarVenta(formData: FormData): Promise<RegistrarResult>`

**Archivo:** `src/app/(admin)/ventas/actions.ts`

**Input (campos de FormData):**
```typescript
// lines: string         — JSON serializado de LineaInput[]
// metodoPago: string    — PaymentMethod enum
// notas?: string
// clienteId?: string    — UUID, default ANONYMOUS_CLIENT_ID
// fechaVenta?: string   — YYYY-MM-DD, default hoy
// voucher?: File        — imagen del comprobante
// aplicarIgv: '0'|'1'
// descuentoMonto?: string — float como string
```

**Input type exportado:**
```typescript
export interface LineaInput {
  product_id: string
  cantidad: number
  precio_unitario: number
  precio_costo: number
}
```

**Output:**
```typescript
export interface RegistrarResult {
  error: string | null
  saleId: string | null
  voucherWarning?: string   // error no-bloqueante de upload
}
```

**Side-effects:**
- Inserta fila en `sales` (staff_id, metodo_pago, status='completada', cliente_id, fecha_venta)
- Inserta filas en `sale_items` — trigger DB descuenta stock automáticamente
- Si `!aplicarIgv || descuentoMonto > 0`: recalcula y actualiza subtotal/igv_monto/total/descuento en `sales`
- Si voucher adjunto: sube a bucket `vouchers` via `uploadFile`, actualiza `sales.voucher_url`
- `revalidatePath('/ventas')`, `revalidatePath('/ventas/historial')`

**Permisos:** `verifySession()` — cualquier staff autenticado

---

### `fetchHistorialVentas(desde: string | null, hasta: string | null): Promise<{ error: string | null; sales: unknown[] }>`

**Input:** fechas ISO o null para sin filtro

**Side-effects:** ninguno (solo lectura)

**Filtros aplicados:**
- Non-admin: solo ventas propias (`staff_id = user.id`)
- Admin: todas las ventas
- Rango de fechas si se proveen

**Permisos:** `verifySession()` — role-aware

---

### `anularVenta(saleId: string): Promise<{ error: string | null }>`

**Side-effects:**
- Actualiza `sales.status = 'anulada'` solo si era 'completada'
- Trigger DB restaura stock al anular
- `revalidatePath('/ventas/historial')`

**Permisos:** `requireAdmin()` — solo admin

---

### `subirVoucherVenta(formData: FormData): Promise<{ error: string | null; voucherUrl?: string }>`

**Input:** `saleId: string`, `voucher: File`

**Side-effects:**
- Sube imagen a bucket `vouchers` con path `{saleId}.{ext}?v={timestamp}`
- Actualiza `sales.voucher_url`
- `revalidatePath('/ventas/historial')`

**Permisos:** `requireAdmin()` — solo admin

---

### `actualizarFechaVenta(saleId: string, fechaVenta: string): Promise<{ error: string | null }>`

**Validación:** `fechaVenta` debe coincidir con `/^\d{4}-\d{2}-\d{2}$/`

**Side-effects:** Actualiza `sales.fecha_venta`, `revalidatePath('/ventas/historial')`

**Permisos:** `requireAdmin()` — solo admin

---

### `confirmarPedidoWeb(saleId: string): Promise<{ error: string | null }>`

**Side-effects:**
- Actualiza `sales.status = 'completada'` y `estado_envio = 'preparando'`
- Solo si `status='pendiente'` y `origen='web'`
- `revalidatePath('/ventas/historial')`

**Permisos:** `requireAdmin()` — solo admin

---

### `eliminarVenta(saleId: string): Promise<{ error: string | null }>`

**Precondición:** La venta debe estar en status 'anulada' — rechaza si no

**Side-effects:**
- Elimina fila de `sales` (y sale_items en cascade)
- Usa `createAdminClient()` para bypass RLS (no hay policy DELETE)
- `revalidatePath('/ventas/historial')`

**Permisos:** `requireAdmin()` — solo admin

---

## Componentes

### `RegistroVentaClient`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/RegistroVentaClient.tsx`

**Props:**
```typescript
interface RegistroVentaClientProps {
  products: ProductWithCategory[]
}
```

**Responsabilidades:**
- Layout del POS: grid 2-col (formulario) + 1-col (resumen)
- Orquesta BuscadorClientes, BuscadorProductos, LineasVenta, ResumenVenta
- Llama `router.refresh()` tras venta exitosa para limpiar estado del servidor

**No debe:** hacer queries a Supabase, calcular totales (eso es ResumenVenta + store)

---

### `BuscadorProductos`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/BuscadorProductos.tsx`

**Props:** ninguna (lee `products` del store `useSaleForm` — recibe productos via prop del padre)

**Responsabilidades:**
- Búsqueda en tiempo real por nombre o código (filtro in-memory)
- Muestra hasta 8 resultados con stock, unidad, precio
- Deshabilita productos con stock 0
- Indica visualmente si el producto ya está en el carrito
- Llama `useSaleForm.agregarLinea()` al seleccionar

---

### `BuscadorClientes`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/BuscadorClientes.tsx`

**Responsabilidades:**
- 3 estados: cliente real seleccionado / modo anónimo / input de búsqueda
- Filtrado in-memory de lista de clientes pre-cargada
- Creación de cliente nuevo via `crearCliente` action si no existe
- Actualiza `useSaleForm.setCliente()`

---

### `LineasVenta`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/LineasVenta.tsx`

**Responsabilidades:**
- Renderiza líneas del store `useSaleForm.lineas`
- Controles qty (−/+/input), editor precio unitario, subtotal, eliminar
- Indica advertencia visual si qty > stock disponible

---

### `ResumenVenta`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/ResumenVenta.tsx`

**Responsabilidades:**
- Calcula y muestra subtotal, descuento, IGV, total usando valores del store
- Toggle descuento (% vs monto fijo)
- Selector de método de pago (5 opciones: Yape, Plin, Transferencia, Tarjeta, Efectivo)
- Date picker para fecha de venta
- Upload de voucher (drag-drop)
- Textarea de notas
- Botón submit — llama `registrarVenta` via `await` directo con `useState` para loading state
- Deshabilita submit si: no hay líneas, hay productos con qty > stock

---

### `HistorialClient`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/HistorialClient.tsx`

**Props:**
```typescript
interface HistorialClientProps {
  initialSales: SaleRow[]
  isAdmin: boolean
}
```

**Responsabilidades:**
- Tabla de ventas con filtros (status, método de pago, origen, búsqueda texto)
- Filtro de fecha con refetch al backend
- Export CSV
- Abre `VentaDetalleModal` al clic de fila
- Botón eliminar solo en ventas 'anulada'

---

### `VentaDetalleModal`

**Tipo:** Client Component
**Archivo:** `src/components/ventas/VentaDetalleModal.tsx`

**Props:**
```typescript
interface VentaDetalleModalProps {
  saleId: string | null
  isAdmin: boolean
  onClose: () => void
  onUpdated: () => void
}
```

**Responsabilidades:**
- Muestra detalle completo: items, totales, cliente, staff, estado_envio, voucher
- Acciones admin: confirmar pedido web, anular, subir voucher, editar fecha

---

## Tipos requeridos

```typescript
// src/types/database.ts — ya existen
type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'whatsapp'
type SaleStatus = 'pendiente' | 'completada' | 'anulada'
type SaleOrigen = 'pos' | 'web'
type EstadoEnvio = 'pendiente' | 'preparando' | 'enviado' | 'entregado'
type ProductWithCategory  // en database.ts
type Sale, SaleItem, SaleWithItems  // en database.ts

// src/app/(admin)/ventas/actions.ts — tipos de las actions
export interface LineaInput { product_id, cantidad, precio_unitario, precio_costo }
export interface RegistrarResult { error, saleId, voucherWarning? }
```

---

## Store: `useSaleForm`

**Archivo:** `src/store/saleForm.ts` — Zustand + Immer + persist

```typescript
interface SaleLineItem {
  product_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  precio_costo: number
  stock: number
  unidad: string
}

// Estado
lineas: SaleLineItem[]
metodoPago: PaymentMethod
notas: string
clienteId: string          // default ANONYMOUS_CLIENT_ID
clienteNombre: string
fechaVenta: string          // ISO date, default hoy
descuento: number
tipoDescuento: 'porcentaje' | 'monto'
```

---

## Reglas de negocio

- Stock se descuenta via trigger DB al insertar `sale_items` — nunca descontar manualmente desde actions
- Stock se restaura via trigger DB al anular una venta
- Si cliente no especificado: usar `ANONYMOUS_CLIENT_ID` de `@/lib/constants`
- IGV se recalcula solo si `aplicarIgv=false` o `descuentoMonto > 0`
- Anular solo funciona sobre ventas en status 'completada'
- Eliminar solo funciona sobre ventas en status 'anulada' (requiere service role para bypass RLS)
- Ventas web (origen='web') muestran badge `WEB` en historial
- Confirmar pedido web solo aplica si: `status='pendiente'`, `origen='web'`, rol admin
- `voucherWarning` en `RegistrarResult` es error no-bloqueante — la venta se registró aunque el voucher falle

---

## Acceptance Criteria

- [x] `registrarVenta` inserta en `sales` + `sale_items` correctamente
- [x] Stock se descuenta via trigger (no manualmente)
- [x] Descuento y sin-IGV recalculan totales en `sales`
- [x] Voucher se sube a bucket `vouchers` si se adjunta
- [x] `revalidatePath` llamado en `/ventas` y `/ventas/historial`
- [x] `anularVenta` solo admin, solo en 'completada'
- [x] `eliminarVenta` solo en 'anulada', usa service role
- [x] `confirmarPedidoWeb` cambia status+'preparando', solo admin
- [x] `HistorialClient` filtra por status, método, origen, texto
- [x] Badge `WEB` en ventas con `origen='web'`
- [x] `VentaDetalleModal` muestra acciones condicionales por rol y status
- [x] `ResumenVenta` deshabilita submit si qty > stock
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente
