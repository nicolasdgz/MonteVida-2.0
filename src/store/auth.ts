import { create } from 'zustand'
import type { Profile } from '@/types/database'

interface AuthState {
  profile: Profile | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  clearProfile: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile, isLoading: false }),
  clearProfile: () => set({ profile: null, isLoading: false }),
}))
