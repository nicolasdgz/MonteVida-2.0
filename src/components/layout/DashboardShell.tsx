'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { AdminHeader } from './AdminHeader'
import { ConfigSync } from './ConfigSync'
import { useThemeStore } from '@/store/theme'
import type { Profile, Configuracion } from '@/types/database'

interface DashboardShellProps {
  profile: Profile | null
  config: Configuracion | null
  stockAlertCount?: number
  children: React.ReactNode
}

export function DashboardShell({ profile, config, stockAlertCount = 0, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = useThemeStore((s) => s.theme)

  return (
    <div className={`admin-root${theme === 'dark' ? ' dark' : ''}`}>
      {config && <ConfigSync config={config} />}

      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          role={profile?.role ?? 'staff'}
          config={config}
          stockAlertCount={stockAlertCount}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader
            profile={profile}
            config={config}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
