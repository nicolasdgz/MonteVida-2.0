'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, Bell, LogOut, Eye, EyeOff, User, Sun, Moon } from 'lucide-react'
import { useConfiguracion } from '@/store/configuracion'
import { useThemeStore } from '@/store/theme'
import { signOut } from '@/app/(auth)/iniciar-sesion/actions'
import Image from 'next/image'
import type { Profile, Configuracion } from '@/types/database'

interface HeaderProps {
  profile: Profile | null
  config: Configuracion | null
  onMenuClick: () => void
}

export function AdminHeader({ profile, config, onMenuClick }: HeaderProps) {
  const showIgv     = useConfiguracion((s) => s.showIgv)
  const toggleIgv   = useConfiguracion((s) => s.toggleIgv)
  const { theme, toggleTheme } = useThemeStore()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/iniciar-sesion')
  }

  return (
    <header
      className="sticky top-0 z-30 h-13 flex items-center gap-2 px-4 border-b border-border bg-background/90 backdrop-blur-md"
      style={
        config?.banner_url
          ? { backgroundImage: `url(${config.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {/* Overlay sobre banner */}
      {config?.banner_url && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      )}

      {/* Burger mobile */}
      <button
        onClick={onMenuClick}
        className="relative z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1 relative z-10" />

      {/* Toggle IGV */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => toggleIgv()}
        className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
          showIgv
            ? 'bg-primary/10 border border-primary/25 text-primary hover:bg-primary/15'
            : 'bg-muted shadow-sm border-0 text-muted-foreground hover:text-primary'
        }`}
      >
        {showIgv ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        IGV {showIgv ? 'ON' : 'OFF'}
      </motion.button>

      {/* Notificaciones placeholder */}
      <button className="relative z-10 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150">
        <Bell className="w-4 h-4" />
      </button>

      {/* Toggle tema Sol/Luna */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="relative z-10 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </motion.button>

      {/* Perfil + logout */}
      <div className="relative z-10 flex items-center gap-2 pl-2 border-l border-border">
        <div className="flex items-center gap-2">
          {profile?.avatar_url ? (
            <div className="w-7 h-7 relative rounded-lg overflow-hidden ring-1 ring-border">
              <Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center ring-1 ring-border/50">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-foreground leading-tight tracking-[-0.01em]">{profile?.full_name}</p>
            <p className="text-[11px] text-muted-foreground capitalize leading-tight">{profile?.role}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
