'use client'

import { useAuthStore } from '@/store/auth'

export function useAuth() {
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)

  return {
    profile,
    isLoading,
    isAuthenticated: !!profile,
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'staff',
    isCustomer: profile?.role === 'customer',
    isAdminOrStaff: profile?.role === 'admin' || profile?.role === 'staff',
  }
}
