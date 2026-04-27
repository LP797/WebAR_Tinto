import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'

interface KpiOptions {
  label: string
  value: number          // 0-100
  worldSize?: number     // metros (panel cuadrado)
}

/**
 * Genera un Mesh cuadrado con un KPI: ring circular + valor + label.
 * El color del ring varía: verde >=85, amarillo >=70, rojo <70.
 */
export function createKpiPanel(opts: KpiOptions): Mesh {
  const W = 384
  const H = 384
  const ws = opts.worldSize ?? 0.18

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo obtener contexto Canvas 2D')

  /* Fondo */
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'
  ctx.fillRect(0, 0, W, H)

  /* Borde */
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)

  /* Ring */
  const cx = W / 2
  const cy = H / 2 - 30
  const r = 100
  const v = Math.max(0, Math.min(100, opts.value))

  ctx.lineWidth = 22
  ctx.lineCap = 'round'

  // Track gris
  ctx.strokeStyle = '#334155'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Fill según valor
  if (v > 0) {
    ctx.strokeStyle = ringColor(v)
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * v) / 100)
    ctx.stroke()
  }

  /* Valor centrado */
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 60px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${v}%`, cx, cy + 4)

  /* Label */
  ctx.fillStyle = '#94a3b8'
  ctx.font = 'bold 28px sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(opts.label, cx, H - 38)

  /* → Mesh */
  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 8
  const geometry = new PlaneGeometry(ws, ws)
  const material = new MeshBasicMaterial({ map: texture, transparent: true })
  return new Mesh(geometry, material)
}

function ringColor(v: number): string {
  if (v >= 85) return '#22c55e'
  if (v >= 70) return '#eab308'
  return '#ef4444'
}
