'use client'

import { Toaster } from 'react-hot-toast'
import { AuthSync } from './AuthSync'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthSync />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: '#1C274C', color: '#fff', borderRadius: '8px' },
          success: { iconTheme: { primary: '#428743', secondary: '#fff' } },
          error: { iconTheme: { primary: '#F23030', secondary: '#fff' } },
        }}
      />
    </>
  )
}
