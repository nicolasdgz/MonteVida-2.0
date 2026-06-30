# Convenciones de Monte Vida

Reglas de nomenclatura, estructura, tipado y flujo de trabajo para este repositorio.
Toda instancia de Claude Code debe leer este archivo antes de escribir código.

---

## Idioma

| Contexto | Idioma |
|---|---|
| Variables, funciones, tipos, rutas, constantes | Inglés |
| UI visible al usuario (labels, mensajes, toasts) | Español |
| Comentarios en código | Español, solo cuando el "por qué" no es obvio |
| Documentación en `/docs` | Español |
| Nombres de archivos y carpetas | Inglés |

---

## Estructura de carpetas

```
src/
  app/
    (site)/       # Storefront público — layout con Header/Footer site
    (admin)/      # Dashboard POS — layout con DashboardShell
    (auth)/       # Login/registro — layout mínimo
    api/          # Route Handlers (Resend, voucher)
  components/
    {domain}/     # Componentes de un dominio específico
    Common/       # Componentes reutilizables entre dominios
    layout/       # Shell, Header, Sidebar, Providers
    ui/           # Primitivos (Button, Container, StarRating)
  lib/
    supabase/     # Clientes Supabase (client.ts, server.ts, middleware.ts)
    dal.ts        # Data Access Layer — funciones server cacheadas
    data.ts       # Queries storefront server-side
    data-client.ts# Queries storefront browser-side
    storage.ts    # Helper de upload a Supabase Storage
    constants.ts  # ANONYMOUS_CLIENT_ID, GENERIC_DNI
  types/
    database.ts   # Fuente de verdad: enums DB + tipos de tablas
    product.ts    # UIProduct — shape de presentación del storefront
    category.ts   # UICategory
  store/          # Zustand stores
  redux/          # Redux Toolkit (cart)
  hooks/          # Custom React hooks
  utils/          # Funciones puras (igv, fechas, exportCsv)
docs/
  conventions.md  # Este archivo
  architecture.md # Diagrama de capas y decisiones arquitectónicas
  domains/        # Una spec por dominio de negocio
.claude/
  agents/         # Agentes SDD (spec, implement, validator)
```

---

## Nomenclatura de archivos

| Tipo | Convención | Ejemplos |
|---|---|---|
| Páginas Next.js | `page.tsx`, `layout.tsx`, `loading.tsx` (reservados) | `ventas/page.tsx` |
| Server Actions | `actions.ts` dentro de la carpeta de la ruta | `(admin)/ventas/actions.ts` |
| Componentes React | PascalCase + sufijo descriptivo | `RegistroVentaClient.tsx`, `VentaDetalleModal.tsx` |
| Hooks | camelCase con prefijo `use` | `useAuth.ts`, `useSaleForm.ts` |
| Stores Zustand | camelCase | `auth.ts`, `saleForm.ts` |
| Utilidades puras | camelCase | `igv.ts`, `fechas.ts`, `exportCsv.ts` |
| Tipos | camelCase o PascalCase según contexto | `database.ts`, `product.ts` |
| Constantes | `constants.ts` o dentro del módulo | `constants.ts` |

---

## Sufijos de componentes

| Sufijo | Cuándo usarlo | Ejemplos |
|---|---|---|
| `Client` | Client Component interactivo que es la pieza principal de una página admin | `RegistroVentaClient`, `HistorialClient`, `InventarioClient` |
| `Modal` | Dialog/modal con formulario o detalle | `VentaDetalleModal`, `ProductoModal`, `AjusteStockModal` |
| `Form` | Formulario standalone reutilizable | `CheckoutForm`, `ClienteForm` |
| `Table` | Tabla de datos (wrappea TanStack o HTML table) | `ProductosTable` |
| Sin sufijo | Componente de UI puro o sección de página | `BuscadorProductos`, `LineasVenta`, `StockBadge` |

---

## Convenciones TypeScript

### No usar `any`

```typescript
// MAL
shortDescription?: any

// BIEN
shortDescription?: string
```

Excepciones permitidas con `// eslint-disable-next-line @typescript-eslint/no-explicit-any`:
- Llamadas al cliente Supabase cuando los tipos generados no están actualizados
- Usar `as unknown as T` preferentemente sobre `as any`

### Separar tipos DB de tipos UI

```typescript
// database.ts — shape crudo de Supabase (fuente de verdad)
export type Product = Database['public']['Tables']['products']['Row']

// product.ts — shape de presentación del storefront
export type UIProduct = {
  id: string | number
  title: string
  price: number
  // ... campos UI, nunca campos internos de DB como precio_costo
}

// La transformación vive en data.ts → toUIProduct()
```

### Tipos de Server Actions

Cada Server Action exporta sus tipos de input/output:

```typescript
// En actions.ts del dominio
export interface CheckoutInput {
  items: { productId: string; quantity: number; price: number }[]
  nombre: string
  telefono: string
  direccion: string
  ciudad: string
}

export interface CheckoutResult {
  error: string | null
  saleId: string | null
  numeroVenta?: number
}

export async function crearPedido(input: CheckoutInput): Promise<CheckoutResult>
```

### Patrón de retorno de Server Actions

Todas las Server Actions retornan `{ error: string | null, ... }`:

```typescript
// SIEMPRE este patrón — nunca lanzar desde una Server Action llamada por UI
return { error: 'Mensaje descriptivo en español', data: null }
return { error: null, data: resultado }
```

La única excepción es `requireAdmin()` de `dal.ts`, que lanza para uso interno.

---

## Supabase — reglas de uso

| Situación | Cliente a usar | Importar desde |
|---|---|---|
| Server Component, Server Action, Route Handler | `await createClient()` | `@/lib/supabase/server` |
| Client Component (`'use client'`) | `createClient()` (síncrono) | `@/lib/supabase/client` |
| Operación que bypasea RLS (uploads, admin ops) | `await createAdminClient()` | `@/lib/supabase/server` |

`createAdminClient()` usa `SUPABASE_SERVICE_ROLE_KEY`. **Nunca llamar desde cliente ni exponer al browser.**

---

## Directiva `'use client'`

Usar `'use client'` solo cuando el componente necesita:
- Hooks de React (`useState`, `useEffect`, `useRef`, etc.)
- Contextos del browser (`useRouter`, `usePathname`, Redux, Zustand)
- Event handlers interactivos en tiempo real

Los Server Components (sin directiva) son el default. Preferir RSC siempre que sea posible.

---

## Estado — cuándo usar qué

| Estado | Tecnología | Ejemplos |
|---|---|---|
| Carrito del storefront | Redux Toolkit + redux-persist | `cart-slice.ts` |
| Auth del usuario autenticado | Zustand — `store/auth.ts` | `useAuthStore` |
| Formulario POS en curso | Zustand persisted — `store/saleForm.ts` | `useSaleForm` |
| Config del negocio | Zustand — `store/configuracion.ts` | `useConfiguracion` |
| Estado de UI local (modal open, tab activo) | `useState` en el componente |  |
| Datos del servidor | Server Components + `revalidatePath` / `revalidateTag` |  |

No crear nuevos stores Zustand sin justificación. No poner datos del servidor en Redux.

---

## Uploads a Supabase Storage

Siempre usar el helper unificado:

```typescript
import { uploadFile, getFileExt } from '@/lib/storage'

const { publicUrl, error } = await uploadFile(bucket, `${id}.${getFileExt(file.name)}`, file)
```

Buckets disponibles: `product-images`, `vouchers`, `comprobantes`, `branding`.

---

## Auth y permisos en Server Actions

```typescript
// Verificar sesión (cualquier rol autenticado)
const user = await verifySession()   // redirige si no autenticado

// Verificar rol admin (lanza Error si no es admin)
const { user, supabase } = await requireAdmin()

// Patrón para actions que usan requireAdmin:
try {
  ({ user, supabase } = await requireAdmin())
} catch (e) {
  return { error: (e as Error).message, data: null }
}
```

---

## Flujo SDD — Spec Driven Development

Para cualquier módulo nuevo o cambio significativo:

```
1. spec agent  →  docs/domains/{domain}.md    (spec del dominio)
2. [aprobación humana]
3. implement agent  →  escribe código
4. validator agent  →  verifica código vs spec
5. Si errores: volver a paso 3
6. Si OK: marcar checkboxes en spec como [x]
```

Ver `.claude/agents/` para instrucciones detalladas de cada agente.

---

## Convenciones de rutas

Todas las rutas del storefront son en español:
`/tienda`, `/producto/[slug]`, `/iniciar-sesion`, `/mi-cuenta`, `/checkout`

Las rutas admin no tienen prefijo `/admin/`:
`/ventas`, `/inventario`, `/clientes`, `/caja`, `/gastos`, `/reportes`, `/configuracion`, `/mercaderia`

El middleware en `middleware.ts` (raíz) protege las rutas — **no agregar protección en páginas individuales**.

---

## Seguridad — Supabase

> Contexto: En mayo 2026 Supabase anunció que a partir de octubre 2026 las tablas en `public` schema dejarán de tener grants implícitos a `anon` y `authenticated`. Cualquier tabla sin GRANT explícito perderá acceso al Data API. Este proyecto fue migrado en junio 2026 (migración `security_grants_and_function_hardening`).

### Regla 1 — Toda tabla nueva requiere GRANT explícito

Nunca depender de grants implícitos. Agregar junto con la migración DDL:

```sql
-- Patrón mínimo para tabla nueva
-- 1. Habilitar RLS PRIMERO
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;

-- 2. Luego los grants (nunca ALL PRIVILEGES)
-- Si es tabla pública (storefront sin auth):
GRANT SELECT ON TABLE public.nueva_tabla TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nueva_tabla TO authenticated;

-- Si es tabla interna (solo admin/staff, nunca acceso anon):
-- No dar ningún grant a anon
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nueva_tabla TO authenticated;
```

Regla de oro por rol:
- `anon`: solo `SELECT` si el dato es público (ej: `products`, `categories`). Nunca `INSERT`, `UPDATE`, `DELETE`. Nunca en tablas financieras, de personal o configuración.
- `authenticated`: solo los verbos que la aplicación realmente ejecuta. `DELETE` solo si hay flujo de borrado; `INSERT` solo si hay flujo de creación. Nunca `TRUNCATE`, `REFERENCES`, `TRIGGER`.
- `service_role` / `postgres`: ya tienen acceso total por default, no necesitan GRANT explícito.

### Regla 2 — RLS antes de cualquier GRANT

El orden importa. Si se ejecuta un GRANT antes de habilitar RLS, la tabla queda expuesta sin filtro de filas durante la ventana entre el GRANT y el `ENABLE ROW LEVEL SECURITY`.

```sql
-- CORRECTO: RLS primero
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.nueva_tabla TO anon;

-- MAL: GRANT antes de RLS → ventana de exposición
GRANT SELECT ON TABLE public.nueva_tabla TO anon;
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY; -- tarde
```

Toda tabla en `public` debe tener `rowsecurity = true`. Verificar con:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### Regla 3 — Funciones nuevas con `search_path = ''`

Sin `search_path` fijado, una función puede ser víctima de search_path injection: un atacante crea objetos en un schema con el mismo nombre que funciones del sistema y desvía la ejecución.

```sql
-- Toda función nueva debe incluir SET search_path = ''
CREATE OR REPLACE FUNCTION public.mi_funcion()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''          -- OBLIGATORIO
AS $$
BEGIN
  -- Usar schema explícito en todas las referencias
  INSERT INTO public.mi_tabla VALUES (...);
END;
$$;

-- Para funciones existentes sin search_path:
ALTER FUNCTION public.nombre_funcion() SET search_path = '';
```

### Regla 4 — Funciones SECURITY DEFINER no ejecutables por `anon`

`SECURITY DEFINER` hace que la función corra con los permisos del dueño (postgres), ignorando RLS. Si `anon` puede ejecutarla vía `/rest/v1/rpc/`, cualquier visitante tiene acceso privilegiado.

```sql
-- Al crear una función SECURITY DEFINER, revocar EXECUTE de anon inmediatamente:
CREATE OR REPLACE FUNCTION public.mi_funcion_admin(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ ... $$;

REVOKE EXECUTE ON FUNCTION public.mi_funcion_admin(...) FROM anon;
-- authenticated: evaluar caso por caso si el RPC debe ser público
```

Excepción justificada: solo si la función necesita ser llamada por usuarios no autenticados Y su lógica interna es segura frente a inputs arbitrarios. Documentar el motivo en un comentario en la migración.

### Regla 5 — Buckets de Storage sin listing público

Un bucket con política SELECT amplia (`USING (true)`) permite que cualquier visitante liste todos los archivos del bucket vía `/storage/v1/object/list/`. Expone nombres de archivo, estructura interna y metadatos.

```sql
-- MAL: permite listing + acceso (política actual de product-images)
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'mi-bucket');

-- BIEN: acceso por URL directa sin permitir listing
-- Opción A — requerir que el objeto exista en la tabla products
CREATE POLICY "Direct URL only"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mi-bucket'
  AND EXISTS (
    SELECT 1 FROM public.products
    WHERE imagen_url LIKE '%' || name || '%'
  )
);

-- Opción B — solo usuarios autenticados pueden listar; anon accede solo por URL
CREATE POLICY "Auth listing, anon direct only"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mi-bucket'
  AND (auth.role() = 'authenticated' OR name IS NOT NULL)
);
```

Para buckets privados (vouchers, comprobantes, branding): nunca política SELECT pública; usar signed URLs generadas server-side.

### Regla 6 — Tablas públicas requieren GRANT *y* política RLS pública

`GRANT SELECT TO anon` es necesario pero no suficiente. Si RLS está habilitado (siempre debe estarlo) y no existe ninguna política `FOR SELECT` que cubra al rol `anon`, PostgREST devuelve 0 filas sin lanzar error — y los joins fallan en silencio.

Ejemplo real: `categories` tenía `GRANT SELECT TO anon` pero su única política era `auth.uid() IS NOT NULL`. Resultado: `getStoreProducts()` retornaba `[]` para visitantes anónimos, porque el join `categories(*)` bloqueaba toda la query.

Para toda tabla con datos públicos (legible sin autenticación):

```sql
-- GRANT (permiso de acceso al Data API)
GRANT SELECT ON TABLE public.mi_tabla TO anon;

-- POLÍTICA RLS (permiso de ver filas)  ← sin esto, anon ve 0 filas aunque tenga GRANT
CREATE POLICY "mi_tabla_public_read"
  ON public.mi_tabla
  FOR SELECT
  TO public
  USING (true);
```

Ambas son obligatorias. Sin el GRANT, el Data API rechaza la conexión. Sin la política, RLS filtra todas las filas antes de responder. Los joins desde `getStoreProducts()` o cualquier `.select('*, tabla_relacionada(*)')` fallan silenciosamente si la tabla relacionada no tiene política pública.

---

## Prohibiciones explícitas

- No usar `cdn.sanity.io` ni `cdn.shopify.com` como fuente de imágenes
- No importar `@portabletext/react` (dependencia sin uso)
- No llamar `createAdminClient()` desde código cliente
- No crear datos hardcodeados en `src/data/` — usar Supabase
- No agregar `console.log` en producción sin justificación
- No crear un segundo `requireAdmin` local — usar el de `@/lib/dal`
- No usar `any` sin comentario de excepción justificado
- No usar `GRANT ALL PRIVILEGES` ni `GRANT ALL` en tablas públicas — siempre verbos explícitos
- No crear funciones sin `SET search_path = ''`
- No crear buckets de Storage con política SELECT que permita listing anónimo
