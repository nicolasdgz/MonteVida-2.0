# Spec: Configuración

> Estado: DOCUMENTADO — código existente, spec generada para referencia y validación futura
> Última actualización: 2026-06-01

## Propósito

Configuración global del negocio (nombre, IGV, logo/banner) y gestión de usuarios del sistema (crear/eliminar admin y staff). Admin-only. Es el único punto donde se crean nuevos usuarios internos.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/configuracion` | Server Component | admin | Panel de branding + gestión de usuarios |

---

## Server Actions

### `actualizarConfiguracion(formData: FormData): Promise<{ error: string | null }>`

**Archivo:** `src/app/(admin)/configuracion/actions.ts`

**Input (FormData):**
```typescript
// nombre_negocio: string (requerido, trim())
// igv_porcentaje: string (float, 0-100)
// logo?: File (opcional)
// banner?: File (opcional)
```

**Validaciones:**
- `nombre_negocio` no puede estar vacío
- `igv_porcentaje` debe ser número entre 0 y 100

**Proceso:**
1. Verifica que exista un registro en `configuracion` (singleton)
2. Actualiza `nombre_negocio` e `igv_porcentaje`
3. Si hay logo: sube a bucket `branding` con path `logo.{ext}` via `uploadFile`, actualiza `configuracion.logo_url`
4. Si hay banner: sube a bucket `branding` con path `banner.{ext}` via `uploadFile`, actualiza `configuracion.banner_url`

**Side-effects:**
- Actualiza `configuracion` (singleton)
- Sube logo/banner a Storage si se adjuntan
- `revalidatePath('/', 'layout')` — invalida todo el layout para reflejar cambios globales

**Permisos:** `requireAdmin()`

---

### `createUser(payload): Promise<ServiceResult<UserCreated | null>>`

**Input:**
```typescript
interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  role: UserRole       // 'admin' | 'staff' (customer no se crea desde aquí)
}
```

**Output:**
```typescript
interface ServiceResult<T> {
  data: T
  error: string | null
}
interface UserCreated {
  id: string
  email: string
  full_name: string
  role: UserRole
}
```

**Proceso:**
1. `adminClient.auth.admin.createUser({ email, password, email_confirm: true })`
2. Inserta en `profiles` con `{ id, full_name, role }`
3. Si falla el insert del profile: elimina el auth user creado (rollback)

**Side-effects:**
- Crea user en `auth.users`
- Inserta en `profiles`

**Permisos:** `requireAdmin()` — `email_confirm: true` bypasea confirmación de email

---

### `deleteUser(userId: string): Promise<ServiceResult>`

**Validaciones:**
- No puede eliminar su propia cuenta (`userId === caller.id`)

**Side-effects:**
- `adminClient.auth.admin.deleteUser(userId)` — elimina auth user y su profile en cascade

**Permisos:** `requireAdmin()`

---

### `listUsers(): Promise<ServiceResult<UserListItem[]>>`

**Output:** Lista de usuarios con `id`, `email`, `full_name`, `role` — solo los que tienen profile en `profiles`

**Lógica:**
1. `adminClient.auth.admin.listUsers()` → lista auth users
2. Query `profiles` → map `id → profile`
3. Intersección: solo retorna users con profile existente

**Side-effects:** ninguno (solo lectura)

**Permisos:** `requireAdmin()`

---

## Componentes

### `ConfiguracionClient`

**Tipo:** Client Component
**Archivo:** `src/components/configuracion/ConfiguracionClient.tsx`

**Props:**
```typescript
interface ConfiguracionClientProps {
  config: Configuracion
  users: UserListItem[]
  currentUserId: string   // para deshabilitar botón de eliminar en usuario propio
}
```

**Responsabilidades:**
- Sección Branding: input nombre negocio, input IGV %, upload logo con preview, upload banner con preview
- Sección Usuarios: tabla con avatar/nombre/email/role badge, botón eliminar (deshabilitado si es el usuario actual)
- Botón "Nuevo usuario" abre `UsuarioModal`
- `ROLE_STYLE` map para colores de badge: admin (rojo), staff (azul), customer (verde)
- Botón guardar configuración con loading state

**No debe:** editar roles de usuarios existentes — solo crear nuevos con rol fijo

---

### `UsuarioModal`

**Tipo:** Client Component
**Archivo:** `src/components/configuracion/UsuarioModal.tsx`

**Props:**
```typescript
interface UsuarioModalProps {
  open: boolean
  onClose: () => void
  onCreated: (user: UserCreated) => void
}
```

**Responsabilidades:**
- Campos: nombre completo (requerido), email (requerido), contraseña (min 8 chars, toggleable), rol (staff/admin — no customer)
- Reset del formulario al abrir el modal
- Llama `createUser` al submit
- Retorna usuario creado via `onCreated` para agregar a lista local

**Validaciones client-side:**
- Todos los campos requeridos
- Password mínimo 8 caracteres

---

## Tipos requeridos

```typescript
// src/types/database.ts — ya existen
type Configuracion = Tables<"configuracion">
type UserRole = Enums<"user_role">   // 'admin' | 'staff' | 'customer'
type Profile = Tables<"profiles">
```

---

## Constantes relevantes

```typescript
// src/lib/supabase/server.ts
createAdminClient()  // requerido para auth.admin.* operations

// Buckets Storage
'branding'  // logo.{ext}, banner.{ext}
```

---

## Reglas de negocio

- Solo `admin` accede a `/configuracion` — el Server Component redirige a `/ventas` si no es admin
- `configuracion` es un singleton — siempre existe exactamente 1 fila; la page redirige si no existe
- El logo/banner en Storage se sobreescriben con `upsert: true` — path `logo.{ext}` es fijo (no incluye ID)
- `createUser` usa `email_confirm: true` — el usuario puede iniciar sesión inmediatamente, sin confirmar email
- Al crear usuario: si el insert en `profiles` falla, se hace rollback eliminando el auth user
- No se puede eliminar la propia cuenta — botón deshabilitado en UI + validación en acción
- Solo se pueden crear usuarios con roles `admin` o `staff` desde este panel — `customer` no aparece en el dropdown
- `igv_porcentaje` default 18 — la app usa `IGV_DEFAULT_PCT` de `@/utils/igv` como fallback si no hay config
- `revalidatePath('/', 'layout')` invalida el layout completo para reflejar nombre/logo del negocio globalmente

---

## Acceptance Criteria

- [x] Solo admin accede — Server Component redirige staff a /ventas
- [x] `actualizarConfiguracion` valida nombre no vacío e IGV entre 0-100
- [x] Logo y banner se suben a bucket `branding` con paths `logo.{ext}` / `banner.{ext}`
- [x] `revalidatePath('/', 'layout')` invalida el layout completo tras actualizar config
- [x] `createUser` usa `email_confirm: true` — login inmediato sin confirmar email
- [x] `createUser` hace rollback del auth user si falla el insert en `profiles`
- [x] `deleteUser` rechaza eliminar la propia cuenta
- [x] `UsuarioModal` solo permite roles `admin` y `staff` — no `customer`
- [x] `UsuarioModal` valida password mínimo 8 caracteres
- [x] `ConfiguracionClient` deshabilita botón eliminar en el usuario actual (`currentUserId`)
- [x] `listUsers` solo retorna usuarios que tienen profile en `profiles`
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente
