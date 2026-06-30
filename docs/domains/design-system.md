# Spec: Design System — Admin Panel Theme

> Estado: ESPECIFICADO — toggle de tema pendiente de implementación
> Última actualización: 2026-06-02

## Propósito

Sistema de tema claro/oscuro para el panel admin. El toggle aplica **únicamente a `admin-root`** — el storefront público no se ve afectado. El panel actualmente está hardcodeado a dark (slate-950); esta spec define la infraestructura para soportar ambos modos con migración gradual de componentes.

---

## Estado actual

| Elemento | Estado |
|---|---|
| `@custom-variant dark (&:where(.dark, .dark *))` en `globals.css` | ✅ definido — habilitado pero sin uso |
| Clase `.dark` aplicada en algún elemento | ❌ nunca aplicada |
| Toggle UI | ❌ no existe |
| Store de tema | ❌ no existe |
| `surface-sidebar` en `admin.css` | ⚠️ clase sin estilos — selector vacío |

---

## Rutas involucradas

Solo afecta el layout del panel admin. Sin rutas nuevas.

| Archivo | Tipo de cambio |
|---|---|
| `src/store/theme.ts` | **Nuevo** — Zustand store con persist |
| `src/components/layout/DashboardShell.tsx` | Aplica clase `.dark` al `admin-root` div |
| `src/components/layout/AdminHeader.tsx` | Botón toggle Sol/Luna + dark: variants |
| `src/components/layout/Sidebar.tsx` | dark: variants en nav items y bordes |
| `src/app/(admin)/admin.css` | Estilos `surface-sidebar` para ambos modos |

---

## Store: `useThemeStore`

**Archivo:** `src/store/theme.ts`

```typescript
type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}
```

**Implementación:** Zustand `create` + `persist` middleware

```typescript
// Persistencia
{
  name: 'montevida-theme',
  storage: createJSONStorage(() => localStorage),
}
```

**Default:** `theme: 'dark'` — el panel abre en oscuro si no hay preferencia guardada.

**No usar `window.matchMedia`** para detectar preferencia del sistema — el default fijo evita flash de color incorrecto en SSR.

---

## Server Actions

Ninguna — el tema es puramente client-side.

---

## Componentes

### `DashboardShell` — aplicar clase `.dark`

**Cambio:** El `div.admin-root` recibe condicionalmente la clase `dark`.

**Antes:**
```tsx
<div className={`admin-root ${firaCode.variable}`}>
```

**Después:**
```tsx
// DashboardShell es 'use client' — puede leer el store directamente
const theme = useThemeStore((s) => s.theme)

<div className={`admin-root ${firaCode.variable} ${theme === 'dark' ? 'dark' : ''}`}>
```

**Por qué aquí:** `admin-root` es el ancestro común de todo el panel. La variante `@custom-variant dark (&:where(.dark, .dark *))` ya definida en `globals.css` propaga el contexto dark a todos los descendientes mediante `dark:` variants de Tailwind.

---

### `AdminHeader` — botón toggle

**Cambio 1 — Botón toggle (nuevo):**

Posición: entre el botón de Bell y el de perfil, a la derecha del Bell.

```
[Burger*] [flex-1] [IGV] [Bell] [☀️/🌙 NUEVO] [| Avatar Nombre | Logout]
```

**Props del botón:**
```typescript
// Importar: Sun, Moon from 'lucide-react'
// Importar: useThemeStore from '@/store/theme'

const { theme, toggleTheme } = useThemeStore()

<motion.button
  whileTap={{ scale: 0.94 }}
  onClick={toggleTheme}
  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
  className="relative z-10 p-2 rounded-md transition-colors duration-150 {dark: variants}"
>
  {theme === 'dark'
    ? <Sun className="w-4 h-4" />
    : <Moon className="w-4 h-4" />
  }
</motion.button>
```

**Cambio 2 — dark: variants en AdminHeader (proof of concept):**

| Elemento | Clase actual | Clase con dark: variants |
|---|---|---|
| `<header>` background | `bg-slate-950/85 border-slate-800/80` | `bg-white/90 border-slate-200/80 dark:bg-slate-950/85 dark:border-slate-800/80` |
| Banner overlay div | `bg-slate-950/70` | `bg-white/60 dark:bg-slate-950/70` |
| Burger button | `text-slate-400 hover:bg-slate-800/60` | `text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60` |
| IGV toggle (inactivo) | `bg-slate-800/80 border-slate-700/80 text-slate-500 hover:text-slate-300 hover:border-slate-600` | `bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-700 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:border-slate-600` |
| Bell button | `text-slate-600 hover:bg-slate-800/50` | `text-slate-400 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-800/50` |
| Toggle button (nuevo) | — | `text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-slate-300` |
| Profile section border | `border-slate-800/80` | `border-slate-200/80 dark:border-slate-800/80` |
| Profile name | `text-slate-200` | `text-slate-800 dark:text-slate-200` |
| Profile role | `text-slate-500` | `text-slate-500 dark:text-slate-500` |
| Logout button | `text-slate-600 hover:text-red-400 hover:bg-red-400/8` | `text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:text-slate-600 dark:hover:text-red-400 dark:hover:bg-red-400/8` |

---

### `Sidebar` — dark: variants (proof of concept)

**Cambio en `admin.css` — estilos `surface-sidebar`:**

```css
/* Modo claro: fondo blanco, borde sutil */
.surface-sidebar {
  background-color: #ffffff;
  border-right-color: rgba(226, 232, 240, 0.8);   /* slate-200 */
}

/* Modo oscuro: fondo slate-950 (comportamiento actual) */
.dark .surface-sidebar {
  background-color: rgb(2, 6, 23);               /* slate-950 */
  border-right-color: rgba(30, 41, 59, 0.8);     /* slate-800 */
}
```

**Cambio en `Sidebar.tsx` — dark: variants en clases inline:**

| Elemento | Clase actual | Clase con dark: variants |
|---|---|---|
| Logo area (border-b) | `border-slate-800/80` | `border-slate-200/80 dark:border-slate-800/80` |
| Nombre del negocio | `text-slate-100` | `text-slate-900 dark:text-slate-100` |
| Rol del usuario | `text-slate-500` | `text-slate-500 dark:text-slate-500` |
| Nav link activo | `bg-violet-600/15 text-violet-300` | `bg-violet-600/10 text-violet-700 dark:bg-violet-600/15 dark:text-violet-300` |
| Barra activa lateral | `style={{ background: '#a78bfa', boxShadow: '...' }}` | Sin cambio — violet funciona en ambos modos |
| Nav link inactivo | `text-slate-400 hover:bg-slate-800/70 hover:text-slate-200` | `text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200` |
| Ícono activo | `text-violet-400` | `text-violet-600 dark:text-violet-400` |
| Ícono inactivo | `text-slate-500 group-hover:text-slate-300` | `text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300` |
| Badge stock/leads | `bg-red-500` / `bg-blue-500` | Sin cambio — colores semánticos funcionan en ambos |
| Footer (border-t) | `border-slate-800/80` | `border-slate-200/80 dark:border-slate-800/80` |
| Footer texto | `text-slate-600` | `text-slate-400 dark:text-slate-600` |

---

### `DashboardShell` — dark: variants en el layout

| Elemento | Clase actual | Clase con dark: variants |
|---|---|---|
| Wrapper principal | `bg-slate-950` | `bg-slate-50 dark:bg-slate-950` |
| `<main>` | `bg-slate-950` (heredado) | Sin clase propia — hereda del wrapper |

---

## Paleta de modo claro (referencia)

| Rol | Dark (actual) | Light (nuevo) |
|---|---|---|
| Background principal | `slate-950` (`#020617`) | `slate-50` (`#f8fafc`) |
| Surface (sidebar, cards) | `slate-900` (`#0f172a`) | `white` (`#ffffff`) |
| Borde sutil | `slate-800/80` | `slate-200/80` |
| Texto primario | `slate-100` | `slate-900` |
| Texto secundario | `slate-400` | `slate-600` |
| Texto muted | `slate-500–600` | `slate-400–500` |
| Hover background | `slate-800/70` | `slate-100` |
| Acento activo | `violet-300` (texto), `violet-600/15` (bg) | `violet-700` (texto), `violet-600/10` (bg) |

> Esta paleta aplica **solo a los 3 componentes de proof of concept**. Los demás componentes admin (tablas, formularios, modales) permanecen en dark hasta migración gradual y no muestran mal mientras `dark:` no esté definido en ellos — su fondo heredado del wrapper `bg-slate-50 dark:bg-slate-950` seguirá siendo oscuro gracias al `dark:` del wrapper.

---

## Migración gradual (fuera del scope inicial)

Los demás componentes admin se migran en iteraciones posteriores. Prioridad sugerida:

1. **P1:** Tablas (`ventas/historial`, `leads`, `clientes`, `inventario`) — impacto visual alto
2. **P2:** Formularios POS (`ventas/`) — uso frecuente
3. **P3:** Páginas restantes (`gastos`, `caja`, `reportes`, `configuracion`)

Patrón repetido para cada componente:
- `bg-slate-900` → `bg-white dark:bg-slate-900`
- `border-slate-800` → `border-slate-200 dark:border-slate-800`
- `text-slate-100` → `text-slate-900 dark:text-slate-100`
- `text-slate-400` → `text-slate-600 dark:text-slate-400`

---

## Variables de entorno requeridas

Ninguna — toggle es puramente client-side con localStorage.

---

## Reglas de negocio

- El tema se persiste en `localStorage` con key `'montevida-theme'` — sobrevive al cierre del navegador
- Default `'dark'` — el panel abre en oscuro sin preferencia guardada, sin flash
- El toggle aplica solo al panel admin (`admin-root`) — el storefront público (`site-root`) no se afecta
- Componentes admin sin `dark:` variants heredan el fondo oscuro del wrapper `dark:bg-slate-950` — no rompen visualmente
- El store no usa `window.matchMedia` — el modo sistema se ignora deliberadamente para evitar inconsistencias entre SSR e hidratación
- El ícono es Sol cuando el tema es `'dark'` (acción: pasar a claro) y Luna cuando es `'light'` (acción: pasar a oscuro)

---

## Acceptance Criteria

- [ ] `useThemeStore` existe en `src/store/theme.ts` con `theme`, `toggleTheme`, `setTheme`
- [ ] El store persiste en `localStorage` bajo key `'montevida-theme'`
- [ ] Default es `'dark'` cuando no hay valor guardado
- [ ] `DashboardShell` aplica clase `dark` al `admin-root` cuando `theme === 'dark'`
- [ ] `DashboardShell` aplica sin clase `dark` al `admin-root` cuando `theme === 'light'`
- [ ] Botón toggle en `AdminHeader` renderiza `<Sun>` cuando tema es `'dark'` y `<Moon>` cuando es `'light'`
- [ ] Clic en toggle llama `toggleTheme()` y el cambio se aplica inmediatamente sin reload
- [ ] En modo claro: header con `bg-white/90`, sidebar con `background-color: #ffffff`
- [ ] En modo oscuro: header con `bg-slate-950/85`, sidebar con `background-color: rgb(2, 6, 23)`
- [ ] Nav link activo: violeta legible en ambos modos (claro: `text-violet-700`, oscuro: `text-violet-300`)
- [ ] Nav link inactivo: contraste suficiente en ambos modos
- [ ] Toggle de tema no afecta ninguna ruta del storefront público
- [ ] Preferencia persiste al recargar la página (localStorage preservado)
- [ ] Preferencia persiste al cerrar y reabrir el navegador
- [ ] Componentes admin sin `dark:` variants (tablas, formularios) no rompen visualmente en modo claro — su contenido queda sobre el fondo oscuro heredado del wrapper `dark:bg-slate-950`
- [ ] Sin flash de color incorrecto en SSR/hidratación (default `'dark'` previene mismatch)
