# Spec: Reportes

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Dashboard financiero admin-only con KPIs agregados por rango de fechas: ventas, costos, márgenes, gastos, compras y productos más vendidos. Solo lectura — ninguna acción muta datos.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/reportes` | Server Component | admin | Dashboard con 4 tabs de métricas financieras |

---

## Server Actions

### `fetchKpis(desde: string, hasta: string): Promise<ActionResult<KpisData>>`

**Archivo:** `src/app/(admin)/reportes/actions.ts`

**Input:** fechas ISO `YYYY-MM-DD`

**Output:**
```typescript
// src/types/reportes.ts
interface KpisData {
  totalVentas: number          // suma de sales.total donde status='completada'
  totalCosto: number           // suma de sale_items.cantidad * precio_costo
  utilidadBruta: number        // totalVentas - totalCosto
  totalGastosOperativos: number // suma expenses.monto
  totalCompras: number         // suma compras.total
  totalEgresos: number         // totalGastosOperativos + totalCompras
  utilidadNeta: number         // utilidadBruta - totalEgresos
  igvRecaudado: number         // suma sales.igv_monto
  cantidadVentas: number       // count de sales completadas
}
```

**Lógica:**
1. Query ventas completadas en rango → `totalVentas`, `igvRecaudado`, `cantidadVentas`, lista de IDs
2. Query `sale_items` para esos IDs → `totalCosto`
3. Query paralela: `expenses` + `compras` en rango

**Side-effects:** ninguno (solo lectura)

**Permisos:** `requireAdmin()`

---

### `fetchVentasPorMetodo(desde: string, hasta: string): Promise<ActionResult<VentaPorMetodo[]>>`

**Output:**
```typescript
// src/types/reportes.ts
interface VentaPorMetodo {
  metodo: PaymentMethod
  total: number
  cantidad: number
}
```

**Lógica:** Agrupa ventas completadas por `metodo_pago`, ordena por `total` DESC

**Permisos:** `requireAdmin()`

---

### `fetchGastosPorCategoria(desde: string, hasta: string): Promise<ActionResult<GastoPorCategoria[]>>`

**Output:**
```typescript
// src/types/reportes.ts
interface GastoPorCategoria {
  categoria: string
  total: number
  cantidad: number
}
```

**Lógica:**
- Agrupa `expenses` por `categoria` en rango
- Agrega `compras_mercaderia` (suma de `compras.total`) como categoría extra si hay compras

**Permisos:** `requireAdmin()`

---

### `fetchTopProductos(desde: string, hasta: string): Promise<ActionResult<TopProducto[]>>`

**Output:**
```typescript
// src/types/reportes.ts
interface TopProducto {
  nombre: string
  codigo: string | null
  cantidad: number
  revenue: number     // suma de sale_items.subtotal ?? 0
}
```

**Lógica:**
1. Obtiene IDs de ventas completadas en rango
2. Si no hay ventas: retorna `[]` sin query adicional
3. Query `sale_items` con join a `products(nombre, codigo)`
4. Agrupa por `product_id`, ordena por `revenue` DESC, slice top 10

**Permisos:** `requireAdmin()`

---

## Componentes

### `ReportesClient`

**Tipo:** Client Component
**Archivo:** `src/components/reportes/ReportesClient.tsx`

**Props:**
```typescript
interface ReportesClientProps {
  initialKpis: KpisData | null
  initialDesde: string
  initialHasta: string
}
```

**Responsabilidades:**
- Selector de rango: 4 presets (este mes, mes anterior, trimestre, año) + custom date pickers
- Cache por clave `${desde}-${hasta}` para evitar refetch con mismo rango
- 4 tabs: Resumen financiero / Ventas por método / Gastos por categoría / Productos más vendidos
- `KpiCard` sub-componente: valor, label, color (verde/rojo/neutro) según si es ingreso o egreso
- `BarList` sub-componente: lista con barra proporcional para distribución
- Tab "Productos" muestra top 10 en tabla con nombre, código, cantidad, revenue

**No debe:** hacer queries directas a Supabase — delegar a Server Actions

---

## Tipos requeridos

```typescript
// src/types/reportes.ts — ya creados y exportados
export interface KpisData { ... }
export interface VentaPorMetodo { ... }
export interface GastoPorCategoria { ... }
export interface TopProducto { ... }

// src/types/database.ts
type PaymentMethod   // usado en VentaPorMetodo
```

---

## Reglas de negocio

- Todos los KPIs filtran `sales.status='completada'` — ventas anuladas o pendientes no se cuentan
- `igvRecaudado` incluye el IGV ya cobrado en ventas (no es proyección)
- `revenue` en TopProductos usa `sale_items.subtotal ?? 0` (subtotal puede ser null en DB)
- Solo `admin` accede — staff es redirigido a `/ventas` desde el Server Component
- El cálculo de costos usa `precio_costo` del momento de la venta (no el precio actual del producto)
- `compras_mercaderia` en gastos por categoría agrega las compras a proveedores como una categoría más de egresos

---

## Acceptance Criteria

- [x] `fetchKpis` filtra solo `status='completada'` para ventas
- [x] `totalCosto` calculado desde `sale_items` (no desde products.precio_costo actual)
- [x] `igvRecaudado` suma `igv_monto` de ventas completadas
- [x] `fetchVentasPorMetodo` agrupa por `metodo_pago` y ordena por total DESC
- [x] `fetchGastosPorCategoria` incluye `compras_mercaderia` si hay compras en el rango
- [x] `fetchTopProductos` retorna `[]` sin query adicional si no hay ventas en el rango
- [x] `revenue` en TopProductos usa `?? 0` para subtotal null
- [x] Solo admin accede — Server Component redirige staff a /ventas
- [x] `ReportesClient` cachea resultados por clave de rango para evitar refetches
- [x] Error retornado como `{ error: string | null; data: T | null }` — nunca throw al cliente
