import type { MachineStatus } from '@/types'

const STYLES: Record<MachineStatus, { badge: string; dot: string }> = {
  'En Proceso':    { badge: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  'Finalizando':   { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  'Detenida':      { badge: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500' },
  'Mantenimiento': { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
}

export default function StatusBadge({ estado }: Readonly<{ estado: MachineStatus }>) {
  const { badge, dot } = STYLES[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {estado}
    </span>
  )
}
