import type { Metadata } from 'next'
import Link from 'next/link'
import { MACHINES } from '@/data/machines'
import MachineCard from '@/components/MachineCard'

export const metadata: Metadata = {
  title: 'Panel de Máquinas',
}

export default function HomePage() {
  const machines = Object.values(MACHINES)

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd"
                d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
                clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tintorería Industrial</h1>
            <p className="text-sm text-slate-500">Monitor de Máquinas — WebAR</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Escanee el código QR de la máquina para acceder a sus datos en tiempo real y la vista 3D/AR.
        </p>
        <Link
          href="/qr"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-brand-700 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM9 9a1 1 0 000 2h1a1 1 0 100-2H9zM9 13a1 1 0 000 2h1a1 1 0 100-2H9zM13 9a1 1 0 100 2h3a1 1 0 100-2h-3zM13 13a1 1 0 000 2h1a1 1 0 100-2h-1zM16 13a1 1 0 100 2h1a1 1 0 100-2h-1z" clipRule="evenodd" />
          </svg>
          Ver códigos QR
        </Link>
      </header>

      <section className="flex flex-col gap-4">
        {machines.map((machine) => (
          <MachineCard key={machine.codigo} machine={machine} />
        ))}
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        <p>Sistema WebAR · Nettalco Industrial</p>
        <p className="mt-1">Datos de demostración</p>
      </footer>
    </main>
  )
}
