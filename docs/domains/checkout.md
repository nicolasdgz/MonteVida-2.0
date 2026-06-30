# Spec: Checkout

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Flujo de compra web para clientes del storefront. Acepta pedidos de clientes anónimos (sin cuenta) y autenticados. Genera un pedido en la base de datos y envía confirmación via WhatsApp. MVP actual: solo WhatsApp — sin pasarela de pago integrada.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/checkout` | Server Component (wrapper) | Público (anónimo permitido) | Formulario de checkout + resumen de carrito |
| `/correo-enviado` | Server Component | Público | Confirmación post-checkout con número de pedido |

---

## Server Actions

### `crearPedido(input: CheckoutInput): Promise<CheckoutResult>`

**Archivo:** `src/app/(site)/(pages)/checkout/actions.ts`

**Input:**
```typescript
export interface CartItemInput {
  id: string | number
  title: string
  quantity: number
  price: number             // precio de venta al momento del checkout
  discountedPrice: number   // precio final cobrado
}

export interface CheckoutInput {
  items: CartItemInput[]
  firstName: string
  lastName: string
  address: string
  city: string
  phone: string
  email?: string
  notes?: string
}
```

**Output:**
```typescript
export interface CheckoutResult {
  error: string | null
  saleId: string | null
  numeroVenta?: number
  // whatsappUrl se genera en el componente con datos del carrito Redux
  // la action no la retorna porque no tiene acceso al estado cliente
}
```

**Proceso paso a paso:**
1. Validar que `items` no esté vacío
2. Buscar o crear cliente anónimo en `clientes` (match por teléfono, o crear nuevo con `es_anonimo=true`)
3. Insertar fila en `sales` con: `origen='web'`, `status='pendiente'`, `metodo_pago='whatsapp'`, `staff_id=null`
4. Leer `precio_costo` de cada producto desde `products` para insertar en `sale_items`
5. Insertar filas en `sale_items` — trigger DB descuenta stock
6. Generar URL de WhatsApp con resumen del pedido
7. Retornar `{ error: null, saleId, numeroVenta, whatsappUrl }`

**Side-effects:**
- Inserta en `clientes` (si no existe por teléfono)
- Inserta en `sales` (`origen='web'`, `status='pendiente'`)
- Inserta en `sale_items` — stock se descuenta via trigger
- Sin `revalidatePath` — el storefront no tiene ISR por ventas

**Permisos:** Sin auth requerida — `createClient()` con acceso anónimo (RLS permite INSERT en `clientes` y `sales` para web)

**Nota:** Stock se reserva al crear el pedido. Si el admin anula el pedido, el trigger restaura el stock.

---

## Componentes

### `Checkout` (componente principal)

**Tipo:** Client Component
**Archivo:** `src/components/Checkout/index.tsx`

**Props:** ninguna (lee carrito de Redux store `selectCartItems`)

**Estado interno:**
```typescript
// Campos del formulario
firstName: string
lastName: string
address: string
city: string
phone: string
email: string
notes: string

// UI state
isSubmitting: boolean
orderResult: { saleId: string; numeroVenta: number; whatsappUrl: string } | null
```

**Responsabilidades:**
- Renderiza formulario de datos del comprador
- Muestra resumen de items del carrito con controles de cantidad
- Calcula y muestra subtotal + total
- Al confirmar: llama `crearPedido`, muestra toast de error si falla
- En éxito: muestra pantalla de confirmación con número de pedido y botón WhatsApp
- Limpia el carrito Redux tras pedido exitoso (`removeAllItemsFromCart`)

**Validaciones client-side:**
- `firstName`, `lastName`, `address`, `city`, `phone` son requeridos
- Al menos 1 item en carrito
- Mostrar mensajes de error inline

**No debe:**
- Procesar pagos directamente
- Acceder a Supabase directamente — delegar todo a `crearPedido`

---

### Componentes existentes sin integración activa

Los siguientes archivos existen pero no están integrados en el flujo actual:

| Archivo | Estado | Uso futuro |
|---|---|---|
| `Checkout/Billing.tsx` | Existe, no usado | Formulario de facturación para pedidos con comprobante |
| `Checkout/PaymentMethod.tsx` | Existe, solo muestra BCP/BN | Base para agregar métodos de pago reales |
| `Checkout/OrderList.tsx` | Archivo vacío | Placeholder |
| `Checkout/Notes.tsx` | Archivo vacío | Placeholder |
| `Checkout/Coupon.tsx` | Existe | Cupones de descuento (no implementados) |
| `Checkout/Login.tsx` | Existe | Login inline en checkout (no integrado) |
| `Checkout/Shipping.tsx` | Existe | Métodos de envío (no implementados) |
| `Checkout/ShippingMethod.tsx` | Existe | Selector de método de envío (no implementado) |

---

## Tipos requeridos

```typescript
// src/app/(site)/(pages)/checkout/actions.ts
export interface CartItemInput {
  id: string | number
  title: string
  quantity: number
  price: number
  discountedPrice: number
}

export interface CheckoutInput {
  items: CartItemInput[]
  firstName: string
  lastName: string
  address: string
  city: string
  phone: string
  email?: string
  notes?: string
}

export interface CheckoutResult {
  error: string | null
  saleId: string | null
  numeroVenta?: number
  whatsappUrl?: string
}

// src/types/database.ts — ya existen
type SaleOrigen = 'pos' | 'web'
type PaymentMethod  // 'whatsapp' para pedidos web
type Cliente        // row de clientes
```

---

## Integración con Redux (carrito)

El checkout lee el carrito de Redux:

```typescript
import { useAppSelector } from '@/redux/store'
import { selectCartItems, selectTotalPrice } from '@/redux/features/cart-slice'
import { removeAllItemsFromCart } from '@/redux/features/cart-slice'

const items = useAppSelector(selectCartItems)
const total = useAppSelector(selectTotalPrice)
```

Tras pedido exitoso: `dispatch(removeAllItemsFromCart())`

---

## Variables de entorno requeridas

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=51XXXXXXXXX   # Número WhatsApp del negocio (sin +)
```

---

## Reglas de negocio

- El pedido se crea con `status='pendiente'` — el admin lo confirma manualmente desde `/ventas/historial`
- El stock SE descuenta al crear el pedido (reserva) — si el admin anula, el trigger restaura el stock
- El cliente se identifica por teléfono — si ya existe, se reutiliza la fila
- Los pedidos web tienen `staff_id=null` — en historial aparecen como "web" en columna staff
- El método de pago siempre es 'whatsapp' para pedidos del storefront
- La dirección del guest se guarda en `sales.notas` con formato `📍 address, city`
- `precio_costo` se lee desde la DB al momento del checkout (no del cliente)
- Si `NEXT_PUBLIC_WHATSAPP_NUMBER` no está configurado, el botón WhatsApp no aparece

---

## Acceptance Criteria

- [x] `crearPedido` crea cliente en `clientes` con `es_anonimo=true`
- [x] Inserta en `sales` con `origen='web'`, `status='pendiente'`, `metodo_pago='whatsapp'`
- [x] Inserta en `sale_items` con `precio_costo` real desde DB
- [x] Stock se descuenta via trigger DB
- [x] Retorna `whatsappUrl` con resumen del pedido
- [x] Componente `Checkout` limpia carrito Redux tras pedido exitoso
- [x] Pantalla de confirmación muestra número de pedido
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente
- [x] Validación client-side bloquea submit si campos requeridos vacíos
- [x] Carrito vacío muestra estado vacío y no permite submit

---

## Trabajo futuro (fuera del MVP actual)

- Integración con pasarela de pago (Culqi, Mercado Pago)
- Login opcional durante checkout para asociar pedido a cuenta customer
- Cupones de descuento (`Coupon.tsx` existe como placeholder)
- Métodos de envío y tracking (`Shipping.tsx` existe como placeholder)
- Confirmación por email via Resend
