import Link from 'next/link'
import type { MachineData } from '@/types'
import StatusBadge from './StatusBadge'
import ProgressBar from './ProgressBar'

const COLOR_MAP: Record<string, string> = {
  AZ: '#1d4ed8',
  RO: '#dc2626',
  NE: '#0f172a',
  VE: '#15803d',
  AM: '#ca8a04',
  BL: '#e2e8f0',
}

function colorSwatch(codigoColor: string): string {
  const prefix = codigoColor.split('-')[0]
  return COLOR_MAP[prefix] ?? '#94a3b8'
}

export default function MachineCard({ machine }: Readonly<{ machine: MachineData }>) {
  return (
    <Link
      href={`/maquina/${machine.codigo}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Máquina</p>
          <h2 className="mt-0.5 font-mono text-xl font-bold text-slate-900">{machine.codigo}</h2>
        </div>
        <StatusBadge estado={machine.estado} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-9 w-9 flex-shrink-0 rounded-lg shadow-inner"
          style={{ backgroundColor: colorSwatch(machine.codigoColor) }}
        />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {machine.codigoColor} — {machine.descripcionColor}
          </p>
          <p className="text-xs text-slate-500">Partida #{machine.partida}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-base font-bold text-slate-900">{machine.temperaturaActual}°C</p>
          <p className="text-xs text-slate-500">Temperatura</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-base font-bold text-slate-900">{machine.velocidadBomba}</p>
          <p className="text-xs text-slate-500">rpm Bomba</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-base font-bold text-slate-900">{machine.velocidadMolinete}</p>
          <p className="text-xs text-slate-500">m/min</p>
        </div>
      </div>

      <ProgressBar value={machine.progreso} label={`Trat. ${machine.numeroTratamiento} — ${machine.funcionActual}`} />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Operario: <span className="font-medium text-slate-700">{machine.operario}</span>
        </span>
        <span className="text-xs font-semibold text-brand-700">OEE {machine.kpis.oee}%</span>
      </div>
    </Link>
  )
}
