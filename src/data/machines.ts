import type { MachineData } from '@/types'

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export const MACHINES: Record<string, MachineData> = {
  'TIN-001': {
    codigo: 'TIN-001',
    partida: '348271',
    codigoColor: 'AZ-204',
    descripcionColor: 'Azul Marino',
    temperaturaActual: 65,
    velocidadBomba: 1200,
    velocidadMolinete: 38,
    numeroTratamiento: 4,
    funcionActual: 'Dosificación',
    operario: 'Carlos Méndez',
    progreso: 25,
    estado: 'En Proceso',
    kpis: {
      oee: 78,
      disponibilidad: 92,
      rendimiento: 85,
      calidad: 99,
    },
    modelGlb: '/models/dyeing-machine.glb',
    modelUsdz: '/models/dyeing-machine.usdz',
  },
  'TIN-002': {
    codigo: 'TIN-002',
    partida: '512904',
    codigoColor: 'RO-118',
    descripcionColor: 'Rojo Carmesí',
    temperaturaActual: 82,
    velocidadBomba: 1450,
    velocidadMolinete: 42,
    numeroTratamiento: 7,
    funcionActual: 'Calentar',
    operario: 'Ana Torres',
    progreso: 68,
    estado: 'En Proceso',
    kpis: {
      oee: 85,
      disponibilidad: 94,
      rendimiento: 90,
      calidad: 99,
    },
    modelGlb: '/models/dyeing-machine.glb',
    modelUsdz: '/models/dyeing-machine.usdz',
  },
  'TIN-003': {
    codigo: 'TIN-003',
    partida: '667183',
    codigoColor: 'NE-050',
    descripcionColor: 'Negro Intenso',
    temperaturaActual: 95,
    velocidadBomba: 1380,
    velocidadMolinete: 35,
    numeroTratamiento: 9,
    funcionActual: 'Enfriar',
    operario: 'Miguel Rodríguez',
    progreso: 91,
    estado: 'Finalizando',
    kpis: {
      oee: 91,
      disponibilidad: 96,
      rendimiento: 95,
      calidad: 99,
    },
    modelGlb: '/models/dyeing-machine.glb',
    modelUsdz: '/models/dyeing-machine.usdz',
  },
}

export const MACHINE_CODES = Object.keys(MACHINES)

export function getMachine(codigo: string): MachineData | undefined {
  return MACHINES[codigo]
}
