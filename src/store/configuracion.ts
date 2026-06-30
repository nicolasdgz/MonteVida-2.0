import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Configuracion } from '@/types/database'

interface ConfiguracionState {
  data: Configuracion | null
  showIgv: boolean

  setConfiguracion: (config: Configuracion) => void
  toggleIgv: () => void
  setShowIgv: (value: boolean) => void
}

export const useConfiguracion = create<ConfiguracionState>()(
  persist(
    (set) => ({
      data: null,
      showIgv: true,

      setConfiguracion: (config) => set({ data: config }),
      toggleIgv: () => set((state) => ({ showIgv: !state.showIgv })),
      setShowIgv: (showIgv) => set({ showIgv }),
    }),
    {
      name: 'configuracion',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
