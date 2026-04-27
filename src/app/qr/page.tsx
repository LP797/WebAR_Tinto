import type { Metadata } from 'next'
import Link from 'next/link'
import { MACHINE_CODES } from '@/data/machines'
import QrCodeCard from '@/components/QrCodeCard'
import PrintButton from '@/components/PrintButton'

export const metadata: Metadata = {
  title: 'Códigos QR de Máquinas',
}

export default function QrPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm no-print">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="Volver al panel"
            className="flex items-center gap-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z"
                clipRule="evenodd" />
            </svg>
          </Link>
          <div className="flex-1">
            <p className="text-xs text-slate-400">Sistema</p>
            <h1 className="text-lg font-bold leading-none text-slate-900">Códigos QR</h1>
          </div>
          <PrintButton />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-10">
        <p className="text-sm text-slate-600 no-print">
          Imprima los códigos QR y fíjelos en cada máquina de tintorería.
          Cada máquina tiene <strong>dos QR</strong>: el de la vista estándar y el de la vista AR interactiva.
        </p>

        {/* ── Sección 1: Vista estándar ─────────────────────────── */}
        <section>
          <header className="mb-4 flex items-baseline gap-3">
            <h2 className="text-lg font-bold text-slate-900">Vista estándar</h2>
            <p className="text-xs text-slate-500">model-viewer + AR del sistema</p>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MACHINE_CODES.map((codigo) => (
              <QrCodeCard key={`std-${codigo}`} codigo={codigo} variant="standard" />
            ))}
          </div>
        </section>

        {/* ── Sección 2: AR Interactivo (WebXR) ─────────────────── */}
        <section>
          <header className="mb-4 flex items-baseline gap-3">
            <h2 className="text-lg font-bold text-slate-900">AR interactivo</h2>
            <p className="text-xs text-slate-500">WebXR · paneles flotantes en la escena</p>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MACHINE_CODES.map((codigo) => (
              <QrCodeCard key={`ar-${codigo}`} codigo={codigo} variant="ar" />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
