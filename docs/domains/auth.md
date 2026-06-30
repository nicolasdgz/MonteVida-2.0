# Spec: Auth

> Estado: ACTUALIZADO — flujo de invitación de staff especificado, pendiente de implementación
> Última actualización: 2026-06-02

## Propósito

Autenticación y autorización de todos los usuarios de la aplicación. Gestiona tres roles: `admin`, `staff` (panel interno) y `customer` (storefront). Implementado sobre Supabase Auth con SSR via `@supabase/ssr`.

---

## Rutas involucradas

| Ruta | Tipo | Auth | Descripción |
|---|---|---|---|
| `/iniciar-sesion` | Client Component | Público (redirect si ya auth) | Formulario de login email/password |
| `/registro` | Client Component | Público (redirect si ya auth) | Registro de nuevos clientes |
| `/auth/callback` | Route Handler | Público | Intercambio de código OAuth/email/invite |
| `/auth/nueva-contrasena` | Client Component | Requiere sesión activa (post-invite) | Formulario para que el invitado establezca su contraseña |
| `/mi-cuenta` | Server Component | `customer\|staff\|admin` | Perfil y pedidos del usuario |

---

## Matriz de redirects del middleware

```
Ruta protegida + no autenticado    →  /iniciar-sesion
/iniciar-sesion + autenticado      →  según rol (ver tabla abajo)
/registro + autenticado            →  según rol
```

| Rol | Redirect tras login exitoso |
|---|---|
| `admin` | `/ventas` |
| `staff` | `/ventas` |
| `customer` | `/mi-cuenta` |

---

## Rutas protegidas por categoría

```typescript
// src/lib/supabase/middleware.ts

// Requieren cualquier usuario autenticado
const AUTH_ROUTES = ['/mi-cuenta', '/checkout']

// Requieren role: staff | admin
const ADMIN_ROUTES = ['/ventas', '/clientes', '/inventario', '/caja', '/dashboard']

// Requieren role: admin únicamente
const ADMIN_ONLY_ROUTES = ['/gastos', '/reportes', '/configuracion', '/mercaderia']
```

---

## Server Actions

### `signIn(formData: FormData): Promise<ActionState>`

**Archivo:** `src/app/(auth)/iniciar-sesion/actions.ts`

**Input (FormData):** `email: string`, `password: string`

**Output:**
```typescript
interface ActionState {
  error: string | null
  message?: string
}
```

**Proceso:**
1. `supabase.auth.signInWithPassword({ email, password })`
2. Lee `profiles.role` del usuario autenticado
3. Redirect por rol: admin/staff → `/ventas`, customer → `/mi-cuenta`

**Permisos:** Público

**Errores conocidos:** Supabase devuelve mensaje genérico para credenciales inválidas — no revelar si el email existe

---

### `signOut(): Promise<void>`

**Side-effects:**
- `supabase.auth.signOut()`
- Redirect a `/iniciar-sesion`

**Permisos:** Cualquier usuario autenticado

---

### `signUp(formData: FormData): Promise<ActionState>`

**Archivo:** `src/app/(auth)/registro/actions.ts`

**Input (FormData):** `fullName: string`, `email: string`, `password: string`, `confirmPassword: string`

**Validaciones server-side:**
- Todos los campos requeridos
- `password.length >= 8`
- `password === confirmPassword`

**Proceso:**
1. Valida inputs
2. `supabase.auth.signUp({ email, password })` — usa cliente anónimo (no admin)
3. Inserta en `profiles` con `role='customer'` via `adminClient` (para bypass RLS)
4. Si hay sesión inmediata: redirect a `/mi-cuenta`
5. Si requiere confirmación de email: retorna mensaje de éxito

**Side-effects:**
- Crea usuario en `auth.users`
- Inserta en `profiles` con `{ id: user.id, full_name, role: 'customer' }`

**Permisos:** Público (usa `createAdminClient()` solo para insertar en `profiles`)

**Nota de seguridad:** El `adminClient` con service role solo se usa para insertar el profile — la auth en sí usa el cliente normal

---

---

## Flujo de Invitación de Staff/Admin *(pendiente de implementación)*

Reemplaza el flujo anterior de `createUser` (que requería que el admin definiera la contraseña del vendedor). El admin solo ingresa nombre, email y rol — el propio invitado establece su contraseña.

### Diagrama del flujo

```
Admin en /configuracion
  → Completa formulario: nombre + email + rol (staff|admin)
  → Llama invitarUsuario()
      ├─ supabase.auth.admin.inviteUserByEmail(email, { redirectTo })
      │   └─ Supabase crea user en auth.users + envía email de invitación
      └─ Inserta profile en public.profiles con { id: user.id, full_name, role }

Vendedor recibe email
  → Clic en "Aceptar invitación"
  → Supabase valida token → redirect a /auth/callback?next=/auth/nueva-contrasena
      └─ exchangeCodeForSession() → sesión activa

/auth/nueva-contrasena
  → Vendedor ingresa nueva contraseña + confirmación
  → Llama setNuevaContrasena()
      └─ supabase.auth.updateUser({ password })
      └─ Redirect a /ventas
```

### Diferencias con `createUser` (flujo anterior)

| Aspecto | `createUser` (anterior) | `invitarUsuario` (nuevo) |
|---|---|---|
| Campo contraseña en formulario | ✅ Admin la define | ❌ Eliminado |
| Quién define la contraseña | Admin | El propio invitado |
| Método Supabase | `auth.admin.createUser()` | `auth.admin.inviteUserByEmail()` |
| Email enviado al invitado | Ninguno | Email de invitación automático |
| Login inmediato tras crear | ✅ | ❌ (requiere aceptar invitación) |

> `createUser` queda **deprecado** en la UI — se mantiene en `configuracion/actions.ts` hasta que el flujo de invitación esté validado en producción.

---

## Server Actions (nuevas)

### `invitarUsuario(payload): Promise<ServiceResult<UserCreated | null>>`

**Archivo:** `src/app/(admin)/configuracion/actions.ts`

**Input:**
```typescript
interface InvitarUsuarioPayload {
  email: string
  full_name: string
  role: 'admin' | 'staff'   // 'customer' no aplica — invitación es solo para equipo interno
}
```

**Output:** Mismo `ServiceResult<UserCreated | null>` que `createUser`.

**Proceso paso a paso:**
1. `requireAdmin()` — lanza si no es admin
2. Verificar que no existe ya un profile con ese email en `profiles` (via join con `auth.users`) — retornar error si existe
3. `adminClient.auth.admin.inviteUserByEmail(email, { redirectTo })` donde:
   ```
   redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/nueva-contrasena`
   ```
4. Si error de Supabase: retornar `{ data: null, error: error.message }`
5. Con `data.user.id`: insertar en `profiles` → `{ id, full_name, role }`
6. Si falla el insert en `profiles`: llamar `adminClient.auth.admin.deleteUser(user.id)` (rollback) y retornar error
7. Retornar `{ data: { id, email, full_name, role }, error: null }`

**Side-effects:**
- Crea user en `auth.users` (Supabase lo hace vía invite)
- Inserta en `public.profiles` con el rol asignado
- Envía email de invitación automático desde Supabase

**Permisos:** `requireAdmin()`

**Errores esperados:**
- Email ya registrado → `"Este email ya tiene una cuenta en el sistema."`
- Supabase error (rate-limit, dominio inválido, etc.) → mensaje de Supabase
- Profile insert falla → rollback + `"Error creando perfil de usuario."`

**Variable de entorno requerida:** `NEXT_PUBLIC_SITE_URL` (ver sección de variables)

---

### `setNuevaContrasena(formData: FormData): Promise<ActionState>`

**Archivo:** `src/app/(auth)/nueva-contrasena/actions.ts`

**Input (FormData):** `nueva_contrasena: string`, `confirmar_contrasena: string`

**Validaciones server-side:**
- `nueva_contrasena.length >= 8`
- `nueva_contrasena === confirmar_contrasena`

**Proceso:**
1. Validar inputs
2. `supabase.auth.updateUser({ password: nueva_contrasena })` — requiere sesión activa
3. Si error: retornar `{ error: error.message }`
4. Leer rol del usuario desde `profiles` para determinar redirect
5. Redirect a `/ventas` (admin/staff) o `/mi-cuenta` (customer, por si acaso)

**Permisos:** Requiere sesión activa — el usuario ya fue autenticado por el callback de invitación

**Nota:** `supabase.auth.updateUser()` usa el cliente normal (no admin) — opera sobre la sesión del usuario actual

---

## Página: `/auth/nueva-contrasena`

**Archivo:** `src/app/(auth)/nueva-contrasena/page.tsx`

**Tipo:** Client Component (usa `useFormState` o `useState` para loading/error)

**Layout:** Hereda `(auth)/layout.tsx` — pantalla mínima sin nav

**Acceso:**
- Accessible para usuarios con sesión activa — el invitado llega aquí con sesión post-callback
- Si no hay sesión activa: mostrar mensaje de error ("Este enlace ya fue usado o ha expirado")
- No debe estar en `isAuthRoute` del middleware — un usuario autenticado necesita poder acceder

**Campos:**
- `nueva_contrasena` — input type="password", min 8 caracteres
- `confirmar_contrasena` — input type="password"

**Flujo de UI:**
1. Renderiza formulario
2. Submit → llama `setNuevaContrasena(formData)`
3. Loading state mientras la action procesa
4. Error inline si validación falla o Supabase retorna error
5. Éxito: redirect automático (la action hace `redirect()`)

**No debe:** hacer redirect si no hay sesión — mostrar error inline en su lugar

---

## Componentes modificados

### `UsuarioModal` — cambios para flujo de invitación

**Archivo:** `src/components/configuracion/UsuarioModal.tsx`

**Cambios respecto al modal actual:**

| Campo | Antes | Después |
|---|---|---|
| Nombre completo | ✅ requerido | ✅ requerido (sin cambio) |
| Email | ✅ requerido | ✅ requerido (sin cambio) |
| Contraseña | ✅ campo visible, min 8 chars | ❌ **eliminado** |
| Confirmación contraseña | (implícito en UI) | ❌ **eliminado** |
| Rol | staff/admin | staff/admin (sin cambio) |
| Action llamada | `createUser(payload)` | `invitarUsuario(payload)` |
| Texto botón submit | "Crear usuario" | "Enviar invitación" |
| Mensaje de éxito en toast | "Usuario creado." | "Invitación enviada a {email}." |

**Flujo tras éxito:**
- Retorna `UserCreated` via `onCreated` callback (sin cambio en la interfaz del parent)
- El usuario aparece en la tabla de usuarios en `/configuracion` con su rol
- El invitado aún no puede iniciar sesión hasta que acepte la invitación y establezca su contraseña

---

## Route Handler — cambios

### `GET /auth/callback` — actualización

El handler existente ya soporta el flujo de invitación sin cambios de código — `exchangeCodeForSession(code)` procesa tanto tokens OAuth como tokens de invitación. El redirect a `/auth/nueva-contrasena` se controla via el param `?next=` que viene en la URL del callback.

**Validar que la URL del callback en `/configuracion/supabase.com`** incluya el dominio de producción en "Allowed redirect URLs".

---

## Tipos requeridos (nuevos)

```typescript
// src/app/(admin)/configuracion/actions.ts — nuevo tipo de input
interface InvitarUsuarioPayload {
  email: string
  full_name: string
  role: 'admin' | 'staff'
}

// Reutiliza ServiceResult<UserCreated> ya definido en el archivo
```

---

## Route Handler

**Archivo:** `src/app/auth/callback/route.ts`

**Query params:** `code: string`, `next?: string` (default `/mi-cuenta`)

**Proceso:**
1. `supabase.auth.exchangeCodeForSession(code)`
2. En éxito: redirect a `next` (o `/mi-cuenta`)
3. En error: redirect a `/iniciar-sesion?error=auth_callback_failed`

**Uso:** Confirmación de email post-registro, OAuth flows futuros

---

## Middleware

### `updateSession(request: NextRequest): Promise<NextResponse>`

**Archivo:** `src/lib/supabase/middleware.ts`

**Flujo completo:**
```
Request llega
  ↓
¿Es ruta pública (assets, _next)? → pasar
  ↓
Refrescar sesión Supabase en cookies
  ↓
¿Ruta protegida + no autenticado? → redirect /iniciar-sesion
  ↓
¿Ruta /iniciar-sesion o /registro + autenticado? → redirect por rol
  ↓
¿Ruta admin/staff + rol es customer? → redirect /mi-cuenta
  ↓
¿Ruta admin-only + rol es staff? → redirect /ventas
  ↓
Pasar request
```

**Invocado desde:** `middleware.ts` en raíz del proyecto

---

## Store Zustand: `useAuthStore`

**Archivo:** `src/store/auth.ts`

```typescript
interface AuthState {
  profile: Profile | null
  isLoading: boolean
  setProfile: (profile: Profile) => void
  clearProfile: () => void
}
```

**Sincronización:** `AuthSync` component en `Providers.tsx` sincroniza el profile al montar via `supabase.auth.getUser()` + query a `profiles`

---

## Hook: `useAuth`

**Archivo:** `src/hooks/useAuth.ts`

```typescript
interface AuthContext {
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isStaff: boolean
  isCustomer: boolean
  isAdminOrStaff: boolean
}

export function useAuth(): AuthContext
```

**Uso en componentes Client:** Para mostrar/ocultar UI condicional por rol

**No usar para protección de rutas** — eso lo hace el middleware

---

## Tipos requeridos

```typescript
// src/types/database.ts — ya existen
type UserRole = 'admin' | 'staff' | 'customer'

interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  telefono: string | null
  direccion_envio: string | null
  created_at: string
  updated_at: string
}

// src/app/(auth)/*/actions.ts
interface ActionState {
  error: string | null
  message?: string
}
```

---

## Variables de entorno requeridas

```bash
NEXT_PUBLIC_SUPABASE_URL=https://pvurmbrdifngjytkkcwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Solo server-side, nunca exponer
NEXT_PUBLIC_SITE_URL=https://www.montevida.pe   # Requerida para redirectTo en invitaciones
```

---

## Reglas de negocio

- Nuevos registros públicos siempre reciben `role='customer'` — no se puede auto-asignar admin/staff
- Crear usuarios staff/admin desde `/configuracion` vía `invitarUsuario` (nuevo) — `createUser` está deprecado en UI
- El link de invitación es de un solo uso y expira según la config de Supabase (default 24h)
- Si el invitado no acepta antes de que expire el link, el admin debe reinvitar desde `/configuracion`
- El usuario creado por invitación aparece en la tabla de usuarios inmediatamente, pero no puede iniciar sesión hasta establecer contraseña
- El middleware actualiza la sesión en cada request — las cookies se refrescan automáticamente
- `isLoading=true` en el store mientras `AuthSync` no termine — los componentes deben manejar este estado
- Si el profile no existe en `profiles` para un user autenticado, el middleware puede fallar — siempre insertar profile en el signup
- `useAuth()` es solo para UI condicional — la protección real está en middleware + DAL
- `verifySession()` en el DAL redirige server-side si no hay sesión — no lanza Error
- `requireAdmin()` en el DAL lanza Error si no es admin — usar en Server Actions con try-catch

---

## Acceptance Criteria

- [x] `signIn` redirige admin/staff a `/ventas`, customer a `/mi-cuenta`
- [x] `signIn` retorna error legible si credenciales inválidas (sin revelar si email existe)
- [x] `signOut` limpia sesión y redirige a `/iniciar-sesion`
- [x] `signUp` crea user en auth.users + profile con `role='customer'`
- [x] `signUp` valida longitud de password (min 8) y coincidencia
- [x] `signUp` muestra mensaje de confirmación de email (no redirige si requiere verificación)
- [x] `/auth/callback` intercambia código por sesión correctamente
- [x] Middleware redirige rutas protegidas si no autenticado
- [x] Middleware redirige customer fuera de rutas admin
- [x] Middleware redirige staff fuera de rutas admin-only
- [x] `useAuth()` retorna flags derivados correctos (isAdmin, isStaff, etc.)
- [x] `AuthSync` sincroniza store al montar sin flash de contenido no autenticado
- [x] Error retornado como `{ error: string | null }` — nunca throw al cliente

### Acceptance Criteria — Flujo de Invitación *(pendiente)*

- [ ] `invitarUsuario` requiere rol admin — staff no puede invitar usuarios
- [ ] `invitarUsuario` rechaza email que ya tiene profile en `profiles` con mensaje claro
- [ ] `invitarUsuario` llama `inviteUserByEmail` con `redirectTo` apuntando a `/auth/callback?next=/auth/nueva-contrasena`
- [ ] `invitarUsuario` inserta en `profiles` con el rol correcto tras crear el auth user
- [ ] `invitarUsuario` hace rollback (`deleteUser`) si falla el insert en `profiles`
- [ ] `invitarUsuario` retorna `UserCreated` — `UsuarioModal` lo agrega a la lista local sin refetch
- [ ] `UsuarioModal` no tiene campo de contraseña — solo nombre, email, rol
- [ ] Toast en `/configuracion` muestra "Invitación enviada a {email}." tras éxito
- [ ] El invitado recibe email con link de invitación (verificar en Supabase Auth logs)
- [ ] `/auth/callback` procesa el token de invitación y redirige a `/auth/nueva-contrasena`
- [ ] `/auth/nueva-contrasena` renderiza formulario con campos nueva_contrasena y confirmar_contrasena
- [ ] `setNuevaContrasena` valida longitud mínima 8 chars y coincidencia entre campos
- [ ] `setNuevaContrasena` llama `supabase.auth.updateUser({ password })` con la sesión activa
- [ ] Tras `setNuevaContrasena` exitoso: redirect a `/ventas` si admin/staff, `/mi-cuenta` si customer
- [ ] `/auth/nueva-contrasena` sin sesión activa muestra error "Enlace expirado" en lugar de formulario
- [ ] `NEXT_PUBLIC_SITE_URL` configurada en `.env.local` y producción
- [ ] URL de callback `https://www.montevida.pe/auth/callback` en "Allowed redirect URLs" de Supabase
- [ ] Error retornado como `{ error: string | null }` — nunca throw al cliente

---

## Trabajo futuro (fuera del MVP actual)

- OAuth con Google (la infraestructura de callback ya está)
- "Olvidé mi contraseña" flow (Supabase tiene soporte nativo — similar al flujo de invitación)
- Verificación de 2FA
- Sesión persistente "Recordarme"
- Reinvitación desde `/configuracion` cuando el link de invitación expira
