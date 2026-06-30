import type { Metadata } from 'next';
import { Lora, Raleway } from 'next/font/google';
import ClientProviders from "./ClientProviders";
import './site.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.montevida.pe'),
  title: {
    template: '%s | Montevida',
    default: 'Montevida | Suplementos y Productos Naturales',
  },
  description: 'Descubre los mejores suplementos y productos naturales en Montevida. Calidad, bienestar y salud en cada gota.',
  keywords: ['suplementos', 'natural', 'salud', 'bienestar', 'montevida', 'vitaminas', 'peru'],
  authors: [{ name: 'Montevida' }],
  openGraph: {
    title: 'Montevida | Suplementos y Productos Naturales',
    description: 'Descubre los mejores suplementos y productos naturales en Montevida. Calidad, bienestar y salud.',
    url: 'https://www.montevida.pe',
    siteName: 'Montevida',
    images: [
      {
        url: '/images/logo/LogoOficial-MonteVida-va.png',
        width: 800,
        height: 600,
        alt: 'Logo Montevida',
      },
    ],
    locale: 'es_PE',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`site-root ${lora.variable} ${raleway.variable}`}>
      <ClientProviders>{children}</ClientProviders>
    </div>
  );
}
