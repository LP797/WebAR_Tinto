import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMachine, MACHINE_CODES } from '@/data/machines'
import StatusBadge from '@/components/StatusBadge'
import ProgressBar from '@/components/ProgressBar'
import KpiCard from '@/components/KpiCard'
import ModelViewer from '@/components/ModelViewer'

export function generateStaticParams() {
  return MACHINE_CODES.map((codigo) => ({ codigo }))
}

export async function generateMetadata({
  params,
}: {
  params: { codigo: string }
}): Promise<Metadata> {
  const machine = getMachine(params.codigo)
  if (!machine) return { title: 'Máquina no encontrada' }
  return {
    title: `${machine.codigo} — ${machine.descripcionColor}`,
    description: `Partida ${machine.partida} · ${machine.funcionActual} · Operario: ${machine.operario}`,
  }
}

const COLOR_HEX: Record<string, string> = {
  AZ: '#1d4ed8',
  RO: '#dc2626',
  NE: '#0f172a',
  VE: '#15803d',
  AM: '#ca8a04',
  BL: '#e2e8f0',
}

const FUNCION_STYLES: Record<string, string> = {
  Dosificación: 'bg-purple-100 text-purple-800',
  Calentar:     'bg-red-100 text-red-800',
  Enfriar:      'bg-cyan-100 text-cyan-800',
  Lavado:       'bg-blue-100 text-blue-800',
  Enjuague:     'bg-teal-100 text-teal-800',
}

export default function MaquinaPage({ params }: Readonly<{ params: { codigo: string } }>) {
  const machine = getMachine(params.codigo)
  if (!machine) notFound()

  const swatchColor = COLOR_HEX[machine.codigoColor.split('-')[0]] ?? '#94a3b8'
  const tempAlert = machine.temperaturaActual > 85
  const funcionStyle = FUNCION_STYLES[machine.funcionActual] ?? 'bg-slate-100 text-slate-700'

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── ZONA 1: Nav sticky ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
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
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 leading-none">Máquina</p>
            <h1 className="font-mono text-lg font-bold leading-tight text-slate-900 truncate">
              {machine.codigo}
            </h1>
          </div>
          <StatusBadge estado={machine.estado} />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-3">

        {/* ── ZONA 2: Hero card ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          {/* Fila 1: color + partida */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="h-12 w-12 flex-shrink-0 rounded-xl shadow-sm"
              style={{ backgroundColor: swatchColor }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">
                {machine.codigoColor}
                <span className="mx-1.5 text-slate-300">·</span>
                {machine.descripcionColor}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Partida{' '}
                <span className="font-mono font-semibold text-slate-700">
                  #{machine.partida}
                </span>
              </p>
            </div>
          </div>

          {/* Fila 2: función + tratamiento + operario */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${funcionStyle}`}>
              {machine.funcionActual}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Trat. {machine.numeroTratamiento}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {machine.operario}
            </span>
          </div>

          {/* Fila 3: parámetros inline */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-sm">
            <span className={tempAlert ? 'font-semibold text-red-600' : 'text-slate-700'}>
              {tempAlert && <span className="mr-0.5">⚠</span>}
              {machine.temperaturaActual}°C
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">{machine.velocidadBomba} rpm</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">{machine.velocidadMolinete} m/min</span>
          </div>

          {/* Progreso */}
          <ProgressBar
            value={machine.progreso}
            label={`Tratamiento ${machine.numeroTratamiento}`}
          />
        </section>

        {/* ── ZONA 3: Visor 3D / AR ─────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl shadow-sm">
          <div className="h-80 bg-slate-900 sm:h-[26rem]">
            <ModelViewer
              glbSrc={machine.modelGlb}
              usdzSrc={machine.modelUsdz}
              alt={`Modelo 3D de ${machine.codigo}`}
            />
          </div>
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5">
            <p className="text-center text-xs text-slate-500">
              Toque el ícono AR para ver la máquina en su espacio físico
            </p>
          </div>
        </section>

        {/* ── ZONA 4: KPIs secundarios ──────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            KPIs de Eficiencia
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiCard label="OEE" value={machine.kpis.oee} compact />
            <KpiCard label="Disponibilidad" value={machine.kpis.disponibilidad} compact />
            <KpiCard label="Rendimiento" value={machine.kpis.rendimiento} compact />
            <KpiCard label="Calidad" value={machine.kpis.calidad} compact />
          </div>
        </section>

      </main>
    </div>
  )
}
