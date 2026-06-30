# Spec: Inventario

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Gestión completa del catálogo de productos: CRUD, control de stock, categorías, imágenes y presencia web (visible en storefront). Dominio admin-only.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/inventario` | Server Component | admin | Lista completa de productos con filtros |
| `/inventario/[productId]` | Server Component | admin | Detalle + historial de ventas + presencia web |

---

## Server Actions

### `crearProducto(payload: ProductoPayload): Promise<ProductResult>`

**Input:**
```typescript
interface ProductoPayload {
  nombre: string
  codigo?: string
  descripcion?: string
  category_id?: string
  precio_costo: number
  precio_venta: number
  stock: number
  stock_minimo: number
  unidad: string
  activo: boolean
}
```

**Output:**
```typescript
interface ProductResult {
  error: string | null
  product: ProductWithCategory | null
}
```

**Side-effects:**
- Inserta en `products`
- `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()` de `@/lib/dal`

---

### `actualizarProducto(id: string, payload: Partial<ProductoPayload>): Promise<ProductResult>`

**Side-effects:**
- Actualiza campos en `products`
- `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()`

---

### `eliminarProducto(id: string): Promise<ActionResult>`

**Validación previa:**
- Cuenta `sale_items` con ese `product_id` — rechaza si > 0
- Cuenta `compra_items` con ese `product_id` — rechaza si > 0
- Mensaje de error descriptivo incluye el conteo

**Side-effects:** Elimina fila de `products`

**Permisos:** `requireAdmin()`

**Alternativa recomendada al usuario:** usar `toggleActivoProducto` para ocultar sin eliminar

---

### `toggleActivoProducto(id: string, activo: boolean): Promise<ActionResult>`

**Output:**
```typescript
interface ActionResult {
  error: string | null
}
```

**Side-effects:** Actualiza `products.activo`, `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()`

---

### `ajustarStock(id: string, delta: number): Promise<ProductResult>`

**Lógica:** `newStock = Math.max(0, currentStock + delta)` — stock mínimo absoluto es 0

**Side-effects:**
- Lee stock actual, calcula nuevo stock
- Actualiza `products.stock`
- `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()`

---

### `crearCategoria(nombre: string): Promise<{ id: string | null; error: string | null }>`

**Side-effects:** Inserta en `categories`, `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()`

---

### `subirImagenProducto(productId: string, formData: FormData): Promise<{ error: string | null; imageUrl?: string }>`

**Input:** `image: File` — máx 5 MB

**Proceso:**
1. Valida presencia y tamaño del archivo
2. Sube a bucket `product-images` con path `{productId}.{ext}` via `uploadFile`
3. URL final incluye cache buster: `{publicUrl}?v={Date.now()}`
4. Actualiza `products.imagen_url`

**Side-effects:**
- Sube archivo a Storage
- Actualiza `products.imagen_url`
- `revalidatePath('/inventario/{productId}')`, `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()`

---

### `actualizarWebProducto(productId: string, payload: { visible_web?: boolean; precio_oferta?: number | null }): Promise<ActionResult>`

**Side-effects:**
- Actualiza `products.visible_web` y/o `products.precio_oferta`
- `revalidatePath('/inventario/{productId}')`, `revalidatePath('/inventario')`

**Permisos:** `requireAdmin()`

**Regla de negocio:** `visible_web=true` solo tiene efecto si el producto tiene `imagen_url` — la UI debe reforzar esto

---

## Componentes

### `InventarioClient`

**Tipo:** Client Component
**Archivo:** `src/components/inventario/InventarioClient.tsx`

**Props:**
```typescript
interface InventarioClientProps {
  products: ProductWithCategory[]
  categories: Category[]
}
```

**Responsabilidades:**
- Estado de búsqueda, filtro por categoría, filtro por stock (todos/bajo/sin_stock)
- Abre `ProductoModal` para crear/editar
- Abre `AjusteStockModal` para ajuste de stock
- Muestra badges de alertas: productos sin stock, productos bajo mínimo
- Llama actions y actualiza estado local con el resultado

**No debe:** hacer queries a Supabase directamente

---

### `ProductosTable`

**Tipo:** Client Component
**Archivo:** `src/components/inventario/ProductosTable.tsx`

**Props:**
```typescript
interface ProductosTableProps {
  products: ProductWithCategory[]
  onEdit: (product: ProductWithCategory) => void
  onToggleActivo: (product: ProductWithCategory) => void
  onEliminar: (product: ProductWithCategory) => void
  onAjustar: (product: ProductWithCategory) => void
  // Botón "Nuevo" está en InventarioClient, no en ProductosTable
}
```

**Responsabilidades:**
- Tabla con columnas: nombre/código, categoría, precio costo, precio venta (con toggle IGV), stock con badge, estado activo, acciones
- Ordenación de columna stock (asc/desc/ninguno)
- Precios con toggle IGV desde `useConfiguracion`

---

### `ProductoModal`

**Tipo:** Client Component
**Archivo:** `src/components/inventario/ProductoModal.tsx`

**Props:**
```typescript
interface ProductoModalProps {
  product?: ProductWithCategory | null   // null = crear nuevo
  categories: Category[]
  open: boolean
  onClose: () => void
  onSaved: (product: ProductWithCategory) => void
  onCategoryCreated: (category: Category) => void
}
```

**Responsabilidades:**
- Formulario crear/editar con todos los campos de `ProductoPayload`
- Creación de categoría inline via `crearCategoria`
- Validación: nombre, precio_venta, stock son requeridos

---

### `AjusteStockModal`

**Tipo:** Client Component
**Archivo:** `src/components/inventario/AjusteStockModal.tsx`

**Props:**
```typescript
interface AjusteStockModalProps {
  product: ProductWithCategory | null
  open: boolean
  onClose: () => void
  onAdjusted: (product: ProductWithCategory) => void
}
```

**Responsabilidades:**
- Toggle Entrada/Salida (positivo/negativo delta)
- Preview de stock resultante con color (verde si ≥ stock_minimo, rojo si no)
- Llama `ajustarStock(id, delta)` al confirmar

---

### `StockBadge`

**Tipo:** Client Component (puede ser Server Component si no usa hooks)
**Archivo:** `src/components/inventario/StockBadge.tsx`

**Props:**
```typescript
interface StockBadgeProps {
  stock: number
  stockMinimo: number
  // unidad no recibe como prop — muestra "uds." hardcoded
}
```

**Lógica de visualización:**
- `stock === 0` → rojo "Sin stock"
- `stock <= stockMinimo` → ámbar "N und (bajo mínimo)"
- Normal → verde "N und"

---

### `ProductoVentasClient`

**Tipo:** Client Component
**Archivo:** `src/components/inventario/ProductoVentasClient.tsx`

**Props:**
```typescript
interface ProductoVentasClientProps {
  product: ProductWithCategory
  sales: SaleItemRow[]      // sale_items con join a sales + clientes + profiles
  isAdmin: boolean
}
```

**Responsabilidades:**
- Header con datos del producto y stock actual
- Stats cards: ventas completadas, unidades vendidas, revenue
- Panel "Presencia web" (solo admin): upload imagen, toggle visible_web, precio_oferta
- Tabla de ventas del producto
- Abre `VentaDetalleModal` al clic

---

## Tipos requeridos

```typescript
// src/types/database.ts — ya existen
type Product           // row de tabla products
type ProductWithCategory  // Product + { categories: Category | null }
type Category          // row de tabla categories

// src/app/(admin)/inventario/actions.ts — interfaces locales
interface ProductoPayload { ... }
interface ActionResult { error: string | null }
interface ProductResult { error: string | null; product: ProductWithCategory | null }
```

---

## Reglas de negocio

- Un producto NO puede eliminarse si tiene `sale_items` o `compra_items` asociados — debe desactivarse
- Stock mínimo absoluto es 0 — `ajustarStock` hace `Math.max(0, current + delta)`
- `visible_web=true` requiere que el producto tenga `imagen_url` no nulo — la UI debe prevenir toggle sin imagen
- `precio_oferta` puede ser null (sin oferta) o un número menor a `precio_venta`
- Productos con `activo=false` no aparecen en el storefront aunque tengan `visible_web=true`
- Todas las actions son admin-only — staff no puede modificar inventario

---

## Acceptance Criteria

- [x] `crearProducto` inserta en `products` con todos los campos opcionales manejados
- [x] `actualizarProducto` acepta payload parcial (solo campos modificados)
- [x] `eliminarProducto` rechaza con mensaje descriptivo si hay ventas o compras asociadas
- [x] `toggleActivoProducto` actualiza solo el campo `activo`
- [x] `ajustarStock` respeta floor de 0 — nunca stock negativo
- [x] `crearCategoria` inserta en `categories` con revalidación
- [x] `subirImagenProducto` valida tamaño (max 5MB), sube a `product-images`, actualiza `imagen_url`
- [x] URL de imagen incluye cache buster `?v={timestamp}`
- [x] `actualizarWebProducto` actualiza `visible_web` y/o `precio_oferta`
- [x] `StockBadge` muestra 3 estados (sin stock / bajo mínimo / normal) con colores correctos
- [x] `AjusteStockModal` muestra preview del stock resultante antes de confirmar
- [x] `ProductoModal` permite crear categoría inline sin cerrar el modal
- [x] Panel "Presencia web" solo visible para admin
- [x] Todas las actions retornan `{ error: string | null }` — nunca throw al cliente
