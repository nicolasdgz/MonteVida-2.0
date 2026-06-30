'use client'

import { useEffect } from 'react'
import { useConfiguracion } from '@/store/configuracion'
import type { Configuracion } from '@/types/database'

export function ConfigSync({ config }: { config: Configuracion }) {
  const setConfiguracion = useConfiguracion((s) => s.setConfiguracion)

  useEffect(() => {
    setConfiguracion(config)
  }, [config, setConfiguracion])

  return null
}
