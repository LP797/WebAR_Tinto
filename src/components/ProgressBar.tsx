interface Props {
  value: number
  label?: string
}

export default function ProgressBar({ value, label }: Readonly<Props>) {
  const pct = Math.max(0, Math.min(100, value))
  const color =
    pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-brand-700' : 'bg-yellow-500'

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-500">{label}</span>
          <span className="font-semibold text-slate-700">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
