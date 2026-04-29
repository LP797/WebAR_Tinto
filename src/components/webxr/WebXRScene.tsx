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
  modelGroup: THREE.Group        // contenedor general (posicionado en mundo)
  innerModel: THREE.Group        // modelo 3D rotable/escalable por gestos
  panels: THREE.Mesh[]
  defaultPanelPos: THREE.Vector3[]  // posiciones por defecto para Restablecer
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

  /* ── Orientación correcta del panel hacia la cámara (sin espejado).
        Compensa la rotación del padre (importante cuando un panel
        está temporalmente attachado a un controller VR). ─── */
  const billboard = (() => {
    const fwd = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3()
    const newUp = new THREE.Vector3()
    const m = new THREE.Matrix4()
    const targetWorldQuat = new THREE.Quaternion()
    const parentWorldQuat = new THREE.Quaternion()
    return (panel: THREE.Object3D, panelWorld: THREE.Vector3, camWorld: THREE.Vector3) => {
      fwd.subVectors(camWorld, panelWorld).normalize()
      right.crossVectors(up, fwd)
      if (right.lengthSq() < 0.0001) right.set(1, 0, 0)
      else right.normalize()
      newUp.crossVectors(fwd, right).normalize()
      m.makeBasis(right, newUp, fwd)
      targetWorldQuat.setFromRotationMatrix(m)
      if (panel.parent) {
        panel.parent.getWorldQuaternion(parentWorldQuat).invert()
        panel.quaternion.copy(parentWorldQuat).multiply(targetWorldQuat)
      } else {
        panel.quaternion.copy(targetWorldQuat)
      }
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

      /* Paneles — layout simétrico: principal arriba, 3 KPIs en fila debajo */
      const mainPanel = createTextPanel(machine)
      mainPanel.position.set(0, 0.55, 0)
      modelGroup.add(mainPanel)

      const kpiOEE = createKpiPanel({ label: 'OEE', value: machine.kpis.oee })
      kpiOEE.position.set(-0.42, -0.5, 0)
      modelGroup.add(kpiOEE)

      const kpiRendimiento = createKpiPanel({ label: 'Rendimiento', value: machine.kpis.rendimiento })
      kpiRendimiento.position.set(0, -0.5, 0)
      modelGroup.add(kpiRendimiento)

      const kpiCalidad = createKpiPanel({ label: 'Calidad', value: machine.kpis.calidad })
      kpiCalidad.position.set(0.42, -0.5, 0)
      modelGroup.add(kpiCalidad)

      const panels = [mainPanel, kpiOEE, kpiRendimiento, kpiCalidad]
      const defaultPanelPos = panels.map((p) => p.position.clone())
      const positioned = { current: false }

      /* ── WebXR Controllers (Meta Quest, Vision Pro, etc.) ───────────
         Cada control tiene un rayo láser visible. Trigger (select):
         - Si el rayo apunta a un panel: agarra ese panel
         - Si apunta al modelo: agarra el modelGroup completo
         - Soltar trigger: el objeto vuelve a su parent original */
      const controller1 = renderer.xr.getController(0)
      const controller2 = renderer.xr.getController(1)
      scene.add(controller1)
      scene.add(controller2)

      const rayGeo = new THREE.BufferGeometry()
      rayGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -3], 3),
      )
      const rayMat = new THREE.LineBasicMaterial({ color: 0x4080ff, transparent: true, opacity: 0.7 })
      const ray1 = new THREE.Line(rayGeo, rayMat)
      const ray2 = new THREE.Line(rayGeo, rayMat)
      controller1.add(ray1)
      controller2.add(ray2)

      const controllerMatrix = new THREE.Matrix4()
      const controllerRaycaster = new THREE.Raycaster()

      const raycastFromController = (controller: THREE.Object3D) => {
        controllerMatrix.identity().extractRotation(controller.matrixWorld)
        controllerRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
        controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(controllerMatrix)
      }

      const onControllerSelectStart = (event: { target: THREE.Object3D }) => {
        const controller = event.target
        raycastFromController(controller)
        // Prioridad: paneles
        const panelHits = controllerRaycaster.intersectObjects(panels, false)
        let target: THREE.Object3D | null = null
        if (panelHits.length > 0) {
          target = panelHits[0].object
        } else {
          // Probar contra el modelo (recursivo)
          const modelHits = controllerRaycaster.intersectObject(innerModel, true)
          if (modelHits.length > 0) {
            target = modelGroup
          }
        }
        if (target) {
          controller.userData.selected = target
          controller.userData.originalParent = target.parent
          // attach() preserva la posición/rotación mundial al cambiar de padre
          controller.attach(target)
        }
      }

      const onControllerSelectEnd = (event: { target: THREE.Object3D }) => {
        const controller = event.target
        const target = controller.userData.selected as THREE.Object3D | undefined
        const original = controller.userData.originalParent as THREE.Object3D | undefined
        if (target && original) {
          original.attach(target)
        }
        controller.userData.selected = undefined
        controller.userData.originalParent = undefined
      }

      controller1.addEventListener('selectstart', onControllerSelectStart)
      controller1.addEventListener('selectend', onControllerSelectEnd)
      controller2.addEventListener('selectstart', onControllerSelectStart)
      controller2.addEventListener('selectend', onControllerSelectEnd)

      /* Gestos:
         - 1 dedo sobre un panel: arrastra ese panel
         - 1 dedo en espacio libre: rota todo el conjunto
         - 2 dedos: escala solo el modelo (paneles mantienen tamaño legible) */
      let mode: 'idle' | 'rotate' | 'panPanel' | 'pinch' = 'idle'
      let draggedPanel: THREE.Mesh | null = null
      let touchLastX = 0
      let touchStartDist = 0
      let touchStartScale = 1

      const raycaster = new THREE.Raycaster()
      const ndc = new THREE.Vector2()
      const dragPlane = new THREE.Plane()
      const dragOffset = new THREE.Vector3()
      const tmpHit = new THREE.Vector3()
      const tmpVec = new THREE.Vector3()

      const setNdcFromTouch = (t: Touch) => {
        ndc.x = (t.clientX / window.innerWidth) * 2 - 1
        ndc.y = -(t.clientY / window.innerHeight) * 2 + 1
      }

      const isUiTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) return false
        return target.closest('[data-xr-ui]') !== null
      }

      const onTouchStart = (e: TouchEvent) => {
        if (isUiTarget(e.target)) return
        if (e.touches.length === 1) {
          setNdcFromTouch(e.touches[0])
          const xrCam = renderer.xr.getCamera()
          raycaster.setFromCamera(ndc, xrCam)
          const hits = raycaster.intersectObjects(panels, false)
          if (hits.length > 0) {
            // Drag panel mode — define plano frente a cámara que pasa por el hit
            draggedPanel = hits[0].object as THREE.Mesh
            mode = 'panPanel'
            xrCam.getWorldPosition(tmpVec)
            const planeNormal = new THREE.Vector3().subVectors(tmpVec, hits[0].point).normalize()
            dragPlane.setFromNormalAndCoplanarPoint(planeNormal, hits[0].point)
            // Offset entre punto tocado y centro del panel (mundo)
            const panelWorld = new THREE.Vector3()
            draggedPanel.getWorldPosition(panelWorld)
            dragOffset.subVectors(hits[0].point, panelWorld)
          } else {
            // Rotate mode
            mode = 'rotate'
            touchLastX = e.touches[0].clientX
          }
        } else if (e.touches.length === 2) {
          mode = 'pinch'
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          touchStartDist = Math.hypot(dx, dy)
          touchStartScale = innerModel.scale.x
        }
      }

      const onTouchMove = (e: TouchEvent) => {
        if (isUiTarget(e.target)) return
        if (mode === 'panPanel' && draggedPanel && e.touches.length === 1) {
          setNdcFromTouch(e.touches[0])
          const xrCam = renderer.xr.getCamera()
          raycaster.setFromCamera(ndc, xrCam)
          if (raycaster.ray.intersectPlane(dragPlane, tmpHit)) {
            // tmpHit = posición mundo donde el rayo cruza el plano
            // posición mundo del panel = tmpHit - offset
            tmpHit.sub(dragOffset)
            // Convertir a espacio local del modelGroup
            modelGroup.worldToLocal(tmpHit)
            draggedPanel.position.copy(tmpHit)
          }
          e.preventDefault()
        } else if (mode === 'rotate' && e.touches.length === 1) {
          const dx = e.touches[0].clientX - touchLastX
          modelGroup.rotation.y += dx * 0.008
          touchLastX = e.touches[0].clientX
          e.preventDefault()
        } else if (mode === 'pinch' && e.touches.length === 2 && touchStartDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const dist = Math.hypot(dx, dy)
          const ratio = dist / touchStartDist
          const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchStartScale * ratio))
          innerModel.scale.setScalar(next)
          e.preventDefault()
        }
      }

      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length === 0) {
          mode = 'idle'
          draggedPanel = null
        }
      }

      const overlayEl = overlayRef.current
      overlayEl.addEventListener('touchstart', onTouchStart, { passive: true })
      overlayEl.addEventListener('touchmove', onTouchMove, { passive: false })
      overlayEl.addEventListener('touchend', onTouchEnd, { passive: true })
      overlayEl.addEventListener('touchcancel', onTouchEnd, { passive: true })

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
        defaultPanelPos,
        positioned,
        cleanup: () => {
          overlayEl.removeEventListener('touchstart', onTouchStart)
          overlayEl.removeEventListener('touchmove', onTouchMove)
          overlayEl.removeEventListener('touchend', onTouchEnd)
          overlayEl.removeEventListener('touchcancel', onTouchEnd)
          controller1.removeEventListener('selectstart', onControllerSelectStart)
          controller1.removeEventListener('selectend', onControllerSelectEnd)
          controller2.removeEventListener('selectstart', onControllerSelectStart)
          controller2.removeEventListener('selectend', onControllerSelectEnd)
          rayGeo.dispose()
          rayMat.dispose()
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
    state.modelGroup.rotation.set(0, 0, 0)
    state.innerModel.rotation.set(0, 0, 0)
    placeInFrontOfCamera(xrCam, state.modelGroup)
  }

  /* ── Restablecer paneles y escala (preserva posición y rotación) ───── */
  const restoreLayout = () => {
    const state = sceneRef.current
    if (!state) return
    // Paneles a posiciones por defecto
    for (let i = 0; i < state.panels.length; i++) {
      state.panels[i].position.copy(state.defaultPanelPos[i])
    }
    // Escala del modelo a auto-computada
    const inner = state.innerModel
    const child = inner.children[0]
    if (child) {
      inner.scale.set(1, 1, 1)
      const box = new THREE.Box3().setFromObject(child)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z, 0.001)
      inner.scale.setScalar(TARGET_MODEL_SIZE / maxDim)
    }
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
            onClick={restoreLayout}
            className="rounded-xl bg-slate-800/90 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
          >
            Restablecer
          </button>
        </div>
      )}
      {phase === 'in-session' && (
        <div
          data-xr-ui
          className="pointer-events-none absolute top-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900/70 px-4 py-1.5 text-xs text-slate-200"
        >
          Móvil: arrastra panel/modelo · Pellizca para escalar · VR: trigger sobre panel/modelo para agarrarlo
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
          <li>
            <strong className="font-semibold text-slate-700">Móvil:</strong>{' '}
            arrastra paneles para moverlos · fuera de paneles para rotar · pellizca para escalar
          </li>
          <li>
            <strong className="font-semibold text-slate-700">VR (Quest, Vision Pro):</strong>{' '}
            apunta con el control y mantén el trigger para agarrar paneles o el modelo
          </li>
          <li>· &quot;Recentrar&quot; o &quot;Restablecer&quot; si quieres reiniciar</li>
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
