'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { MachineData } from '@/types'
import { useWebXRSupport } from './useWebXRSupport'
import { createTextPanel } from './createTextPanel'
import { createKpiPanel } from './createKpiPanel'

/* ── Configuración escala/posición ────────────────────────────────────── */
const TARGET_MODEL_SIZE = 0.6     // metros — tamaño objetivo del modelo en su dimensión mayor
const MODEL_DISTANCE = 1.5        // metros — distancia inicial frente al usuario
const PIVOT_DROP = 0.25           // bajar levemente respecto a la cámara
const MIN_SCALE = 0.2
const MAX_SCALE = 4.0

type Phase = 'pre' | 'launching' | 'in-session' | 'error'

interface SceneState {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  modelGroup: THREE.Group       // contenedor general (posicionado en mundo)
  innerModel: THREE.Group       // modelo 3D rotable/escalable por gestos
  panels: THREE.Mesh[]
  positioned: { current: boolean }
  cleanup: () => void
}

interface Props {
  machine: MachineData
}

export default function WebXRScene({ machine }: Readonly<Props>) {
  const support = useWebXRSupport()
  const [phase, setPhase] = useState<Phase>('pre')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SceneState | null>(null)

  /* ── Orientación correcta del panel hacia la cámara (sin espejado) ─── */
  const billboard = (() => {
    const fwd = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3()
    const newUp = new THREE.Vector3()
    const m = new THREE.Matrix4()
    return (panel: THREE.Object3D, panelWorld: THREE.Vector3, camWorld: THREE.Vector3) => {
      fwd.subVectors(camWorld, panelWorld).normalize()
      right.crossVectors(up, fwd)
      if (right.lengthSq() < 0.0001) right.set(1, 0, 0)
      else right.normalize()
      newUp.crossVectors(fwd, right).normalize()
      m.makeBasis(right, newUp, fwd)
      panel.quaternion.setFromRotationMatrix(m)
    }
  })()

  /* ── Posicionar el modelGroup frente a la cámara ────────────────────── */
  const placeInFrontOfCamera = (camera: THREE.Camera, group: THREE.Group) => {
    const camPos = new THREE.Vector3()
    const camDir = new THREE.Vector3()
    camera.getWorldPosition(camPos)
    camera.getWorldDirection(camDir)
    // dirección horizontal — ignorar componente Y para evitar inclinación
    camDir.y = 0
    if (camDir.lengthSq() < 0.0001) camDir.set(0, 0, -1)
    else camDir.normalize()
    group.position.copy(camPos).addScaledVector(camDir, MODEL_DISTANCE)
    group.position.y -= PIVOT_DROP
  }

  /* ── Iniciar sesión AR ─────────────────────────────────────────────── */
  const startAR = async () => {
    if (!overlayRef.current) return
    setPhase('launching')
    setErrorMsg(null)

    try {
      const xr = (navigator as Navigator & { xr?: XRSystem }).xr
      if (!xr) throw new Error('WebXR no disponible')

      const ok = await xr.isSessionSupported('immersive-ar')
      if (!ok) throw new Error('Sesión immersive-ar no soportada')

      /* Three.js setup */
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.xr.enabled = true
      overlayRef.current.appendChild(renderer.domElement)

      /* Iluminación */
      scene.add(new THREE.AmbientLight(0xffffff, 1.0))
      const dir = new THREE.DirectionalLight(0xffffff, 1.4)
      dir.position.set(1, 2, 1)
      scene.add(dir)

      /* Jerarquía:
         modelGroup (posicionado en mundo)
         ├── innerModel (rota/escala con gestos)
         │   └── gltf.scene (centrado y normalizado)
         ├── mainPanel (billboard)
         └── kpis (billboard)
      */
      const modelGroup = new THREE.Group()
      scene.add(modelGroup)

      const innerModel = new THREE.Group()
      modelGroup.add(innerModel)

      /* Carga + auto-escalado */
      const loader = new GLTFLoader()
      loader.load(
        '/models/dyeing-machine.glb',
        (gltf) => {
          const obj = gltf.scene
          // Centrar en bounding box
          const box = new THREE.Box3().setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          obj.position.sub(center)
          // Auto-escalar para que su dimensión mayor sea TARGET_MODEL_SIZE
          const maxDim = Math.max(size.x, size.y, size.z, 0.001)
          const autoScale = TARGET_MODEL_SIZE / maxDim
          innerModel.scale.setScalar(autoScale)
          innerModel.add(obj)
        },
        undefined,
        (err) => console.error('GLB load failed:', err),
      )

      /* Paneles */
      const mainPanel = createTextPanel(machine)
      mainPanel.position.set(0, TARGET_MODEL_SIZE * 0.85, 0)
      modelGroup.add(mainPanel)

      const kpiOEE = createKpiPanel({ label: 'OEE', value: machine.kpis.oee })
      kpiOEE.position.set(-0.55, 0.1, 0)
      modelGroup.add(kpiOEE)

      const kpiRendimiento = createKpiPanel({ label: 'Rendimiento', value: machine.kpis.rendimiento })
      kpiRendimiento.position.set(0.55, 0.18, 0)
      modelGroup.add(kpiRendimiento)

      const kpiCalidad = createKpiPanel({ label: 'Calidad', value: machine.kpis.calidad })
      kpiCalidad.position.set(0.55, -0.12, 0)
      modelGroup.add(kpiCalidad)

      const panels = [mainPanel, kpiOEE, kpiRendimiento, kpiCalidad]
      const positioned = { current: false }

      /* Gestos: rotar con un dedo, escalar con dos dedos */
      let touchLastX = 0
      let touchStartDist = 0
      let touchStartScale = 1

      const isUiTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) return false
        return target.closest('[data-xr-ui]') !== null
      }

      const onTouchStart = (e: TouchEvent) => {
        if (isUiTarget(e.target)) return
        if (e.touches.length === 1) {
          touchLastX = e.touches[0].clientX
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          touchStartDist = Math.hypot(dx, dy)
          touchStartScale = innerModel.scale.x
        }
      }
      const onTouchMove = (e: TouchEvent) => {
        if (isUiTarget(e.target)) return
        if (e.touches.length === 1) {
          const dx = e.touches[0].clientX - touchLastX
          innerModel.rotation.y += dx * 0.008
          touchLastX = e.touches[0].clientX
          e.preventDefault()
        } else if (e.touches.length === 2 && touchStartDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const dist = Math.hypot(dx, dy)
          const ratio = dist / touchStartDist
          const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchStartScale * ratio))
          innerModel.scale.setScalar(next)
          e.preventDefault()
        }
      }

      const overlayEl = overlayRef.current
      overlayEl.addEventListener('touchstart', onTouchStart, { passive: true })
      overlayEl.addEventListener('touchmove', onTouchMove, { passive: false })

      /* Loop de render con billboard + posicionamiento inicial */
      const camWorldPos = new THREE.Vector3()
      const panelWorldPos = new THREE.Vector3()

      renderer.setAnimationLoop(() => {
        const xrCam = renderer.xr.getCamera()
        if (!positioned.current && renderer.xr.isPresenting) {
          placeInFrontOfCamera(xrCam, modelGroup)
          positioned.current = true
        }
        xrCam.getWorldPosition(camWorldPos)
        for (const panel of panels) {
          panel.getWorldPosition(panelWorldPos)
          billboard(panel, panelWorldPos, camWorldPos)
        }
        renderer.render(scene, camera)
      })

      /* Resize */
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      /* Solicitar sesión AR con dom-overlay */
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: [],
        optionalFeatures: ['local-floor', 'dom-overlay'],
        domOverlay: { root: overlayRef.current },
      } as XRSessionInit)

      session.addEventListener('end', () => {
        setPhase('pre')
      })

      await renderer.xr.setSession(session)
      setPhase('in-session')

      /* Guardar estado para recentrado y cleanup */
      sceneRef.current = {
        renderer,
        scene,
        camera,
        modelGroup,
        innerModel,
        panels,
        positioned,
        cleanup: () => {
          overlayEl.removeEventListener('touchstart', onTouchStart)
          overlayEl.removeEventListener('touchmove', onTouchMove)
          window.removeEventListener('resize', onResize)
          renderer.setAnimationLoop(null)
          const activeSession = renderer.xr.getSession()
          if (activeSession) {
            activeSession.end().catch(() => undefined)
          }
          renderer.dispose()
          if (overlayRef.current?.contains(renderer.domElement)) {
            overlayRef.current.removeChild(renderer.domElement)
          }
          for (const p of panels) {
            p.geometry.dispose()
            const mat = p.material as THREE.MeshBasicMaterial
            mat.map?.dispose()
            mat.dispose()
          }
        },
      }
    } catch (err) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al iniciar AR.')
      setPhase('error')
      if (sceneRef.current) {
        sceneRef.current.cleanup()
        sceneRef.current = null
      }
    }
  }

  /* ── Recentrar ──────────────────────────────────────────────────────── */
  const recenter = () => {
    const state = sceneRef.current
    if (!state) return
    const xrCam = state.renderer.xr.getCamera()
    placeInFrontOfCamera(xrCam, state.modelGroup)
    state.innerModel.rotation.set(0, 0, 0)
  }

  /* ── Reset escala (zoom out a tamaño objetivo) ──────────────────────── */
  const resetScale = () => {
    const state = sceneRef.current
    if (!state) return
    // Forzar al usuario a regresar a la escala "natural" auto-calculada
    // recargando el bounding box del primer hijo
    const inner = state.innerModel
    const child = inner.children[0]
    if (!child) return
    inner.scale.set(1, 1, 1)
    const box = new THREE.Box3().setFromObject(child)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    inner.scale.setScalar(TARGET_MODEL_SIZE / maxDim)
  }

  /* ── Cleanup al desmontar ───────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        sceneRef.current.cleanup()
        sceneRef.current = null
      }
    }
  }, [])

  /* ── Render UI ──────────────────────────────────────────────────────── */

  // Overlay siempre montado para que dom-overlay funcione
  const overlay = (
    <div
      ref={overlayRef}
      className={
        phase === 'in-session'
          ? 'fixed inset-0 z-50 touch-none'
          : 'pointer-events-none fixed inset-0 -z-10 opacity-0'
      }
    >
      {phase === 'in-session' && (
        <div
          data-xr-ui
          className="absolute bottom-6 left-1/2 z-[60] flex -translate-x-1/2 gap-3"
        >
          <button
            onClick={recenter}
            className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-800 active:scale-95 transition-all"
          >
            Recentrar
          </button>
          <button
            onClick={resetScale}
            className="rounded-xl bg-slate-800/90 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
          >
            Tamaño 1×
          </button>
        </div>
      )}
      {phase === 'in-session' && (
        <div
          data-xr-ui
          className="pointer-events-none absolute top-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900/70 px-4 py-1.5 text-xs text-slate-200"
        >
          Arrastra para rotar · Pellizca para escalar
        </div>
      )}
    </div>
  )

  if (support === 'checking') {
    return (
      <>
        {overlay}
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Verificando soporte WebXR...</p>
        </div>
      </>
    )
  }

  if (support === 'unsupported') {
    return (
      <>
        {overlay}
        <FallbackUnsupported codigo={machine.codigo} />
      </>
    )
  }

  if (phase === 'error') {
    return (
      <>
        {overlay}
        <ErrorScreen
          codigo={machine.codigo}
          message={errorMsg ?? 'Error al iniciar la sesión AR.'}
          onRetry={() => {
            setErrorMsg(null)
            setPhase('pre')
          }}
        />
      </>
    )
  }

  if (phase === 'launching') {
    return (
      <>
        {overlay}
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Iniciando sesión AR...</p>
        </div>
      </>
    )
  }

  return (
    <>
      {overlay}
      {phase === 'pre' && <PreLaunchScreen machine={machine} onStart={startAR} />}
    </>
  )
}

/* ── Pantallas auxiliares ───────────────────────────────────────────────── */

function PreLaunchScreen({
  machine,
  onStart,
}: Readonly<{ machine: MachineData; onStart: () => void }>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AR Interactivo</p>
        <h1 className="mt-1 font-mono text-2xl font-bold text-slate-900">{machine.codigo}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {machine.codigoColor} · {machine.descripcionColor}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          Esta vista usa <strong className="font-semibold text-slate-800">WebXR</strong> para
          mostrar el modelo 3D y paneles informativos directamente dentro de la escena AR.
        </p>

        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-900">
            Apunta la cámara hacia un piso o superficie despejada antes de iniciar.
          </p>
        </div>

        <ul className="mt-4 space-y-1 text-xs text-slate-500">
          <li>· El modelo aparecerá frente a ti al iniciar</li>
          <li>· Arrastra con un dedo para rotarlo</li>
          <li>· Pellizca con dos dedos para escalarlo</li>
          <li>· Usa &quot;Recentrar&quot; si pierdes el modelo de vista</li>
        </ul>

        <button
          onClick={onStart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 active:scale-95 transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          Entrar a AR interactivo
        </button>

        <Link
          href={`/maquina/${machine.codigo}`}
          className="mt-3 block w-full rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Volver a vista estándar
        </Link>
      </div>
    </main>
  )
}

function FallbackUnsupported({ codigo }: Readonly<{ codigo: string }>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
        <svg className="h-8 w-8 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-slate-900">AR interactivo no disponible</h1>
      <p className="mt-3 max-w-xs text-sm text-slate-600">
        Este dispositivo o navegador no soporta <strong>WebXR immersive-ar</strong>.
        Para esta máquina puedes usar la vista 3D estándar con AR del sistema operativo.
      </p>
      <Link
        href={`/maquina/${codigo}`}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
      >
        Volver a vista estándar
      </Link>
      <p className="mt-4 text-xs text-slate-400">
        WebXR está soportado en Chrome para Android,
        Meta Browser (Quest), Safari en visionOS y otros navegadores AR-ready.
      </p>
    </main>
  )
}

function ErrorScreen({
  codigo,
  message,
  onRetry,
}: Readonly<{ codigo: string; message: string; onRetry: () => void }>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-slate-900">No se pudo iniciar AR</h1>
      <p className="mt-3 max-w-xs text-sm text-slate-600 break-words">{message}</p>
      <div className="mt-7 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onRetry}
          className="rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          Reintentar
        </button>
        <Link
          href={`/maquina/${codigo}`}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Volver a vista estándar
        </Link>
      </div>
    </main>
  )
}
