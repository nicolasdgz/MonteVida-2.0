'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Settings,
  ShoppingBag,
  Users,
  X,
  Vault,
  Truck,
} from 'lucide-react'
import type { UserRole, Configuracion } from '@/types/database'
import Image from 'next/image'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Ventas',       href: '/ventas',          icon: ShoppingCart },
  { label: 'Clientes',     href: '/clientes',        icon: Users },
  { label: 'Inventario',   href: '/inventario',      icon: Package },
  { label: 'Caja',         href: '/caja',            icon: Vault },
  { label: 'Mercadería',   href: '/mercaderia',      icon: Truck,      adminOnly: true },
  { label: 'Gastos',       href: '/gastos',          icon: Receipt,    adminOnly: true },
  { label: 'Reportes',     href: '/reportes',        icon: BarChart3,  adminOnly: true },
  { label: 'Configuración',href: '/configuracion',   icon: Settings,   adminOnly: true },
]

interface SidebarProps {
  role: UserRole
  config: Configuracion | null
  stockAlertCount?: number
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ role, config, stockAlertCount = 0, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        {config?.logo_url ? (
          <div className="w-8 h-8 relative rounded-lg overflow-hidden shrink-0">
            <Image src={config.logo_url} alt="Logo" fill className="object-contain" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(145deg, #428743, #2F6534)', boxShadow: '0 0 8px rgba(66,135,67,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sidebar-foreground text-sm truncate leading-tight tracking-[-0.02em]">
            {config?.nombre_negocio ?? 'Punto Click'}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
        </div>
        {/* Botón cerrar en mobile */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="ml-auto lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-primary/8 hover:text-primary'
              }`}
            >
              {isActive && (
                <>
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary/10 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                  <motion.div
                    layoutId="active-nav-bar"
                    className="active-nav-bar absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                </>
              )}
              <Icon className={`w-4 h-4 shrink-0 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
              <span className="relative z-10 tracking-[-0.01em]">{item.label}</span>
              {item.href === '/inventario' && stockAlertCount > 0 ? (
                <span className="ml-auto relative z-10 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {stockAlertCount > 99 ? '99+' : stockAlertCount}
                </span>
              ) : isActive ? (
                <div className="ml-auto w-1 h-1 rounded-full bg-primary/60 relative z-10" />
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground text-center tabular-nums">
          {config?.moneda ?? 'PEN'} · IGV {config?.igv_porcentaje ?? 18}%
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="surface-sidebar hidden lg:flex w-52 border-r border-border flex-col h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="surface-sidebar fixed left-0 top-0 h-full w-52 border-r border-border z-50 lg:hidden flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
