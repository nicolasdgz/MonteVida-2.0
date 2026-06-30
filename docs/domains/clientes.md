# Spec: Clientes

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Gestión del CRM de clientes identificados del POS (no anónimos). Staff y admin pueden crear/editar clientes; solo admin puede eliminarlos. Incluye historial de compras por cliente.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/clientes` | Server Component | staff+ | Lista CRUD de clientes registrados |

---

## Server Actions

### `crearCliente(payload: ClientePayload): Promise<ActionResult>`

**Archivo:** `src/app/(admin)/clientes/actions.ts`

**Input:**
```typescript
interface ClientePayload {
  nombre: string         // requerido
  telefono?: string
  tipo_documento?: string  // default 'DNI'
  numero_documento?: string
  email?: string
}
```

**Output:**
```typescript
interface ActionResult {
  error: string | null
  id?: string             // ID del cliente creado
}
```

**Side-effects:**
- Inserta en `clientes` con `es_anonimo: false`
- `revalidatePath('/clientes')`

**Permisos:** `verifySession()` — cualquier staff autenticado

---

### `actualizarCliente(id: string, payload: ClientePayload): Promise<ActionResult>`

**Validación:** Solo actualiza clientes con `es_anonimo = false` — clientes anónimos (pedidos web) no se editan

**Side-effects:**
- Actualiza `clientes` donde `id = id`
- `revalidatePath('/clientes')`

**Permisos:** `verifySession()`

---

### `eliminarCliente(id: string): Promise<ActionResult>`

**Validaciones previas:**
1. Cuenta ventas asociadas al cliente — rechaza si `count > 0`
2. Solo elimina si `es_anonimo = false`

**Side-effects:** Elimina fila de `clientes` si pasa las validaciones

**Permisos:** `verifySession()` (la validación de ventas actúa como protección de integridad)

---

### `fetchClienteSales(clienteId: string): Promise<{ error: string | null; data: unknown[] }>`

**Lógica:**
- Query ventas del cliente `status='completada'`, orden `fecha_venta` DESC, límite 100
- Retorna con `profiles(full_name)` para mostrar qué staff registró la venta

**Side-effects:** ninguno (solo lectura)

**Permisos:** `verifySession()`

---

## Componentes

### `ClientesClient`

**Tipo:** Client Component
**Archivo:** `src/components/clientes/ClientesClient.tsx`

**Props:**
```typescript
interface ClientesClientProps {
  clientes: Cliente[]
}
```

**Responsabilidades:**
- Búsqueda client-side por nombre, número de documento o teléfono
- Tabla: nombre, documento (tipo + número), teléfono, email, fecha registro
- Acciones por fila (hover): historial, editar, eliminar
- Abre `ClienteModal` para crear/editar
- Abre `ClienteHistorialModal` para ver historial de compras
- Confirmación antes de eliminar

---

### `ClienteModal`

**Tipo:** Client Component
**Archivo:** `src/components/clientes/ClienteModal.tsx`

**Props:**
```typescript
interface ClienteModalProps {
  cliente?: Cliente | null    // null = crear nuevo
  open: boolean
  onClose: () => void
  onSaved: (cliente: Cliente) => void
}
```

**Responsabilidades:**
- Campos: nombre (requerido), tipo_documento (DNI/RUC/CE/Pasaporte), numero_documento, teléfono, email
- Llama `crearCliente` o `actualizarCliente` según modo
- Retorna cliente creado/actualizado via `onSaved` para actualizar estado local

---

### `ClienteHistorialModal`

**Tipo:** Client Component
**Archivo:** `src/components/clientes/ClienteHistorialModal.tsx`

**Props:**
```typescript
interface ClienteHistorialModalProps {
  clienteId: string
  clienteNombre: string
  open: boolean
  onClose: () => void
}
```

**Responsabilidades:**
- Carga historial al abrir via `fetchClienteSales(clienteId)`
- Header: nombre del cliente, count de ventas completadas, total gastado
- Tabla: #venta, fecha, método de pago, estado (badge coloreado), total
- Estado vacío si el cliente no tiene ventas

---

## Tipos requeridos

```typescript
// src/types/database.ts — ya existen
type Cliente = Tables<"clientes">

// Internos de clientes/actions.ts (no necesitan moverse — no los importa ningún componente como tipos)
interface ClientePayload { ... }
interface ActionResult { error: string | null; id?: string }
```

---

## Reglas de negocio

- `es_anonimo = false` en todos los clientes creados desde el CRM — distingue de clientes de pedidos web
- Un cliente NO puede eliminarse si tiene ventas asociadas (cualquier status) — debe mantenerse para integridad de historial
- Solo clientes `es_anonimo = false` son editables/eliminables — clientes web son inmutables desde este panel
- `tipo_documento` default `'DNI'` si no se especifica
- El CRM solo muestra clientes `es_anonimo = false` en la lista
- `nombre` es el único campo requerido — telefono, documento, email son opcionales
- La búsqueda es case-insensitive client-side (no usa ilike de Supabase)

---

## Acceptance Criteria

- [x] `crearCliente` inserta con `es_anonimo: false`
- [x] `actualizarCliente` solo modifica clientes `es_anonimo = false`
- [x] `eliminarCliente` rechaza si el cliente tiene ventas asociadas
- [x] `eliminarCliente` rechaza si `es_anonimo = true`
- [x] `fetchClienteSales` retorna solo ventas `status='completada'` del cliente
- [x] `ClientesClient` filtra solo clientes `es_anonimo = false` (filtrado en page server)
- [x] Búsqueda en `ClientesClient` cubre nombre, documento y teléfono
- [x] `ClienteHistorialModal` muestra total gastado y count de ventas en header
- [x] `revalidatePath('/clientes')` en todas las mutaciones
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente
