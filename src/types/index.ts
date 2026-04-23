export type MachineStatus = 'En Proceso' | 'Finalizando' | 'Detenida' | 'Mantenimiento'

export type FuncionActual =
  | 'Dosificación'
  | 'Calentar'
  | 'Enfriar'
  | 'Lavado'
  | 'Enjuague'

export interface MachineKPIs {
  oee: number
  disponibilidad: number
  rendimiento: number
  calidad: number
}

export interface MachineData {
  codigo: string
  partida: string
  codigoColor: string
  descripcionColor: string
  temperaturaActual: number
  velocidadBomba: number
  velocidadMolinete: number
  numeroTratamiento: number
  funcionActual: FuncionActual
  operario: string
  progreso: number
  estado: MachineStatus
  kpis: MachineKPIs
  modelGlb: string
  modelUsdz?: string
}
