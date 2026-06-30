# Monte Vida — Scope de Migración y Fusión

> Documento vivo. Actualizar a medida que avanza el proyecto.
> Fecha de inicio: 2026-05-26

---

## Contexto

Se fusionan dos proyectos existentes en uno nuevo ubicado en `E:\ProyectosIA\Merge\montevida`:

| Proyecto | Ruta | Rol |
|---|---|---|
| `montevida-ecommerce` | `E:\ProyectosIA\Merge\montevida-ecommerce` | Storefront público (Next.js 16, Tailwind v3) |
| `punto-click` | `E:\ProyectosIA\Merge\punto-click` | Sistema POS/admin (Next.js 16, Tailwind v4, Supabase) |

**Objetivo:** Una sola aplicación Next.js que sirva como tienda online pública (clientes) y panel de administración/POS interno (admin/staff), compartiendo la misma base de datos Supabase.

---

## Auditoría de proyectos existentes

### montevida-ecommerce — Estado: ~60% completo

**Lo que funciona:**
- UI pública completa: Home, Shop, PDP, Cart, Contact, Newsletter
- Redux cart con persistencia (`key: montevida`)
- SEO: metadata, JSON-LD (Product + Organization), sitemap dinámico, robots.txt
- Tailwind theming: tokens `primary` (verde #428743), `accent` (ámbar #D4A24A), `green-brand` (#a6e851)
- API routes Resend: `/api/contact` (rate-limit 5/min/IP) y `/api/newsletter`
- Framer Motion page transitions, Swiper carousels
- Componentes: Header, Footer, Hero, ProductItem, QuickViewModal, CartSidebar, WhatsAppButton

**Lo que falta / está roto:**
- ❌ Sin auth — páginas `/iniciar-sesion` y `/registro` referenciadas pero no existen
- ❌ `/correo-enviado` no existe — Contact form redirige a 404
- ❌ `/favoritos`, `/my-account`, `/blogs` referenciados pero sin implementar
- ❌ Checkout solo por WhatsApp — sin pasarela de pago
- ❌ Datos de productos estáticos (`src/data/products.ts`, 10k líneas) — sin DB real
- ❌ Sanity CMS removido pero `@portabletext/react` aún en deps
- ❌ 4 errores ESLint: hook condicional en Countdown, deps faltantes en Header
- ❌ Countdown hardcoded a `"December, 31, 2024"` (ya expiró)
- ❌ `cdn.sanity.io` en `next.config.js` (URLs de imágenes hardcodeadas en data)

**Dependencias clave:**
```
next@^16.1.6, react@^19.2.4, tailwindcss@3.3.3
@reduxjs/toolkit@^2.6.1, redux-persist@^6.0.0
framer-motion@^12.36.0, swiper@^12.1.3
resend@^6.9.3, react-hot-toast@^2.4.1
@portabletext/react@^6.0.3 (UNUSED — eliminar)
```

---

### punto-click — Estado: ~75% completo

**Lo que funciona:**
- Auth completa: Supabase SSR, email/password, JWT en cookies, roles admin/staff
- POS completo: búsqueda productos/clientes, carrito, descuentos, IGV toggle, métodos de pago, upload voucher
- Gestión inventario: CRUD productos, ajuste stock, alertas stock mínimo, historial ventas por producto
- Reportes admin: KPIs por rango de fechas, ventas por método de pago, top productos, margen
- Gestión clientes: CRUD, historial compras por cliente
- Cierre de caja: reconciliación diaria efectivo esperado vs real
- Gastos: tracking por 9 categorías (admin-only)
- Mercadería: registro de compras a proveedores (admin-only)
- DB function `resumen_financiero(date_from, date_to)` para aggregación
- Zustand stores: auth, saleForm (persisted), configuracion

**Lo que falta / está roto:**
- ❌ `middleware.ts` raíz no exporta `updateSession` — bug crítico, auth redirection puede fallar
- ❌ `/register` route vacía — alta de usuarios solo via panel de configuración
- ❌ `resend` y `swiper` en package.json pero no usados
- ❌ Sin paginación en búsquedas (puede cargar cientos de filas client-side)
- ❌ Race condition en stock: validación client-side sin constraint DB para ventas concurrentes

**Dependencias clave:**
```
next@16.2.4, react@19.2.4, tailwindcss@^4
@supabase/ssr@^0.10.2, @supabase/supabase-js@^2.104.0
zustand@^5.0.12, recharts@^3.8.1
framer-motion@^12.38.0, lucide-react@^1.8.0
```

**Supabase proyecto:** `pvurmbrdifngjytkkcwu` (nombre: "Punto Click")
- URL: `https://pvurmbrdifngjytkkcwu.supabase.co`
- Region: `us-east-1`, PostgreSQL 17, status: ACTIVE_HEALTHY

---

## Schema de base de datos (punto-click actual)

```
auth.users              ← Supabase Auth nativo

public.profiles         → id(→auth.users), full_name, role(admin|staff), avatar_url
public.configuracion    → nombre_negocio, logo_url, moneda, igv_porcentaje  [singleton]
public.categories       → id, nombre, descripcion
public.products         → id, codigo, nombre, category_fk, precio_costo, precio_venta,
                          stock, stock_minimo, unidad, imagen_url, activo
public.clientes         → id, nombre, telefono, tipo_doc, numero_doc, email, es_anonimo
public.sales            → id, numero_venta(seq), staff_fk, cliente_fk, status,
                          metodo_pago, subtotal, igv_monto, total, fecha_venta, descuento
public.sale_items       → sale_fk, product_fk, cantidad, precio_unitario, precio_costo
public.expenses         → admin_fk, categoria, descripcion, monto, fecha
public.compras          → admin_fk, proveedor, fecha, total
public.compra_items     → compra_fk, product_fk, cantidad, precio_costo
public.compra_gastos    → compra_fk, concepto, monto
public.cierres_caja     → staff_fk, fecha, efectivo_esperado, efectivo_real, diferencia
```

---

## Arquitectura del proyecto fusionado

### Stack decidido

| Tecnología | Versión | Decisión |
|---|---|---|
| Next.js | 16 App Router | Ambos proyectos ya en v16 |
| React | 19 | Ambos proyectos ya en v19 |
| Tailwind | **v4** | Futuro del framework; migrar tokens de v3 a CSS variables |
| Supabase | SSR (@supabase/ssr) | De punto-click — patrón probado |
| Estado cart | Redux Toolkit + redux-persist | De montevida — funciona bien |
| Estado admin | Zustand | De punto-click |
| Email | Resend | De montevida (API routes ya probadas) |
| Charts | Recharts | De punto-click |
| Animaciones | Framer Motion | Ambos proyectos |
| Icons | Lucide React | De punto-click (reemplaza SVGs manuales) |

### Estructura de rutas

```
src/app/
  (site)/                     ← Storefront público
    page.tsx                  ← Home
    tienda/page.tsx           ← Shop con filtros
    producto/[slug]/page.tsx  ← PDP + JSON-LD
    cart/page.tsx             ← Carrito (Redux)
    checkout/page.tsx         ← Checkout → inserta en sales + sale_items
    mi-cuenta/page.tsx        ← Perfil cliente (protegida: role=customer|admin)
    iniciar-sesion/page.tsx   ← Login
    registro/page.tsx         ← Registro público (crea customer)
    correo-enviado/page.tsx   ← Confirmación contacto
    contact/page.tsx
    politica-de-envios/page.tsx
    politica-de-garantia/page.tsx
    politica-de-privacidad/page.tsx
    terminos-y-condiciones/page.tsx

  (admin)/                    ← Dashboard interno (protegida: role=admin|staff)
    ventas/page.tsx           ← POS
    ventas/historial/page.tsx
    inventario/page.tsx
    inventario/[productId]/page.tsx
    clientes/page.tsx
    reportes/page.tsx         ← solo admin
    gastos/page.tsx           ← solo admin
    caja/page.tsx             ← solo admin
    mercaderia/page.tsx       ← solo admin
    configuracion/page.tsx    ← solo admin (incluye gestión de usuarios)

  (auth)/
    login/page.tsx
    registro/page.tsx
    auth/callback/route.ts

  api/
    contact/route.ts          ← Resend, rate-limit
    newsletter/route.ts       ← Resend
    voucher/[saleId]/route.ts ← descarga comprobante

  layout.tsx                  ← Root <html lang="es">
  sitemap.ts                  ← Dinámico (productos de Supabase)
  robots.ts
```

### Roles de usuario

```sql
-- Actualizar enum en Supabase
ALTER TYPE user_role ADD VALUE 'customer';

-- Resultado: admin | staff | customer
```

| Rol | Acceso |
|---|---|
| `customer` | `/mi-cuenta`, `/checkout` autenticado |
| `staff` | todo lo anterior + `/admin/ventas`, `/admin/inventario`, `/admin/clientes`, `/admin/caja` |
| `admin` | todo — incluyendo `/admin/reportes`, `/admin/gastos`, `/admin/configuracion`, `/admin/mercaderia` |

### Middleware (raíz)

```
middleware.ts (raíz del proyecto)
  ↓
src/lib/supabase/middleware.ts → updateSession()

Rutas protegidas:
  /mi-cuenta     → customer | staff | admin
  /checkout      → customer | staff | admin (opcional: guest checkout)
  /admin/*       → staff | admin
  /admin/reportes, /admin/gastos, /admin/configuracion, /admin/mercaderia → admin only
```

---

## Plan de migración por fases

### Fase 1 — Setup base *(estimado: 1 día)*

- [x] `npx create-next-app@latest montevida` en `E:\ProyectosIA\Merge\` → Next.js 16.2.6
- [x] Configurar Tailwind v4
- [x] Migrar tokens de color a CSS variables (`globals.css` con `@theme`)
- [x] Copiar `src/lib/supabase/` de punto-click (client.ts, server.ts, middleware.ts)
- [x] Crear `middleware.ts` raíz (fix bug de punto-click — ahora exportado correctamente)
- [x] Crear `src/types/database.ts` con roles `admin | staff | customer` + campos web
- [x] Crear `.env.local` con variables unificadas
- [x] Configurar `next.config.ts`: image domains (Supabase Storage + CDN), security headers
- [x] `npm run build` → ✅ limpio sin errores

### Fase 2 — DB schema *(estimado: ½ día)*

- [x] Agregar `'customer'` al enum `user_role` → ahora `admin | staff | customer`
- [x] Agregar `origen` a `sales` (enum `sale_origen`: `pos | web`, default `pos`)
- [x] Agregar `estado_envio` a `sales` (enum `estado_envio_type`: `pendiente | preparando | enviado | entregado`)
- [x] Extender `profiles` con `telefono` y `direccion_envio`
- [x] Extender `products` con `slug`, `precio_oferta`, `imagenes[]`, `visible_web`
- [x] Unique index en `products.slug` (parcial, solo no nulos)
- [x] Slugs generados para los 26 productos existentes
- [x] RLS policies: `customers_own_sales`, `products_public_read`, `customers_own_profile`
- [x] `src/types/database.ts` ya incluye todo (creado en Fase 1 con schema adelantado)

### Fase 3 — Auth *(estimado: 1 día)*

- [x] `/iniciar-sesion` — UI dark verde Monte Vida, redirect por rol (admin/staff → /admin/ventas, customer → /mi-cuenta)
- [x] `/registro` — formulario público, crea user + profile(role=customer) via adminClient
- [x] `/auth/callback/route.ts` — intercambio de código OAuth/email
- [x] `src/store/auth.ts` — Zustand store (profile + isLoading)
- [x] `src/hooks/useAuth.ts` — isAdmin, isStaff, isCustomer, isAdminOrStaff
- [x] `src/components/layout/AuthSync.tsx` — sincroniza sesión Supabase con store
- [x] `src/components/layout/Providers.tsx` — wraps AuthSync + Toaster (colores Monte Vida)
- [x] `src/app/layout.tsx` — integra Providers en root layout
- [x] Middleware ya configurado en Fase 1 con rutas del nuevo esquema
- [ ] UI "Promover a admin" en `/admin/configuracion` (Fase 5)

### Fase 4 — Storefront público *(estimado: 2 días)*

- [x] Copiar todos los componentes de montevida-ecommerce (`src/components/`)
- [x] Tailwind v4: globals.css con @theme completo (colores, spacing, z-index, breakpoints, fuentes)
- [x] Copiar Redux store + slices (cart, quickView, productDetails)
- [x] `src/lib/data.ts` — queries reales a Supabase (server-side)
- [x] `src/lib/data-client.ts` — queries browser-side para client components
- [x] `/mi-cuenta` — página de cuenta del customer autenticado
- [x] `/correo-enviado` — confirmación de contacto
- [x] API routes Resend: `/api/contact`, `/api/newsletter`
- [x] Sitemap dinámico desde Supabase `products`
- [x] Build limpio — 22 rutas generadas ✓
- [ ] Fix ESLint: hook condicional en `Countdown`, deps en `CustomSelect`, `<a>` → `<Link>` en Footer
- [ ] RESEND_API_KEY real en producción (placeholder en dev)

### Fase 5 — Admin dashboard *(estimado: 1 día)*

- [x] Copiar módulos de punto-click bajo `src/app/(admin)/`:
  - `ventas/` (POS completo) → URL `/ventas`
  - `ventas/historial/` → URL `/ventas/historial`
  - `inventario/` + `inventario/[productId]/` → URL `/inventario`
  - `clientes/` → URL `/clientes`
  - `reportes/` → URL `/reportes`
  - `gastos/` → URL `/gastos`
  - `caja/` → URL `/caja`
  - `mercaderia/` → URL `/mercaderia`
  - `configuracion/` → URL `/configuracion`
  - `dashboard/` → URL `/dashboard`
- [x] Copiar `src/components/` de punto-click (Header → AdminHeader para evitar conflicto)
- [x] Copiar Zustand stores: `saleForm.ts`, `configuracion.ts`
- [x] Copiar `DashboardShell` layout (sidebar + AdminHeader)
- [x] Adaptar referencias `(dashboard)` → `(admin)` en imports; URLs `/ventas`, `/clientes`, etc. (sin prefijo /admin/)
- [x] Copiar `/api/voucher/[saleId]/route.ts`
- [x] Middleware actualizado: protege `/ventas`, `/clientes`, `/inventario`, `/caja`, `/dashboard`; admin-only: `/gastos`, `/reportes`, `/configuracion`, `/mercaderia`
- [x] `ConfiguracionClient.tsx`: añadido role 'customer' al ROLE_STYLE
- [x] `recharts` instalado
- [x] Build limpio: 32 rutas generadas, TypeScript ✅

### Fase 6 — Integración storefront ↔ admin *(estimado: 1–2 días)*

**Decisiones aplicadas:** guest checkout · WhatsApp MVP · Supabase Storage para imágenes

#### 6A — Checkout WhatsApp (guest) ✅ 2026-05-26
- [x] `/checkout` acepta pedidos sin login (guest form: nombre, teléfono, dirección)
- [x] Al confirmar: crea registro en `clientes` con `es_anonimo=true` (nombre+teléfono)
- [x] Inserta `sales` (origen='web', status='pendiente', metodo_pago='whatsapp') + `sale_items`
- [x] Stock SÍ se descuenta vía trigger DB (reserva stock) — admin anula si cliente cancela
- [x] Genera link WhatsApp con resumen del pedido (productos, totales, dirección)
- [x] Página de confirmación post-checkout con número de pedido + links a tienda/inicio
- [x] DB: `staff_id` nullable en `sales` + 'whatsapp' en enum `payment_method`
- [x] `PaymentMethod` TS type actualizado + `METODO_LABEL` en reportes actualizado
- [x] Build limpio: 32 rutas, TypeScript ✅

#### 6B — Imágenes → Supabase Storage ✅ 2026-05-26
- [x] Bucket `product-images` creado (public read, 5 MB max, jpeg/png/webp)
- [x] `next.config.ts` ya tenía `pvurmbrdifngjytkkcwu.supabase.co` whitelisted
- [x] `subirImagenProducto` server action — sube a Storage, actualiza `products.imagen_url`
- [x] `actualizarWebProducto` server action — actualiza `visible_web` y `precio_oferta`
- [x] Panel "Presencia web" en `/inventario/[productId]` — imagen + toggle visible + precio oferta
- [x] Slugs regenerados correctamente (translate SQL fix — todos los 26 productos)
- [x] Admin puede subir imágenes y publicar productos en la tienda desde el panel
- [x] Build limpio: 32 rutas, TypeScript ✅
- [ ] Admin aún debe subir imágenes y poner `visible_web=true` para cada producto (tarea manual)

#### 6C — Admin: visibilidad ventas web ✅ 2026-05-26
- [x] Historial: badge `WEB` (sky/azul) en columna `#` para ventas con origen='web'
- [x] Filtro por origen (Todos / POS / Web) en `/ventas/historial` — solo visible para admin
- [x] Filtro de status incluye 'pendiente' (antes solo completada/anulada)
- [x] Staff column muestra "web" (italic) si staff_id=null (pedido web sin staff)
- [x] Modal VentaDetalle: badge "🌐 Web" + `estado_envio` badge + null-safe profiles
- [x] Modal VentaDetalle: botón "Confirmar pedido" (admin, web, pendiente) → status=completada + estado_envio=preparando
- [x] Modal VentaDetalle: notas muestran dirección del guest (guardada como `📍 address, city`)
- [x] `confirmarPedidoWeb` server action en ventas/actions.ts
- [x] `/mi-cuenta` muestra pedidos web del customer (RLS `customers_own_sales` filtra por email automáticamente)
- [x] Build limpio: 32 rutas, TypeScript ✅

#### 6D — Stock storefront ✅ 2026-05-26
- [x] Storefront ya lee `products.stock` real desde Supabase (via `data.ts`)
- [x] `Product` type: añadidos `stock?: number` y `stockMinimo?: number`
- [x] `toUIProduct()` mapea `p.stock` → `stock`, `p.stock_minimo` → `stockMinimo`
- [x] PDP muestra estado stock: "En stock" (verde) / "Últimas X unidades" (ámbar, stock ≤ stock_minimo) / "Sin stock" (rojo, stock = 0)
- [x] Botón "Agregar al carrito" y "Comprar ahora" deshabilitados si stock = 0
- [x] Tab "Información Adicional" → Disponibilidad también usa lógica dinámica de 3 estados
- [x] JSON-LD `availability`: `OutOfStock` cuando stock = 0, `InStock` en resto

### Fase 7 — Calidad, documentación y rediseño UI/UX *(2026-06-01/02)*

#### 7A — Limpieza deuda técnica Sanity ✅
- [x] `CLAUDE.md` documenta `cdn.sanity.io` como residuo — prohibido agregar imágenes Sanity
- [x] `CLAUDE.md` documenta `@portabletext/react` como unused — prohibido importar
- [x] `AGENTS.md` creado: guía para agentes IA con breaking changes de Next.js 16

#### 7B — Specs de dominio ✅
- [x] `docs/conventions.md` — convenciones del proyecto
- [x] `docs/domains/` — 9 archivos de specs: `auth`, `inventario`, `checkout`, `ventas`, `caja`, `gastos`, `reportes`, `clientes`, `configuracion`

#### 7C — Rediseño UI/UX: Neumorphism / Natural Wellness ✅ 2026-06-01/02
- [x] Fuentes Google: Lora (headings) + Raleway (body/nav) — `(site)/layout.tsx` + `site.css`
- [x] Tokens neumórficos en `globals.css` `@theme`: `--color-surface: #E8EFE4`, `--shadow-neu`, `--shadow-neu-sm`, `--shadow-neu-inset`
- [x] `site.css`: `.site-root { background-color: var(--color-surface) }` — admin no afectado
- [x] **Home** — Hero (sección + carrusel), HeroFeature (badges pill), Categories (círculo inset hover), ProductItem (card + imagen inset + botones), BestSeller/SingleItem, Testimonials/SingleItem, Header (bg-surface + sombra sticky)
- [x] **`/tienda`** — ShopWithSidebar (section + filter box + top bar + toggle grid/list + paginación), CategoryDropdown (container + checkbox inset + badge contador), ProductListItem (card + botones)
- [x] **`/producto/[slug]`** — ShopDetails: galería (shadow-neu), zoom button (neu-sm), thumbnails (ring activo), qty selector (neu-inset), CTAs (neu-sm + active inset), sección tabs, tab headers, tab info adicional, cards de reseñas ×3, form reviews (inputs neu-inset)
- [x] **`/contact`** — ambas cards (neu), 5 inputs + textarea (neu-inset + border-0), botón enviar (neu-sm + active inset)
- [x] **Admin dashboard** (Natural Wellness) — DashboardShell, Sidebar, AdminHeader, todas las pages admin: 27 archivos rediseñados (2026-06-02)
- [x] Build limpio en cada iteración: 33 rutas, TypeScript ✅, 0 errores

#### 7D — Carga inicial de productos ✅ 2026-06-02
- [x] 20 productos importados con imagen, descripción, slug, precio_oferta
- [x] `visible_web=true` en los 20 productos — tienda pública activa
- [x] Bucket `product-images` poblado con 20 imágenes (Supabase Storage)

---

### Fase 8 — Features de producto *(propuesta)*

**Prioridad P1 — Bloquea operación del negocio:**

#### 8A — Leads (módulo completo) ✅ 2026-06-02
- [x] DB: enum `estado_lead`, `sales.estado_lead DEFAULT 'nuevo'`, `sales.notas_lead`, `configuracion.email_notificaciones`
- [x] `/leads` — Server Component staff+, query `origen='web'` ordenado por `created_at DESC`
- [x] `LeadsClient` — tabla + filtros in-memory por estado + búsqueda por nombre/teléfono
- [x] `LeadDetalleModal` — datos cliente, productos, total, cambio de estado, notas append con timestamp
- [x] `actualizarEstadoLead` — valida enum, `revalidatePath('/leads')`
- [x] `agregarNotaLead` — append con `\n---\n`, rechaza vacío y > 1000 chars
- [x] `notificarNuevoLead` — Resend email no-bloqueante, guard `email_notificaciones` null
- [x] `crearPedido` llama `notificarNuevoLead` fire-and-forget (`.catch`, sin await)
- [x] Badge azul en Sidebar: count de `estado_lead='nuevo'`, query server-side en admin layout
- [x] Campo `email_notificaciones` en `/configuracion` — guarda y persiste
- [x] `/leads` en `ADMIN_ROUTES` del middleware — customers redirigen a `/mi-cuenta`
- [x] Build limpio: 33 rutas, TypeScript ✅

#### ~~8B — Email de confirmación al cliente~~ ❌ DESCARTADO
> Sin cuentas de customer por ahora; flujo es 100% WhatsApp. Email de confirmación no aplica en este modelo.

#### ~~8C — Estado de envío visible en `/mi-cuenta`~~ ❌ DESCARTADO
> Requiere customer autenticado. Sin login de clientes, la página `/mi-cuenta` no existe en el flujo actual.

**Prioridad P2 — Conversión / UX crítica:**

#### 8D — Búsqueda de productos en tienda ✅ 2026-06-02
- [x] Input de búsqueda en Header (desktop toggle animado + mobile inline)
- [x] Navegación a `/tienda?q=term` — `searchParams` en page, `initialQ` prop a `ShopWithSidebar`
- [x] Debounce 300ms, mínimo 2 caracteres
- [x] Banner "Resultados para: X" con botón limpiar; empty state si sin resultados
- [x] Build limpio: 34 rutas, TypeScript ✅

#### ~~8E — Wishlist / Favoritos~~ ❌ DESCARTADO
> Requiere customer autenticado. Sin login de clientes, ni la tabla DB ni el botón corazón tienen utilidad en el modelo actual.

#### ~~8F — Reseñas reales~~ ❌ DESCARTADO
> El form de envío requiere auth; sin cuentas de customer no hay reviews verificadas. Las reseñas hardcodeadas en PDP quedan como placeholder hasta que haya auth.

**Prioridad P3 — Deuda técnica y preparación escala:**

#### 8G — Fix ESLint ✅ 2026-06-02
- [x] Hook condicional en `Countdown` — early return movido después de `useEffect`
- [x] `ShopWithSidebar/CustomSelect` — `handleClickOutside` movido dentro del `useEffect`
- [x] `Header/CustomSelect` — bug oculto corregido: deps `[isOpen]`, listener ahora funciona correctamente
- [x] `Footer` — 5 `<a>` internos → `<Link>`, import `next/link` agregado
- [x] Build limpio: 34 rutas, TypeScript ✅, 0 warnings

#### 8H — Paginación en admin ✅ 2026-06-02
- [x] `/ventas/historial` — `searchParams`, `.range()` + count query, 50 por página, paginación UI con `getPageNums()`, se oculta cuando filtro fecha activo
- [x] `/inventario` — `searchParams`, `.range()` + count query, 50 por página, paginación UI, `totalCount` en subtitle
- [x] `useEffect([initial])` en ambos Client Components para sync en navegación entre páginas
- [x] Build limpio: 34 rutas, TypeScript ✅
- [ ] `/clientes` — descartado, baja prioridad operativa

#### ~~8I — Pasarela de pago~~ ❌ DESCARTADO
> Flujo de venta es 100% WhatsApp. Sin pasarela en este MVP; evaluar Culqi en fase futura cuando el volumen lo justifique.

#### 8J — Variables de entorno producción ✅ 2026-06-02
- [x] `RESEND_API_KEY` real activa en `.env.local` — emails de leads funcionando
- [x] Dominio `@montevida.pe` verificado en Resend; remitente unificado a `soporte@montevida.pe` en los 3 puntos de envío
- [x] Prueba de envío exitosa: Resend ID `6aaeca6f-f259-4119-b910-6d57d4dc2e54`

---

## Decisiones pendientes

| Decisión | Opciones | Estado |
|---|---|---|
| Supabase: mismo proyecto o nuevo | Mismo (`pvurmbrdifngjytkkcwu`) vs nuevo `montevida` | ✅ mismo proyecto |
| Checkout: guest o solo autenticado | Guest checkout vs login obligatorio | ✅ guest checkout (login futuro) |
| Imágenes productos: origen | Supabase Storage vs URLs CDN existentes | ✅ Supabase Storage |
| Pasarela de pago | Solo WhatsApp (MVP) vs Stripe/Culqi/Mercado Pago | ✅ solo WhatsApp (MVP) |

---

## Registro de progreso

| Fase | Estado | Fecha | Notas |
|---|---|---|---|
| Fase 1 — Setup base | ✅ completo | 2026-05-26 | Next.js 16.2.6 + TW v4 + Supabase SSR + middleware raíz + build limpio |
| Fase 2 — DB schema | ✅ completo | 2026-05-26 | 2 migraciones aplicadas, enums + columnas + RLS policies |
| Fase 3 — Auth | ✅ completo | 2026-05-26 | Login + registro + AuthSync + Zustand store + build limpio |
| Fase 4 — Storefront | ✅ completo | 2026-05-26 | 22 rutas, Supabase data layer, build limpio |
| Fase 5 — Admin | ✅ completo | 2026-05-26 | 32 rutas, DashboardShell + Sidebar + AdminHeader, build limpio |
| Fase 6 — Integración storefront ↔ admin | ✅ completo | 2026-05-26 | 6A checkout WhatsApp, 6B Storage imágenes, 6C visibilidad ventas web, 6D stock storefront |
| Fase 7 — Calidad, docs y rediseño UI/UX | ✅ completo | 2026-06-01/02 | Limpieza Sanity, specs de dominio, AGENTS.md, rediseño neumórfico Natural Wellness (storefront + admin 27 archivos), 20 productos cargados con imágenes |
| Fase 8A — Leads (módulo completo) | ✅ completo | 2026-06-02 | DB migration, /leads page, LeadsClient, modal, badge sidebar, notificación email, middleware |
| Fase 8D — Búsqueda en tienda | ✅ completo | 2026-06-02 | Header search (desktop + mobile), debounce 300ms, /tienda?q=term, banner resultados, empty state |
| Fase 8J — Variables producción | ✅ completo | 2026-06-02 | RESEND_API_KEY real, soporte@montevida.pe en 3 puntos de envío, prueba exitosa |
| Fase 8G — Fix ESLint | ✅ completo | 2026-06-02 | Countdown hook, CustomSelect ×2, Footer Link |
| Fase 8H — Paginación admin | ✅ completo | 2026-06-02 | /ventas/historial + /inventario, 50/página, URL-based, paginación UI con ellipsis |
| **Fase 8 — completa** | ✅ cerrada | 2026-06-02 | 8A+8D+8G+8H+8J completos · 8B/C/E/F/I descartados (sin customer auth, flujo WhatsApp) |
