import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMachine, MACHINE_CODES } from '@/data/machines'
import WebXRScene from '@/components/webxr/WebXRScene'

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
    title: `${machine.codigo} — AR Interactivo`,
    description: `Vista WebXR con paneles informativos para ${machine.codigo}.`,
  }
}

export default function MaquinaArPage({
  params,
}: Readonly<{ params: { codigo: string } }>) {
  const machine = getMachine(params.codigo)
  if (!machine) notFound()
  return <WebXRScene machine={machine} />
}
