interface Props {
  label: string
  value: number
  compact?: boolean
}

function valueColor(v: number) {
  if (v >= 85) return { text: 'text-green-600', stroke: 'stroke-green-500' }
  if (v >= 70) return { text: 'text-yellow-600', stroke: 'stroke-yellow-500' }
  return { text: 'text-red-600', stroke: 'stroke-red-500' }
}

export default function KpiCard({ label, value, compact = false }: Readonly<Props>) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - value / 100)
  const { text, stroke } = valueColor(value)
  const svgSize = compact ? 'h-11 w-11' : 'h-14 w-14'
  const numSize = compact ? 'text-lg' : 'text-2xl'

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <svg viewBox="0 0 48 48" className={`${svgSize} -rotate-90`}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          className={stroke}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-bold leading-none ${text} ${numSize}`}>{value}%</span>
      <span className="text-center text-xs font-medium text-slate-500">{label}</span>
    </div>
  )
}
