import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mensaje enviado',
  robots: { index: false, follow: false },
}

export default function CorreoEnviadoPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-dark mb-3">Â¡Mensaje enviado!</h1>
        <p className="text-body mb-8">
          Recibimos tu consulta. Te responderemos a la brevedad al email que nos dejaste.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
