# WebAR Tintorería Industrial

Demo WebAR para monitoreo de máquinas de tintorería. Accede escaneando el QR de la máquina.

## Requisitos

- [Bun](https://bun.sh) >= 1.0
- Node >= 18 (usado internamente por Next.js)

```bash
# Instalar Bun (si no está instalado)
curl -fsSL https://bun.sh/install | bash
```

## Instalación y desarrollo local

```bash
bun install
bun dev
```

Páginas disponibles:

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000` | Home — lista de máquinas |
| `http://localhost:3000/maquina/TIN-001` | Datos + visor 3D/AR de TIN-001 |
| `http://localhost:3000/maquina/TIN-002` | Datos + visor 3D/AR de TIN-002 |
| `http://localhost:3000/maquina/TIN-003` | Datos + visor 3D/AR de TIN-003 |
| `http://localhost:3000/qr` | Códigos QR para imprimir |

## Build y verificación estática

```bash
bun run build        # genera carpeta out/
bunx serve out       # sirve el build en http://localhost:3000
```

## Probar AR en celular (local)

AR requiere HTTPS. Use ngrok para exponer el servidor local:

```bash
# Terminal 1: servidor de desarrollo
bun dev

# Terminal 2: túnel HTTPS
bunx ngrok http 3000

# Abrir en celular la URL https://xxxx.ngrok.io/maquina/TIN-001
```

> **Nota:** el botón AR solo aparece en Android con ARCore o iPhone con soporte AR Quick Look.
> En dispositivos sin AR, el visor 3D interactivo sigue funcionando normalmente.

## Despliegue en Cloudflare Pages

1. Suba el código a un repositorio GitHub o GitLab.
2. En Cloudflare Pages → **Create a project** → Connect to Git → seleccione el repositorio.
3. Configure el build:

| Campo | Valor |
|-------|-------|
| Build command | `bun run build` |
| Build output directory | `out` |
| Variable de entorno | `NODE_VERSION` = `20` |
| Variable de entorno | `NEXT_PUBLIC_BASE_URL` = `https://su-dominio.pages.dev` |

4. Click en **Save and Deploy**. Cada push a `main` dispara un nuevo deploy.

## Modelo 3D

El proyecto está configurado para cargar `/public/models/dyeing-machine.glb`.

### Modelo de referencia
El modelo industrial de referencia está en: [https://skfb.ly/prvNL](https://skfb.ly/prvNL)  
(de pago — licencia Royalty Free, autor: 32cm en Sketchfab/Fab)

### Para integrar el modelo real

```
1. Comprar y descargar el GLB desde Sketchfab/Fab
2. Copiar a:  public/models/dyeing-machine.glb   ← obligatorio
3. (Opcional) Para AR en iPhone — convertir a USDZ:
   - Reality Converter (macOS, gratuito de Apple) u herramienta equivalente
   - Copiar como: public/models/dyeing-machine.usdz
4. Si el archivo es muy pesado, optimizar:
   bunx gltf-transform optimize dyeing-machine.glb dyeing-machine.opt.glb
```

Sin el archivo GLB, el visor muestra un fallback visual con instrucciones.

### Placeholder para desarrollo

Use cualquier GLB industrial libre de derechos, por ejemplo:
- [Industrial Machine por jimbogies (Sketchfab)](https://sketchfab.com/3d-models/industrial-machine-40cd1d22f6bd40dd904e37faf0c214d8)
- TurboSquid Free — buscar "industrial machine free GLB"

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # Script CDN model-viewer
│   ├── page.tsx                # Home
│   ├── not-found.tsx           # 404
│   ├── qr/page.tsx             # Códigos QR
│   └── maquina/[codigo]/page.tsx
├── components/
│   ├── ModelViewer.tsx         # Visor 3D/AR (client component)
│   ├── QrCodeCard.tsx          # QR (client component)
│   ├── MachineCard.tsx         # Tarjeta en home
│   ├── KpiCard.tsx             # Círculo KPI
│   ├── ProgressBar.tsx         # Barra de progreso
│   ├── StatusBadge.tsx         # Pill de estado
│   └── PrintButton.tsx         # Botón imprimir
├── data/
│   └── machines.ts             # Mock data TIN-001/002/003
└── types/
    └── index.ts                # Interfaces TypeScript
```

## Datos mock

Los datos de las 3 máquinas están en `src/data/machines.ts`.
Para actualizar valores, editar ese archivo directamente — no hay base de datos.

## Máquinas disponibles

| Código | Color | Operario | Estado |
|--------|-------|----------|--------|
| TIN-001 | AZ-204 Azul Marino | Carlos Méndez | En Proceso |
| TIN-002 | RO-118 Rojo Carmesí | Ana Torres | En Proceso |
| TIN-003 | NE-050 Negro Intenso | Miguel Rodríguez | Finalizando |
