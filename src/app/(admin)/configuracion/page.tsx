import { redirect } from 'next/navigation'
import { getProfile, getConfiguracion } from '@/lib/dal'
import { listUsers } from '@/app/(admin)/configuracion/actions'
import { ConfiguracionClient } from '@/configuracion/components/ConfiguracionClient'

export default async function ConfiguracionPage() {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/ventas')

  const [config, usersResult] = await Promise.all([
    getConfiguracion(),
    listUsers(),
  ])

  if (!config) redirect('/admin')

  return (
    <ConfiguracionClient
      config={config}
      users={usersResult.data ?? []}
      currentUserId={profile.id}
    />
  )
}
