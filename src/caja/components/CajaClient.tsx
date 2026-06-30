'use client'

import { useState, useTransition } from 'react'
import { Loader2, Vault, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { calcularEfectivoEsperado, registrarCierre } from '@/app/(admin)/caja/actions'
import type { CierreData, CierreRegistrado } from '@/caja/types'
import { formatearMonto } from '@/utils/igv'
import { formatFecha } from '@/utils/fechas'
import toast from 'react-hot-toast'

interface Props {
  hoy: string
  resumenInicial: CierreData | null
  historialInicial: CierreRegistrado[]
}

function diferenciaColor(diff: number) {
  if (Math.abs(diff) < 0.01) return 'text-muted-foreground'
  return diff > 0 ? 'text-emerald-400' : 'text-red-400'
}

export function CajaClient({ hoy, resumenInicial, historialInicial }: Props) {
  const [fecha, setFecha] = useState(hoy)
  const [resumen, setResumen] = useState<CierreData | null>(resumenInicial)
  const [efectivoReal, setEfectivoReal] = useState('')
  const [notas, setNotas] = useState('')
  const [historial, setHistorial] = useState<CierreRegistrado[]>(historialInicial)
  const [showHistorial, setShowHistorial] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [isRegistering, setIsRegistering] = useState(false)

  const efectivoRealNum = parseFloat(efectivoReal) || 0
  const diferencia = efectivoRealNum - (resumen?.efectivoEsperado ?? 0)

  async function handleFechaChange(nuevaFecha: string) {
    setFecha(nuevaFecha)
    startTransition(async () => {
      const result = await calcularEfectivoEsperado(nuevaFecha)
      if (result.data) setResumen(result.data)
    })
  }

  async function handleRegistrar() {
    if (!resumen) { toast.error('Calculá primero el efectivo esperado.'); return }
    if (!efectivoReal) { toast.error('Ingresá el efectivo real contado.'); return }

    setIsRegistering(true)
    const result = await registrarCierre(fecha, resumen.efectivoEsperado, efectivoRealNum, notas)
    setIsRegistering(false)

    if (result.error) { toast.error(result.error); return }

    toast.success('Cierre registrado correctamente.')
    setEfectivoReal('')
    setNotas('')

    // Refresh historial
    const { fetchCierresCaja } = await import('@/app/(admin)/caja/actions')
    const updated = await fetchCierresCaja()
    if (updated.data) setHistorial(updated.data)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/25 bg-primary/10 mb-3">
          <Vault className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-medium text-primary uppercase tracking-[0.07em]">Caja</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cierre de caja</h1>
        <p className="text-sm text-muted-foreground mt-1">Registrá el efectivo contado al cerrar el día.</p>
      </div>

      {/* Main card */}
      <div
        className="rounded-[1.25rem] p-px"
        style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0.05) 50%, rgba(109,40,217,0.2) 100%)' }}
      >
        <div
          className="rounded-[calc(1.25rem-1px)] p-5 sm:p-6 space-y-5"
          style={{ background: 'linear-gradient(160deg, #131323 0%, #0d0d1a 100%)' }}
        >
          {/* Fecha */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Resumen del día */}
          {resumen && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card border border-white/[0.05] p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] mb-1">Ventas efectivo</p>
                <p className="text-xl font-semibold text-foreground tabular-nums">{formatearMonto(resumen.efectivoEsperado)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{resumen.cantidadVentas} {resumen.cantidadVentas === 1 ? 'venta' : 'ventas'}</p>
              </div>
              <div className={`rounded-xl border p-4 ${
                Math.abs(diferencia) < 0.01
                  ? 'bg-card border-white/[0.05]'
                  : diferencia > 0
                    ? 'bg-emerald-500/8 border-emerald-500/20'
                    : 'bg-red-500/8 border-red-500/20'
              }`}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.07em] mb-1">Diferencia</p>
                <p className={`text-xl font-semibold tabular-nums ${diferenciaColor(diferencia)}`}>
                  {diferencia >= 0 ? '+' : ''}{formatearMonto(diferencia)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.abs(diferencia) < 0.01 ? 'Cuadra exacto' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Calculando...
            </div>
          )}

          {/* Efectivo real */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">
              Efectivo real contado (S/)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={efectivoReal}
              onChange={(e) => setEfectivoReal(e.target.value)}
              placeholder="0.00"
              className="input-field text-lg font-semibold"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1.5">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones opcionales..."
              rows={2}
              className="input-field resize-none text-sm"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleRegistrar}
            disabled={isRegistering || !efectivoReal || isPending}
            className="group w-full py-3 px-5 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-full flex items-center justify-between gap-2"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              boxShadow: '0 0 0 1px rgba(139,92,246,0.2), 0 6px 20px rgba(109,40,217,0.25)',
            }}
          >
            <span className="flex items-center gap-2 text-sm">
              {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegistering ? 'Registrando...' : 'Registrar cierre'}
            </span>
            {!isRegistering && (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistorial((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary/8 transition-colors"
          >
            <span className="text-sm font-medium text-muted-foreground">Últimos cierres</span>
            {showHistorial ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showHistorial && (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-5 gap-2 px-5 py-2 border-t border-border">
                {['Fecha', 'Responsable', 'Esperado', 'Real', 'Diferencia'].map((h) => (
                  <span key={h} className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.07em]">{h}</span>
                ))}
              </div>
              {historial.map((c) => (
                <div key={c.id} className="grid grid-cols-5 gap-2 px-5 py-3 text-sm hover:bg-primary/8 transition-colors">
                  <span className="text-muted-foreground">{formatFecha(c.fecha)}</span>
                  <span className="text-muted-foreground truncate">{c.profiles?.full_name ?? '—'}</span>
                  <span className="tabular-nums text-muted-foreground">{formatearMonto(c.efectivo_esperado)}</span>
                  <span className="tabular-nums text-muted-foreground">{formatearMonto(c.efectivo_real)}</span>
                  <span className={`tabular-nums font-medium ${diferenciaColor(c.diferencia)}`}>
                    {c.diferencia >= 0 ? '+' : ''}{formatearMonto(c.diferencia)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {historial.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">Sin cierres registrados aún.</p>
      )}
    </div>
  )
}
