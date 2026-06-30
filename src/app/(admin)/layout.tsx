import { getProfile, getConfiguracion } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Fira_Code } from 'next/font/google'
import './admin.css'

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono-data',
  display: 'swap',
})

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, config, supabase] = await Promise.all([getProfile(), getConfiguracion(), createClient()])

  const { data: stockData } = await supabase.from('products').select('stock, stock_minimo').eq('activo', true)

  const stockAlertCount = ((stockData ?? []) as { stock: number; stock_minimo: number }[])
    .filter((p) => p.stock <= p.stock_minimo).length

  return (
    <div className={firaCode.variable}>
      <DashboardShell
        profile={profile}
        config={config}
        stockAlertCount={stockAlertCount}
      >
        {children}
      </DashboardShell>
    </div>
  )
}
