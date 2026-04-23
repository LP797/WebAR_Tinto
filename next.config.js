/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  /*
   * MIME types para dev server (bun dev).
   * En producción (Cloudflare Pages) los headers se manejan desde public/_headers.
   * Nota: Next.js 14 ignora headers() cuando output='export', solo aplica en dev.
   */
  async headers() {
    return [
      {
        source: '/models/:file*.usdz',
        headers: [
          { key: 'Content-Type', value: 'model/vnd.usdz+zip' },
        ],
      },
      {
        source: '/models/:file*.glb',
        headers: [
          { key: 'Content-Type', value: 'model/gltf-binary' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
