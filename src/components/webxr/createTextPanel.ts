import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import type { MachineData } from '@/types'

const COLOR_HEX: Record<string, string> = {
  AZ: '#1d4ed8',
  RO: '#dc2626',
  NE: '#0f172a',
  VE: '#15803d',
  AM: '#ca8a04',
  BL: '#e2e8f0',
}

function colorOf(codigoColor: string): string {
  return COLOR_HEX[codigoColor.split('-')[0]] ?? '#94a3b8'
}

interface PanelOptions {
  worldWidth?: number   // metros
  worldHeight?: number  // metros
}

/**
 * Genera un Mesh con un Canvas 2D que muestra los datos operativos
 * de la máquina. El panel se dibuja como textura sobre un PlaneGeometry.
 */
export function createTextPanel(machine: MachineData, opts: PanelOptions = {}): Mesh {
  const W = 1024
  const H = 768
  const ww = opts.worldWidth ?? 0.6
  const wh = opts.worldHeight ?? 0.45

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo obtener contexto Canvas 2D')

  /* Fondo */
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'
  ctx.fillRect(0, 0, W, H)

  /* Borde exterior */
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, W - 6, H - 6)

  /* Header — código + status pill */
  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 72px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(machine.codigo, 36, 90)

  const statusW = 240
  const statusH = 56
  const statusX = W - statusW - 36
  const statusY = 38
  ctx.fillStyle = statusColor(machine.estado)
  roundRect(ctx, statusX, statusY, statusW, statusH, 28)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(machine.estado, statusX + statusW / 2, statusY + 36)

  /* Color block */
  ctx.fillStyle = colorOf(machine.codigoColor)
  roundRect(ctx, 36, 130, 88, 88, 12)
  ctx.fill()

  ctx.fillStyle = '#e2e8f0'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(machine.codigoColor, 144, 168)
  ctx.font = '26px sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(machine.descripcionColor, 144, 204)

  /* Grid de datos — 2 columnas */
  drawCell(ctx, 36, 256, 'Partida', `#${machine.partida}`, '#fff', true)
  drawCell(ctx, 540, 256, 'Función', machine.funcionActual, '#fff', false)

  drawCell(ctx, 36, 348, 'Operario', machine.operario, '#fff', false)

  const tempColor = machine.temperaturaActual > 85 ? '#ef4444' : '#fff'
  drawCell(ctx, 36, 440, 'Temperatura', `${machine.temperaturaActual} °C`, tempColor, false)
  drawCell(ctx, 540, 440, 'Bomba / Molinete', `${machine.velocidadBomba} rpm · ${machine.velocidadMolinete} m/min`, '#fff', false)

  /* Barra de progreso */
  ctx.fillStyle = '#94a3b8'
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`Progreso · Tratamiento ${machine.numeroTratamiento}`, 36, 600)

  const barX = 36
  const barY = 620
  const barW = W - 72
  const barH = 64

  ctx.fillStyle = '#334155'
  roundRect(ctx, barX, barY, barW, barH, 12)
  ctx.fill()

  const filled = (barW * Math.max(0, Math.min(100, machine.progreso))) / 100
  if (filled > 0) {
    ctx.fillStyle = '#3b82f6'
    roundRect(ctx, barX, barY, filled, barH, 12)
    ctx.fill()
  }

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${machine.progreso}%`, W / 2, barY + 44)

  /* Footer */
  ctx.fillStyle = '#64748b'
  ctx.font = '18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Tintorería Industrial · Vista AR', W / 2, H - 16)

  /* → Mesh con CanvasTexture */
  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 8
  const geometry = new PlaneGeometry(ww, wh)
  const material = new MeshBasicMaterial({ map: texture, transparent: true })
  return new Mesh(geometry, material)
}

/* ── Helpers privados ──────────────────────────────────────────────────── */

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  valueColor: string,
  monospace: boolean,
) {
  ctx.fillStyle = '#94a3b8'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label.toUpperCase(), x, y)

  ctx.fillStyle = valueColor
  ctx.font = monospace ? 'bold 32px monospace' : 'bold 28px sans-serif'
  ctx.fillText(value, x, y + 38)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function statusColor(estado: string): string {
  switch (estado) {
    case 'En Proceso':    return 'rgba(37, 99, 235, 0.9)'
    case 'Finalizando':   return 'rgba(34, 197, 94, 0.9)'
    case 'Detenida':      return 'rgba(239, 68, 68, 0.9)'
    case 'Mantenimiento': return 'rgba(234, 179, 8, 0.9)'
    default:              return 'rgba(100, 116, 139, 0.9)'
  }
}
