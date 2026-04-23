import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Tintorería Industrial',
    default: 'Tintorería Industrial — Monitor de Máquinas',
  },
  description: 'Sistema WebAR de monitoreo de máquinas de tintorería industrial.',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
        {children}
        {/*
          model-viewer web component. type="module" es obligatorio — es un ES module.
          strategy="afterInteractive" carga después de la hidratación, evitando errores SSR.
        */}
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
