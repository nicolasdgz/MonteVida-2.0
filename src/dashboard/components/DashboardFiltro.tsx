'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronDown } from 'lucide-react'

const PRESETS = [
  { label: 'Este mes',     value: 'mes-actual' },
  { label: '1 mes atrás',  value: '1-mes' },
  { label: '1 año atrás',  value: '1-año' },
  { label: 'Personalizado', value: 'custom' },
] as const

type PresetKey = typeof PRESETS[number]['value']

function getDesdeForPreset(preset: PresetKey, customDate?: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (preset === 'mes-actual') {
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    return `${today.getFullYear()}-${mm}-01`
  }
  if (preset === '1-mes') {
    const d = new Date(today)
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }
  if (preset === '1-año') {
    const d = new Date(today)
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().split('T')[0]
  }
  return customDate ?? today.toISOString().split('T')[0]
}

function detectPreset(desde: string): PresetKey {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstOfMonth = (() => {
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    return `${today.getFullYear()}-${mm}-01`
  })()

  const hace30 = (() => {
    const d = new Date(today); d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })()

  const haceAño = (() => {
    const d = new Date(today); d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().split('T')[0]
  })()

  if (desde === firstOfMonth) return 'mes-actual'
  if (desde === hace30)       return '1-mes'
  if (desde === haceAño)      return '1-año'
  return 'custom'
}

interface DashboardFiltroProps {
  currentDesde: string
}

export function DashboardFiltro({ currentDesde }: DashboardFiltroProps) {
  const router       = useRouter()
  const activePreset = detectPreset(currentDesde)
  const [showCustom, setShowCustom] = useState(activePreset === 'custom')
  const [customDate, setCustomDate] = useState(
    activePreset === 'custom' ? currentDesde : ''
  )

  function navigate(desde: string) {
    router.push(`/dashboard?desde=${desde}`)
  }

  function handlePreset(preset: PresetKey) {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    navigate(getDesdeForPreset(preset))
  }

  function handleCustomApply() {
    if (!customDate) return
    navigate(customDate)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-[0.07em] shrink-0">
        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
        Desde
      </span>

      {/* Preset buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map((p) => {
          const isActive = p.value === 'custom'
            ? activePreset === 'custom'
            : activePreset === p.value

          return (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePreset(p.value)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary border-primary/25'
                  : 'bg-surface shadow-neu-sm border-0 text-muted-foreground hover:text-primary dark:bg-card dark:shadow-none dark:border dark:border-border'
              }`}
            >
              {p.value === 'custom' && <ChevronDown className="w-3 h-3 inline mr-1 -mt-px" />}
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Custom date picker */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customDate}
            max={today}
            onChange={(e) => setCustomDate(e.target.value)}
            className="input-field py-1 px-2 text-xs rounded"
          />
          <button
            type="button"
            onClick={handleCustomApply}
            disabled={!customDate}
            className="px-3 py-1 rounded-lg text-[11px] font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-neu-sm dark:shadow-none"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
