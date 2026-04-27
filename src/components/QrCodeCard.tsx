'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { BASE_URL } from '@/data/machines'

export type QrVariant = 'standard' | 'ar'

interface Props {
  codigo: string
  variant?: QrVariant
}

const VARIANT_META: Record<QrVariant, { suffix: string; label: string; pillClass: string }> = {
  standard: {
    suffix: '',
    label: 'Vista estándar',
    pillClass: 'bg-slate-100 text-slate-700',
  },
  ar: {
    suffix: '/ar',
    label: 'AR Interactivo',
    pillClass: 'bg-blue-100 text-brand-800',
  },
}

export default function QrCodeCard({ codigo, variant = 'standard' }: Readonly<Props>) {
  const [baseUrl, setBaseUrl] = useState(BASE_URL)

  useEffect(() => {
    setBaseUrl(globalThis.location.origin)
  }, [])

  const meta = VARIANT_META[variant]
  const url = `${baseUrl}/maquina/${codigo}${meta.suffix}`

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd"
                d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5C10.41 3 11.25 3.84 11.25 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375C12.75 3.839 13.59 3 14.625 3h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 010 1.5h-.75A.75.75 0 016 6.75zm10.5 0a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zM3 14.625C3 13.589 3.84 12.75 4.875 12.75h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zm3-3a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zm3-6a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zM6 15.375A.75.75 0 016.75 15h.75a.75.75 0 010 1.5h-.75A.75.75 0 016 15.375z"
                clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500">Máquina</p>
            <p className="font-mono text-lg font-bold text-slate-900">{codigo}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.pillClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <QRCode
          value={url}
          size={180}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
        />
      </div>

      <div className="w-full rounded-lg bg-slate-50 px-3 py-2 text-center">
        <p className="break-all font-mono text-xs text-slate-600">{url}</p>
      </div>

      <p className="text-center text-xs text-slate-400">
        Imprima este QR y fíjelo en la máquina {codigo}
      </p>
    </div>
  )
}
