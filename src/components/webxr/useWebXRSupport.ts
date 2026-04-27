'use client'

import { useEffect, useState } from 'react'

export type WebXRSupport = 'checking' | 'supported' | 'unsupported'

/**
 * Detecta si el navegador soporta WebXR immersive-ar.
 * - 'checking'    → consultando navigator.xr (estado inicial)
 * - 'supported'   → API presente y immersive-ar disponible
 * - 'unsupported' → API ausente o sesión no soportada
 */
export function useWebXRSupport(): WebXRSupport {
  const [support, setSupport] = useState<WebXRSupport>('checking')

  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr
    if (!xr || typeof xr.isSessionSupported !== 'function') {
      setSupport('unsupported')
      return
    }
    xr.isSessionSupported('immersive-ar')
      .then((ok) => setSupport(ok ? 'supported' : 'unsupported'))
      .catch(() => setSupport('unsupported'))
  }, [])

  return support
}
