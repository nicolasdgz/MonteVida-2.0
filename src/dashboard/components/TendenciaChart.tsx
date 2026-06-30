'use client'

import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { formatearMonto } from '@/utils/igv'

interface DiaData {
  fecha: string
  total: number
}

interface Props {
  data: DiaData[]
}

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-neu-sm dark:shadow-xl">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label ? formatFecha(label) : ''}</p>
      <p className="text-sm font-semibold text-primary dark:text-emerald-400 tabular-nums">{formatearMonto(payload[0].value)}</p>
    </div>
  )
}

export function TendenciaChart({ data }: Props) {
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
        Sin datos para el período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#428743" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#428743" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="rgba(0,0,0,0.05)"
        />
        <XAxis
          dataKey="fecha"
          tickFormatter={formatFecha}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => (maxVal >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(66,135,67,0.3)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#428743"
          strokeWidth={2}
          fill="url(#gradGreen)"
          dot={false}
          activeDot={{ r: 4, fill: '#428743', stroke: '#E8EFE4', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
