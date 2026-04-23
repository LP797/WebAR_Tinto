'use client'

import { useEffect, useRef, useState } from 'react'

/* ── TypeScript declaration for the model-viewer web component ────────────── */
interface ModelViewerAttributes extends React.HTMLAttributes<HTMLElement> {
  src?: string
  'ios-src'?: string
  alt?: string
  ar?: ''
  'ar-modes'?: string
  'camera-controls'?: ''
  'auto-rotate'?: ''
  'camera-orbit'?: string
  'min-camera-orbit'?: string
  'max-camera-orbit'?: string
  'field-of-view'?: string
  'shadow-intensity'?: string
  exposure?: string
  loading?: 'auto' | 'lazy' | 'eager'
  poster?: string
  style?: React.CSSProperties
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<ModelViewerAttributes, HTMLElement>
    }
  }
}

/* ── Component ────────────────────────────────────────────────────────────── */

interface Props {
  glbSrc: string
  usdzSrc?: string
  alt: string
  cameraOrbit?: string
}

function ViewerSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-800">
      <svg className="h-16 w-16 animate-pulse text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
      <p className="text-sm text-slate-500">Cargando visor 3D...</p>
    </div>
  )
}

function ModelFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-slate-800 px-6 text-center">
      <svg className="h-16 w-16 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-slate-300">Modelo no disponible</p>
        <p className="mt-1 text-xs text-slate-500">
          Coloque el archivo GLB en{' '}
          <code className="rounded bg-slate-700 px-1 py-0.5 text-slate-300">
            /public/models/dyeing-machine.glb
          </code>
        </p>
      </div>
    </div>
  )
}

export default function ModelViewer({ glbSrc, usdzSrc, alt, cameraOrbit = '0deg 75deg 500%' }: Readonly<Props>) {
  const [mounted, setMounted] = useState(false)
  const [modelError, setModelError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  /* Attach error listener after mount so we detect missing GLB files */
  useEffect(() => {
    if (!mounted || !containerRef.current) return
    const viewer = containerRef.current.querySelector('model-viewer')
    if (!viewer) return
    const handleError = () => setModelError(true)
    viewer.addEventListener('error', handleError)
    return () => viewer.removeEventListener('error', handleError)
  }, [mounted])

  if (!mounted) return <ViewerSkeleton />
  if (modelError) return <ModelFallback />

  return (
    <div ref={containerRef} className="h-full w-full">
      <model-viewer
        src={glbSrc}
        {...(usdzSrc ? { 'ios-src': usdzSrc } : {})}
        alt={alt}
        ar=""
        ar-modes="webxr scene-viewer quick-look"
        camera-controls=""
        auto-rotate=""
        camera-orbit={cameraOrbit}
        field-of-view="20deg"
        min-camera-orbit="auto auto 200%"
        max-camera-orbit="auto auto 1000%"
        shadow-intensity="1"
        exposure="0.85"
        loading="lazy"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
