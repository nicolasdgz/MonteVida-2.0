'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, Image as ImageIcon, X, ShieldCheck, User } from 'lucide-react'
import { UsuarioModal } from './UsuarioModal'
import { actualizarConfiguracion, deleteUser, cambiarContrasena } from '@/app/(admin)/configuracion/actions'
import toast from 'react-hot-toast'
import type { Configuracion, UserRole } from '@/types/database'

interface UserRow {
  id: string
  email: string
  full_name: string
  role: UserRole
}

interface Props {
  config: Configuracion
  users: UserRow[]
  currentUserId: string
}

const ROLE_STYLE: Record<UserRole, string> = {
  admin: 'bg-primary/15 text-primary border-primary/20',
  staff: 'bg-muted text-muted-foreground border-border',
  customer: 'bg-green-500/15 text-green-400 border-green-500/20',
}

export function ConfiguracionClient({ config, users: initial, currentUserId }: Props) {
  const router = useRouter()

  // Branding form state
  const [nombreNegocio, setNombreNegocio]           = useState(config.nombre_negocio)
  const [igvPct, setIgvPct]                         = useState(String(config.igv_porcentaje))
  const [emailNotificaciones, setEmailNotif]        = useState(config.email_notificaciones ?? '')
  const [logoFile, setLogoFile]           = useState<File | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string | null>(null)
  const [bannerFile, setBannerFile]       = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const logoRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  // Users state
  const [users, setUsers]             = useState(initial)
  const [modalOpen, setModalOpen]     = useState(false)
  const [eliminandoId, setEliminando] = useState<string | null>(null)

  // Cambiar contraseña state
  const [passActual, setPassActual]   = useState('')
  const [passNueva, setPassNueva]     = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [passError, setPassError]     = useState<string | null>(null)
  const [passOk, setPassOk]           = useState(false)
  const [isPendingPass, startPass]    = useTransition()

  function handleCambiarPass() {
    setPassError(null); setPassOk(false)
    if (passNueva !== passConfirm) { setPassError('Las contraseñas nuevas no coinciden.'); return }
    if (passNueva.length < 8) { setPassError('Mínimo 8 caracteres.'); return }
    startPass(async () => {
      const result = await cambiarContrasena(passActual, passNueva)
      if (result.error) { setPassError(result.error); return }
      setPassOk(true)
      setPassActual(''); setPassNueva(''); setPassConfirm('')
    })
  }

  function handleLogoFile(file: File | null) {
    setLogoFile(file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }
  function handleBannerFile(file: File | null) {
    setBannerFile(file)
    setBannerPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSaveConfig() {
    setSaving(true)
    const fd = new FormData()
    fd.append('nombre_negocio', nombreNegocio)
    fd.append('igv_porcentaje', igvPct)
    fd.append('email_notificaciones', emailNotificaciones)
    if (logoFile)   fd.append('logo', logoFile)
    if (bannerFile) fd.append('banner', bannerFile)

    const result = await actualizarConfiguracion(fd)
    setSaving(false)

    if (result.error) { toast.error(result.error); return }
    toast.success('Configuración guardada.')
    setLogoFile(null); setLogoPreview(null)
    setBannerFile(null); setBannerPreview(null)
    router.refresh()
  }

  async function handleDeleteUser(id: string) {
    setEliminando(id)
    const result = await deleteUser(id)
    setEliminando(null)
    if (result.error) { toast.error(result.error); return }
    setUsers((prev) => prev.filter((u) => u.id !== id))
    toast.success('Usuario eliminado.')
  }

  function handleUserCreated(user: UserRow) {
    setUsers((prev) => [...prev, user])
  }

  const currentLogo   = logoPreview   ?? config.logo_url
  const currentBanner = bannerPreview ?? config.banner_url

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Branding y gestión de usuarios</p>
      </div>

      {/* Config sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Datos del negocio */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Datos del negocio</h2>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre del negocio</label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">IGV (%)</label>
            <input
              type="number"
              value={igvPct}
              onChange={(e) => setIgvPct(e.target.value)}
              min="0"
              max="100"
              step="0.01"
              className="input-field"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usado en el cálculo de subtotal, IGV y total de ventas
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Email para notificaciones
            </label>
            <input
              type="email"
              value={emailNotificaciones}
              onChange={(e) => setEmailNotif(e.target.value)}
              placeholder="admin@montevida.pe"
              className="input-field"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recibe un email cada vez que llega un nuevo pedido desde la tienda online
            </p>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Branding</h2>

          {/* Logo */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {currentLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-muted-foreground transition-colors"
                >
                  {currentLogo ? 'Reemplazar' : 'Subir logo'}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => handleLogoFile(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Banner del encabezado</label>
            {currentBanner ? (
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentBanner} alt="Banner" className="w-full h-24 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => bannerRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-black/30 dark:bg-black/60 text-xs text-foreground hover:text-white transition-colors"
                  >
                    Reemplazar
                  </button>
                  {bannerPreview && (
                    <button
                      type="button"
                      onClick={() => handleBannerFile(null)}
                      className="p-1 rounded-lg bg-black/30 dark:bg-black/60 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">Subir imagen de banner</span>
              </button>
            )}
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleBannerFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
      </div>

      {/* Save config button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary/20"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar cambios'}
        </button>
      </div>

      {/* Usuarios */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Usuarios del sistema</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo usuario
          </button>
        </div>

        <div className="divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-primary/8 transition-colors group">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-foreground">
                  {u.full_name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground truncate">{u.full_name}</p>
                  {u.id === currentUserId && (
                    <span className="text-xs text-muted-foreground">(tú)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>

              {/* Role badge */}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 flex items-center gap-1 ${ROLE_STYLE[u.role]}`}>
                {u.role === 'admin'
                  ? <><ShieldCheck className="w-3 h-3" /> Admin</>
                  : <><User className="w-3 h-3" /> Staff</>
                }
              </span>

              {/* Delete */}
              <button
                onClick={() => handleDeleteUser(u.id)}
                disabled={eliminandoId === u.id || u.id === currentUserId}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-0"
              >
                {eliminandoId === u.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Seguridad — cambiar contraseña */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-md">
        <h2 className="text-sm font-semibold text-foreground">Seguridad</h2>

        <div className="space-y-3">
          {[
            { id: 'pass_actual',  label: 'Contraseña actual',  val: passActual,  set: setPassActual },
            { id: 'pass_nueva',   label: 'Nueva contraseña',   val: passNueva,   set: setPassNueva },
            { id: 'pass_confirm', label: 'Confirmar nueva',    val: passConfirm, set: setPassConfirm },
          ].map(({ id, label, val, set }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-xs text-muted-foreground mb-1">{label}</label>
              <input
                id={id} type="password" value={val} autoComplete="new-password"
                onChange={(e) => { set(e.target.value); setPassError(null); setPassOk(false) }}
                className="input-field w-full text-sm"
                placeholder="••••••••"
              />
            </div>
          ))}
        </div>

        {passError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{passError}</p>
        )}
        {passOk && (
          <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">Contraseña actualizada correctamente.</p>
        )}

        <button
          onClick={handleCambiarPass}
          disabled={isPendingPass || !passActual || !passNueva || !passConfirm}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isPendingPass && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isPendingPass ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>

      <UsuarioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleUserCreated}
      />
    </div>
  )
}
