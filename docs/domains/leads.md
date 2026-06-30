# Spec: Leads (Pedidos Web)

> Estado: ESPECIFICADO — pendiente de implementación (Fase 8A/8B del scope)
> Última actualización: 2026-06-02

## Propósito

Gestión de leads entrantes del storefront público. Un lead es cualquier `sale` con `origen='web'` — no hay tabla nueva. El módulo agrega estado de seguimiento (`estado_lead`) y notas sobre `sales` existentes, más una notificación automática al admin vía Resend cuando llega un pedido nuevo. Permite al equipo convertir pedidos WhatsApp en ventas confirmadas con trazabilidad del proceso.

---

## Cambios de base de datos requeridos

### Nuevo enum

```sql
CREATE TYPE estado_lead AS ENUM ('nuevo', 'contactado', 'convertido', 'perdido');
```

### Columnas en tabla `sales`

```sql
ALTER TABLE sales
  ADD COLUMN estado_lead estado_lead NOT NULL DEFAULT 'nuevo',
  ADD COLUMN notas_lead  text;
```

> `estado_lead` aplica solo cuando `origen='web'`. Las ventas POS ignoran este campo.
> `notas_lead` es independiente de `notas`, que almacena la dirección del guest (`📍 address, city`).

### Columna en tabla `configuracion`

```sql
ALTER TABLE configuracion
  ADD COLUMN email_notificaciones text;
```

> Email al que se envían alertas de nuevos leads. Puede ser null — en ese caso no se envía notificación.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/leads` | Server Component | staff+ | Lista de leads con filtros y gestión de estado |

---

## Server Actions

### `actualizarEstadoLead(saleId: string, estado: EstadoLead): Promise<{ error: string | null }>`

**Archivo:** `src/app/(admin)/leads/actions.ts`

**Validaciones:**
- `estado` debe ser uno de `nuevo | contactado | convertido | perdido`
- El sale debe existir y tener `origen='web'`

**Side-effects:**
- Actualiza `sales.estado_lead`
- `revalidatePath('/leads')`

**Permisos:** `verifySession()` — cualquier staff autenticado

---

### `agregarNotaLead(saleId: string, texto: string): Promise<{ error: string | null }>`

**Validaciones:**
- `texto` no puede estar vacío ni superar 1000 caracteres (trim())
- El sale debe existir y tener `origen='web'`

**Proceso:**
1. Fetch `sales.notas_lead` actual
2. Construir nueva entrada: `[YYYY-MM-DD HH:mm] autor_nombre:\n{texto}`
3. Concatenar al texto existente separado por `\n---\n`
4. Actualizar `sales.notas_lead`

**Side-effects:**
- Actualiza `sales.notas_lead` (append, nunca reemplaza)
- `revalidatePath('/leads')`

**Permisos:** `verifySession()` — cualquier staff autenticado

---

### `notificarNuevoLead(saleId: string, numeroVenta: number, clienteNombre: string, clienteTelefono: string, total: number): Promise<void>`

**Archivo:** `src/app/(admin)/leads/actions.ts`

**Cuándo se llama:** Desde `crearPedido` en `src/app/(site)/(pages)/checkout/actions.ts`, inmediatamente después de insertar el sale exitosamente. La llamada es **no bloqueante** — el checkout continúa aunque el email falle.

**Proceso:**
1. Leer `configuracion.email_notificaciones` via `createAdminClient()`
2. Si es null o vacío: retornar sin enviar (no es error)
3. Llamar `resend.emails.send()` con template de nuevo lead
4. En catch: loguear el error en consola pero no lanzar excepción

**Template de email:**
```
Asunto: 🌱 Nuevo pedido web #{ numeroVenta } — Monte Vida

Nuevo pedido recibido en la tienda online.

Cliente: { clienteNombre }
Teléfono: { clienteTelefono }
Total: S/. { total }

Ver pedido en el panel: https://www.montevida.pe/leads
```

**Side-effects:**
- Envío de email via Resend (no bloqueante)
- Sin `revalidatePath`

**Permisos:** Sin auth — se llama desde contexto de servidor (server action de checkout)

---

## Componentes

### `LeadsClient`

**Tipo:** Client Component
**Archivo:** `src/components/leads/LeadsClient.tsx`

**Props:**
```typescript
interface LeadsClientProps {
  initialLeads: LeadRow[]
  isAdmin: boolean
}
```

**Responsabilidades:**
- Tabla de leads con columnas: fecha, número de pedido, cliente (nombre + teléfono), productos (count), total, `estado_lead` como badge editable, acciones
- Filtro por `estado_lead` (Todos / Nuevo / Contactado / Convertido / Perdido)
- Filtro de búsqueda por nombre o teléfono del cliente (in-memory)
- Al clic de fila: abre `LeadDetalleModal`
- Cambio de `estado_lead` directamente en la fila via select inline — llama `actualizarEstadoLead` con optimistic update
- Badge de color por estado: Nuevo (azul), Contactado (ámbar), Convertido (verde), Perdido (gris)

**No debe:** hacer queries a Supabase, calcular totales

---

### `LeadDetalleModal`

**Tipo:** Client Component
**Archivo:** `src/components/leads/LeadDetalleModal.tsx`

**Props:**
```typescript
interface LeadDetalleModalProps {
  lead: LeadRow | null
  isAdmin: boolean
  onClose: () => void
  onUpdated: () => void
}
```

**Responsabilidades:**
- Sección **Datos del cliente**: nombre, teléfono, dirección (parseada de `sales.notas`)
- Sección **Productos**: lista de `sale_items` con nombre, cantidad, precio unitario, subtotal
- Sección **Resumen**: total, fecha de pedido, número de venta
- Sección **Estado del lead**: select para cambiar `estado_lead` — llama `actualizarEstadoLead`
- Sección **Notas de seguimiento**: historial de `notas_lead` en formato log, input textarea + botón "Agregar nota" — llama `agregarNotaLead`
- Si `isAdmin`: muestra botón "Ver en historial" que navega a `/ventas/historial` con el pedido preseleccionado

---

### `LeadsBadge` (para el Sidebar)

**Tipo:** Server Component (se renderiza en el layout del admin)
**Archivo:** `src/components/leads/LeadsBadge.tsx`

**Props:** ninguna — consulta directamente a Supabase

**Responsabilidades:**
- Query: `count de sales WHERE origen='web' AND estado_lead='nuevo'`
- Renderiza `<span>` con el número si `count > 0`, vacío si `count = 0`
- Usado en `src/components/layout/Sidebar.tsx` junto al ítem "Leads"

**Integración en Sidebar:**
- `Sidebar.tsx` acepta nuevo prop `leadsNuevosCount: number`
- El admin layout (o `DashboardShell`) instancia `LeadsBadge` y pasa el count al Sidebar
- Badge visual: círculo rojo pequeño con número, posición absoluta sobre el ícono del menú

---

## Tipos requeridos

```typescript
// src/types/database.ts — agregar tras migración

type EstadoLead = 'nuevo' | 'contactado' | 'convertido' | 'perdido'

// Extender Sale existente:
// sales.estado_lead: EstadoLead
// sales.notas_lead: string | null

// Extender Configuracion existente:
// configuracion.email_notificaciones: string | null

// Tipo compuesto para la página de leads
interface LeadRow {
  id: string
  numero_venta: number
  fecha_venta: string
  total: number
  estado_lead: EstadoLead
  notas: string | null       // dirección del guest
  notas_lead: string | null  // notas de seguimiento
  clientes: {
    nombre: string
    telefono: string | null
  } | null
  sale_items: {
    cantidad: number
    precio_unitario: number
    products: { nombre: string } | null
  }[]
}
```

---

## Modificaciones a archivos existentes

| Archivo | Cambio |
|---|---|
| `src/app/(site)/(pages)/checkout/actions.ts` | Llamar `notificarNuevoLead(...)` después de insertar el sale, sin await (fire-and-forget) |
| `src/types/database.ts` | Agregar `EstadoLead`, extender `Sale` con `estado_lead` y `notas_lead`, extender `Configuracion` con `email_notificaciones` |
| `src/components/layout/Sidebar.tsx` | Aceptar `leadsNuevosCount?: number`, renderizar badge si `> 0` |
| `src/components/layout/DashboardShell.tsx` | Consultar count de leads nuevos, pasar a Sidebar |
| `src/app/(admin)/configuracion/actions.ts` | Agregar manejo de `email_notificaciones` en `actualizarConfiguracion` |
| `src/components/configuracion/ConfiguracionClient.tsx` | Agregar input `email_notificaciones` en sección de ajustes |

---

## Reglas de negocio

- `estado_lead` es un campo de la tabla `sales`, no de una tabla separada — no hay modelo "Lead"
- Solo `sales` con `origen='web'` aparecen en `/leads` — las ventas POS no son leads
- `notas_lead` es append-only desde la UI — el server action concatena, nunca reemplaza
- `notas` (dirección del guest) y `notas_lead` (seguimiento) son campos distintos — no mezclar
- La notificación de email es **no bloqueante**: si falla, el checkout no falla
- Si `configuracion.email_notificaciones` es null o vacío: no se intenta enviar email
- El estado `convertido` se asigna manualmente por staff — no se asigna automáticamente al confirmar el pedido desde historial
- El estado `perdido` no cancela ni anula el pedido en `sales` — son estados independientes
- Staff puede cambiar `estado_lead` pero no `sales.status` — eso sigue siendo responsabilidad de `/ventas/historial`
- El badge del Sidebar muestra solo leads en estado `nuevo` — contactado/convertido/perdido no generan alerta

---

## Variables de entorno requeridas

```bash
RESEND_API_KEY=re_xxxx          # Ya requerida por /api/contact y /api/newsletter
RESEND_FROM_EMAIL=soporte@montevida.pe   # Remitente verificado en Resend
```

---

## Acceptance Criteria

- [ ] Migración aplica enum `estado_lead`, columna `sales.estado_lead DEFAULT 'nuevo'`, `sales.notas_lead`, `configuracion.email_notificaciones`
- [ ] `/leads` solo accesible a staff+ — middleware redirige customers
- [ ] `LeadsClient` muestra solo sales con `origen='web'`
- [ ] Filtro por `estado_lead` funciona in-memory sin refetch
- [ ] Cambio de estado inline en tabla actualiza `sales.estado_lead` y refleja en UI con optimistic update
- [ ] `LeadDetalleModal` parsea `sales.notas` para mostrar dirección del guest
- [ ] `agregarNotaLead` concatena nota con timestamp — el campo anterior no se pierde
- [ ] `notificarNuevoLead` se llama desde `crearPedido` sin await — checkout no bloquea si email falla
- [ ] Si `email_notificaciones` es null: `notificarNuevoLead` retorna sin enviar (sin error)
- [ ] Email enviado contiene: número de pedido, nombre cliente, teléfono, total, link al panel
- [ ] `LeadsBadge` muestra count de `estado_lead='nuevo'` — no aparece badge si count = 0
- [ ] Badge del Sidebar se actualiza en cada carga del layout (Server Component, sin cache agresivo)
- [ ] Campo `email_notificaciones` editable desde `/configuracion` — guarda y persiste
- [ ] `actualizarEstadoLead` rechaza valores fuera del enum
- [ ] `agregarNotaLead` rechaza texto vacío y texto > 1000 chars
- [ ] Error retornado como `{ error: string | null }` — nunca throw al cliente
