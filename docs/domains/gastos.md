# Spec: Gastos

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Registro y gestión de gastos operativos del negocio clasificados en 9 categorías. Admin-only. Soporta adjuntar comprobantes (imágenes) a cada gasto.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/gastos` | Server Component | admin | Lista de gastos con filtros por mes/categoría |

---

## Server Actions

### `crearGasto(formData: FormData): Promise<{ error: string | null; expense: Expense | null }>`

**Archivo:** `src/app/(admin)/gastos/actions.ts`

**Input (FormData):**
```typescript
// categoria: ExpenseCategory
// descripcion: string (requerido, se hace trim())
// monto: string (float)
// fecha: string (YYYY-MM-DD)
// comprobante?: File (opcional)
```

**Output:** `Expense` de `src/types/database.ts`

**Proceso:**
1. Verifica rol admin via `requireAdmin()` de `@/lib/dal`
2. Inserta en `expenses`
3. Si hay comprobante: sube a bucket `comprobantes` via `uploadFile`, actualiza `expenses.comprobante_url`

**Side-effects:**
- Inserta en `expenses`
- Sube archivo a Storage (si se adjunta)
- Actualiza `expenses.comprobante_url`
- `revalidatePath('/gastos')`

**Permisos:** `requireAdmin()` — solo admin

---

### `actualizarGasto(id: string, formData: FormData): Promise<{ error: string | null; expense: Expense | null }>`

**Input (FormData):** mismos campos que `crearGasto` + `comprobanteExistente?: string`

**Proceso:**
1. Actualiza `expenses` (categoria, descripcion, monto, fecha)
2. Si hay nuevo comprobante: reemplaza el existente en Storage (`upsert: true`)
3. Si no hay nuevo comprobante: mantiene `comprobanteExistente`

**Side-effects:**
- Actualiza `expenses`
- Reemplaza archivo en Storage si se adjunta uno nuevo
- `revalidatePath('/gastos')`

**Permisos:** `requireAdmin()`

---

### `eliminarGasto(id: string): Promise<{ error: string | null }>`

**Side-effects:**
- Elimina fila de `expenses`
- `revalidatePath('/gastos')`
- No elimina el archivo del bucket (archivo huérfano — aceptable en MVP)

**Permisos:** `requireAdmin()`

---

## Componentes

### `GastosClient`

**Tipo:** Client Component
**Archivo:** `src/components/gastos/GastosClient.tsx`

**Props:**
```typescript
interface GastosClientProps {
  gastos: Expense[]
}
```

**Responsabilidades:**
- Navegación mes/año (← →) con botón siguiente deshabilitado si mes actual
- Stats cards: total del mes, cantidad, categoría con mayor gasto
- Filtros por las 9 categorías (botones toggle)
- Tabla: fecha, descripción, categoría, monto, link comprobante, acciones (editar/eliminar)
- Abre `GastoModal` para crear/editar
- Confirma eliminación antes de ejecutar

**No debe:** recargar datos del servidor — actualiza estado local con el gasto retornado por la action

---

### `GastoModal`

**Tipo:** Client Component
**Archivo:** `src/components/gastos/GastoModal.tsx`

**Props:**
```typescript
interface GastoModalProps {
  gasto?: Expense | null       // null = crear nuevo
  open: boolean
  onClose: () => void
  onSaved: (gasto: Expense) => void
}
```

**Responsabilidades:**
- Formulario: descripción (requerido), categoría (dropdown 9 opciones), monto (requerido), fecha, comprobante (file input)
- Preview del comprobante con opción de eliminar o reemplazar
- Llama `crearGasto` o `actualizarGasto` según modo
- Validación: descripción y monto requeridos antes de submit

---

## Tipos requeridos

```typescript
// src/types/database.ts — ya existen
type Expense = Tables<"expenses">
type ExpenseCategory = Enums<"expense_category">
// 'alquiler' | 'servicios' | 'personal' | 'marketing' | 'logistica'
// | 'mantenimiento' | 'impuestos' | 'mercaderia' | 'otros'
```

---

## Reglas de negocio

- Solo `admin` puede crear/editar/eliminar gastos — staff no tiene acceso a `/gastos`
- El comprobante es opcional — un gasto sin imagen es válido
- Al eliminar un gasto, el archivo del bucket **no** se elimina (MVP: limpieza manual)
- `monto` debe ser positivo (check constraint en DB: `monto > 0`)
- `fecha` default hoy si no se especifica
- El historial carga los últimos 500 gastos ordenados por fecha DESC

---

## Acceptance Criteria

- [x] `crearGasto` requiere admin — retorna error descriptivo si no
- [x] `crearGasto` inserta en `expenses` con todos los campos
- [x] Comprobante se sube a bucket `comprobantes` vía `uploadFile` si se adjunta
- [x] `actualizarGasto` reemplaza comprobante si se adjunta uno nuevo (`upsert: true`)
- [x] `actualizarGasto` mantiene `comprobanteExistente` si no hay nuevo archivo
- [x] `eliminarGasto` elimina solo la fila de DB (no el archivo Storage)
- [x] `revalidatePath('/gastos')` en todas las mutaciones
- [x] `GastosClient` filtra gastos por categoría client-side
- [x] `GastoModal` valida descripción y monto antes de submit
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente
