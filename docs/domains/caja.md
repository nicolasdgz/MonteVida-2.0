# Spec: Caja

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Cierre de caja diario: staff y admin reconcilian el efectivo esperado (calculado desde ventas) contra el efectivo real contado. Admin ve todos los cierres; staff solo ve los propios.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/caja` | Server Component | staff+ | Formulario de cierre + historial |

---

## Server Actions

### `calcularEfectivoEsperado(fecha: string): Promise<{ error: string | null; data: CierreData | null }>`

**Archivo:** `src/app/(admin)/caja/actions.ts`

**Input:** `fecha` — string ISO date `YYYY-MM-DD`

**Output:**
```typescript
// src/types/caja.ts
interface CierreData {
  fecha: string
  efectivoEsperado: number
  cantidadVentas: number
}
```

**Lógica:**
- Suma `sales.total` donde `status='completada'`, `metodo_pago='efectivo'`, `fecha_venta=fecha`
- Non-admin: solo sus propias ventas (`staff_id = user.id`)
- Admin: todas las ventas del día

**Side-effects:** ninguno (solo lectura)

**Permisos:** `verifySession()` — role-aware

---

### `registrarCierre(fecha, efectivoEsperado, efectivoReal, notas): Promise<{ error: string | null }>`

**Input:**
```typescript
fecha: string           // YYYY-MM-DD
efectivoEsperado: number
efectivoReal: number
notas: string           // puede ser vacío
```

**Lógica:** `diferencia = round((efectivoReal - efectivoEsperado) * 100) / 100`

**Side-effects:**
- Inserta en `cierres_caja` con `staff_id = user.id`
- No hay `revalidatePath` — la página refresca los cierres via refetch del cliente

**Permisos:** `verifySession()` — cualquier staff autenticado

---

### `fetchCierresCaja(): Promise<{ error: string | null; data: CierreRegistrado[] }>`

**Output:**
```typescript
// src/types/caja.ts
interface CierreRegistrado {
  id: string
  fecha: string
  efectivo_esperado: number
  efectivo_real: number
  diferencia: number
  notas: string | null
  profiles: { full_name: string }
  created_at: string
}
```

**Lógica:**
- Último 30 cierres, orden fecha DESC + created_at DESC
- Non-admin: solo sus propios cierres
- Admin: todos los cierres

**Side-effects:** ninguno (solo lectura)

**Permisos:** `verifySession()` — role-aware

---

## Componentes

### `CajaClient`

**Tipo:** Client Component
**Archivo:** `src/components/caja/CajaClient.tsx`

**Props:**
```typescript
interface CajaClientProps {
  initialData: CierreData | null
  initialCierres: CierreRegistrado[]
}
```

**Responsabilidades:**
- Date picker para seleccionar fecha de cierre
- Muestra efectivo esperado + cantidad de ventas del día (llamando `calcularEfectivoEsperado`)
- Input de efectivo real con diferencia calculada en tiempo real
- Código de color: verde si sobrante, rojo si faltante, neutro si cuadra
- Textarea de notas
- Botón "Registrar cierre" — llama `registrarCierre`
- Sección colapsable con historial de los últimos 30 cierres

**No debe:** calcular la diferencia server-side; el display es puramente client-side

---

## Tipos requeridos

```typescript
// src/types/caja.ts — ya creados
export interface CierreData { ... }
export interface CierreRegistrado { ... }

// src/types/database.ts
type PaymentMethod  // 'efectivo' para filtrar ventas de caja
```

---

## Reglas de negocio

- Solo se suman ventas `metodo_pago='efectivo'` y `status='completada'` para el efectivo esperado
- Non-admin solo ve y registra sus propios cierres — no puede ver los de otros staff
- No hay validación de cierre duplicado por fecha — se permiten múltiples cierres el mismo día
- La diferencia siempre es `real - esperado`: positivo = sobrante, negativo = faltante
- El campo `diferencia` se redondea a 2 decimales

---

## Acceptance Criteria

- [x] `calcularEfectivoEsperado` filtra solo `metodo_pago='efectivo'` y `status='completada'`
- [x] Non-admin solo ve sus propias ventas efectivo
- [x] `registrarCierre` inserta en `cierres_caja` con `staff_id` del user autenticado
- [x] `diferencia` calculada como `real - esperado`, redondeada 2 decimales
- [x] `fetchCierresCaja` retorna máximo 30 registros ordenados por fecha DESC
- [x] Non-admin solo ve sus propios cierres en el historial
- [x] Admin ve todos los cierres
- [x] Diferencia muestra color verde (sobrante) / rojo (faltante) en la UI
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente
