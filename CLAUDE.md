# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Preferencias de comunicación

- Responde siempre en español.
- Usa terminología técnica en inglés solo cuando no exista equivalente claro en español.

## Entorno de desarrollo

- Sistema operativo: Windows 11
- Shell predeterminado: PowerShell
- IMPORTANTE: Usa PowerShell en todos los comandos desde el inicio, nunca intentes bash o sh primero.

## Comandos

```powershell
pnpm run dev      # servidor de desarrollo
pnpm run build    # build de producción (verifica TypeScript + Next.js)
pnpm run lint     # ESLint
pnpm add <pkg>    # instalar paquete
```

No hay tests configurados. `pnpm run build` es la verificación de corrección más completa.

## Arquitectura

### Route groups

```
src/app/
  (site)/                      # Storefront público — Header/Footer site, Redux cart
    (pages)/                   # Sub-grupo para páginas de contenido
    producto/[slug]/page.tsx   # PDP — fuera de (pages) intencionalmente
  (admin)/                     # Dashboard POS — DashboardShell + Sidebar + AdminHeader
  (auth)/                      # Login y registro — layout mínimo sin nav
  api/                         # Route handlers: contact, newsletter, voucher/[saleId]
```

### Supabase — tres clientes distintos

| Cliente | Archivo | Cuándo usar |
|---|---|---|
| `await createClient()` | `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| `createClient()` (sync) | `src/lib/supabase/client.ts` | Client Components (`'use client'`) |
| `await createAdminClient()` | `src/lib/supabase/server.ts` | Bypasear RLS con service role |

### Auth y protección de rutas

`middleware.ts` (raíz) → `src/lib/supabase/middleware.ts` → `updateSession()`:
- No autenticado en ruta protegida → redirect `/iniciar-sesion`
- Autenticado en ruta auth → redirect por rol: `admin|staff` → `/ventas`, `customer` → `/mi-cuenta`
- Rutas admin-only: `/gastos`, `/reportes`, `/configuracion`, `/mercaderia`

`src/lib/dal.ts` — funciones cacheadas con `React.cache()`:
- `verifySession()` — user autenticado o redirect
- `getProfile()` — profile con rol
- `requireAdmin()` — lanza Error si no es admin; devuelve `{ user, supabase }`
- `getConfiguracion()` — singleton de config del negocio

### Screaming Architecture — estructura de dominios

Código organizado por dominio de negocio, no por capa técnica:

```
src/
  ventas/        components/ + store.ts (saleForm Zustand) + types.ts
  inventario/    components/
  clientes/      components/
  caja/          components/ + types.ts
  gastos/        components/
  reportes/      components/ + types.ts
  dashboard/     components/
  configuracion/ components/
  mercaderia/    components/ + types.ts
  resenas/       data.ts
  tienda/        components/(Cart,Checkout,Home,ShopDetails,ShopWithSidebar,
                              Contact,WhatsApp,Footer,Header,Common/)
                 store/ (Redux: provider, store, features/)
                 types/ (product, category, Menu, testimonial)
                 data.ts + data-client.ts
  components/    ui/, layout/, Error/  ← shared infra
  types/         database.ts  ← auto-generado Supabase, NO editar manualmente
  lib/           supabase/, dal.ts, constants.ts, storage.ts
  hooks/         useAuth.ts
  utils/         igv.ts, fechas.ts
```

### Server Actions

Todas las mutaciones usan `'use server'` actions en `src/app/(admin)/[dominio]/actions.ts` — no API routes. Patrón estándar:

```ts
'use server'
export async function miAction(formData: FormData) {
  const user = await verifySession()   // siempre primero
  const supabase = await createClient()
  // ...
  revalidatePath('/ruta')
}
```

Usar `requireAdmin()` solo cuando la acción exige rol admin explícitamente.

### Data layer

- `src/tienda/data.ts` — queries storefront server-side (getStoreProducts, getStoreProductBySlug, getStoreCategories, getProductReviews)
- `src/tienda/data-client.ts` — queries storefront browser-side (getStoreProductsClient)
- `src/resenas/data.ts` — getAllReviewsAdmin
- `src/tienda/transforms.ts` — `toUIProduct(DBProduct) → UIProduct`. Siempre usar esta función para convertir filas DB a tipo UI; nunca remapear manualmente.

### Estado

| Store | Tecnología | Qué maneja |
|---|---|---|
| cart, quickView, productDetails | Redux Toolkit + redux-persist — `src/tienda/store/` | Carrito storefront (localStorage key `montevida`) |
| auth | Zustand — `src/store/auth.ts` | `Profile` activo, sincronizado por `AuthSync` en root layout |
| saleForm | Zustand (persisted) — `src/ventas/store.ts` | Formulario POS en curso |
| configuracion | Zustand — `src/store/configuracion.ts` | Config del negocio cargada al iniciar dashboard |

### Tipos

`src/types/database.ts` — fuente de verdad cross-domain: enums de DB (`UserRole`, `SaleStatus`, `PaymentMethod`, `SaleOrigen`, `EstadoEnvio`) y tipos de tablas. Auto-generado con `npx supabase gen types typescript --project-id pvurmbrdifngjytkkcwu` — NO fragmentar.

Tipos de dominio específico: `src/ventas/types.ts`, `src/reportes/types.ts`, `src/caja/types.ts`, `src/mercaderia/types.ts`, `src/tienda/types/`.

### Utilidades

| Archivo | Exports clave |
|---|---|
| `src/utils/igv.ts` | `IGV_DEFAULT_PCT = 18`, `redondearMonto()`, `formatearMonto()` (locale `es-PE`, moneda `PEN`) |
| `src/utils/exportCsv.ts` | `downloadCsv(data, filename)` — client-only, agrega BOM UTF-8, append fecha al nombre |
| `src/utils/fechas.ts` | Helpers de formateo de fechas |
| `src/lib/storage.ts` | `uploadFile(bucket, path, file)` — usa `createAdminClient()` internamente; solo llamar desde Server Actions |
| `src/lib/rateLimit.ts` | `rateLimit(ip, limit, windowMs)` — in-memory, para Route Handlers API |
| `src/lib/constants.ts` | `ANONYMOUS_CLIENT_ID`, `ANONYMOUS_CLIENT_NAME`, `WHATSAPP_NUMBER/URL` |

### Contextos del storefront

`src/app/context/` contiene tres Context providers que wrappean `(site)/layout.tsx`:
- `CartSidebarModalContext` — controla visibilidad del carrito lateral
- `QuickViewModalContext` — modal de vista rápida de producto
- `PreviewSliderContext` — slider de imágenes en PDP

### Notas importantes

- `@/*` → `./src/*` (alias TypeScript)
- `createAdminClient()` usa `SUPABASE_SERVICE_ROLE_KEY` — nunca llamar desde cliente
- Supabase project ID: `pvurmbrdifngjytkkcwu` (producción activa con datos reales)
- Admin layout (`src/app/(admin)/layout.tsx`) calcula `stockAlertCount` a nivel de layout, no por página
- `cdn.sanity.io` en `next.config.ts` es residuo de migración — no agregar imágenes de Sanity
- `@portabletext/react` en package.json no se usa — no importar

@AGENTS.md
