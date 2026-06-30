'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Receipt, Trash2, Pencil, ExternalLink, Loader2 } from 'lucide-react'
import { GastoModal } from './GastoModal'
import { eliminarGasto } from '@/app/(admin)/gastos/actions'
import { formatearMonto } from '@/utils/igv'
import toast from 'react-hot-toast'
import type { Expense, ExpenseCategory } from '@/types/database'

const CATEGORIA_LABEL: Record<ExpenseCategory, string> = {
  alquiler:      'Alquiler',
  servicios:     'Servicios',
  personal:      'Personal',
  marketing:     'Marketing',
  logistica:     'Logística',
  mantenimiento: 'Mantenimiento',
  impuestos:     'Impuestos',
  mercaderia:    'Mercadería',
  otros:         'Otros',
}

const CATEGORIA_COLOR: Record<ExpenseCategory, string> = {
  alquiler:      'bg-blue-500/15 text-blue-400 border-blue-500/20',
  servicios:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  personal:      'bg-violet-500/15 text-violet-400 border-violet-500/20',
  marketing:     'bg-pink-500/15 text-pink-400 border-pink-500/20',
  logistica:     'bg-amber-500/15 text-amber-400 border-amber-500/20',
  mantenimiento: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  impuestos:     'bg-red-500/15 text-red-400 border-red-500/20',
  mercaderia:    'bg-teal-500/15 text-teal-400 border-teal-500/20',
  otros:         'bg-muted text-muted-foreground border-border',
}

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

interface Props {
  expenses: Expense[]
}

export function GastosClient({ expenses: initial }: Props) {
  const [expenses, setExpenses] = useState(initial)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Expense | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [filtroCat, setFiltroCat] = useState<ExpenseCategory | 'todos'>('todos')

  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    const isNow = viewYear === today.getFullYear() && viewMonth === today.getMonth()
    if (isNow) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.fecha + 'T12:00:00')
      const matchMonth = d.getFullYear() === viewYear && d.getMonth() === viewMonth
      const matchCat   = filtroCat === 'todos' || e.categoria === filtroCat
      return matchMonth && matchCat
    })
  }, [expenses, viewYear, viewMonth, filtroCat])

  const totalMes = useMemo(() => filtered.reduce((s, e) => s + e.monto, 0), [filtered])

  const topCategoria = useMemo(() => {
    const totales = filtered.reduce<Record<string, number>>((acc, e) => {
      acc[e.categoria] = (acc[e.categoria] ?? 0) + e.monto
      return acc
    }, {})
    const entries = Object.entries(totales).sort((a, b) => b[1] - a[1])
    if (!entries.length) return null
    const [cat, monto] = entries[0]
    return { cat: cat as ExpenseCategory, monto }
  }, [filtered])

  async function handleEliminar(id: string) {
    setEliminandoId(id)
    const result = await eliminarGasto(id)
    setEliminandoId(null)
    if (result.error) { toast.error(result.error); return }
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    toast.success('Gasto eliminado.')
  }

  function handleSaved(expense: Expense, isEdit: boolean) {
    if (isEdit) {
      setExpenses((prev) => prev.map((e) => e.id === expense.id ? expense : e))
    } else {
      setExpenses((prev) => [expense, ...prev])
    }
  }

  function openCreate() { setEditando(null); setModalOpen(true) }
  function openEdit(g: Expense) { setEditando(g); setModalOpen(true) }

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro de egresos operativos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo gasto</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Month navigator */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/8 dark:hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{MONTHS[viewMonth]}</p>
            <p className="text-xs text-muted-foreground">{viewYear}</p>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/8 dark:hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Total */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total del mes</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{formatearMonto(totalMes)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filtered.length} {filtered.length === 1 ? 'gasto' : 'gastos'}
          </p>
        </div>

        {/* Top category */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Mayor categoría</p>
          {topCategoria ? (
            <>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORIA_COLOR[topCategoria.cat]}`}>
                {CATEGORIA_LABEL[topCategoria.cat]}
              </span>
              <p className="text-sm font-semibold text-muted-foreground tabular-nums mt-1.5">
                {formatearMonto(topCategoria.monto)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">—</p>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroCat('todos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            filtroCat === 'todos'
              ? 'bg-muted border-border text-foreground'
              : 'border-border text-muted-foreground hover:text-primary dark:hover:text-foreground'
          }`}
        >
          Todos
        </button>
        {(Object.keys(CATEGORIA_LABEL) as ExpenseCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filtroCat === cat
                ? CATEGORIA_COLOR[cat]
                : 'border-border text-muted-foreground hover:text-primary dark:hover:text-foreground'
            }`}
          >
            {CATEGORIA_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Receipt className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Sin gastos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Comp.</th>
                  <th className="py-3 px-4 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((gasto, i) => (
                  <motion.tr
                    key={gasto.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group hover:bg-primary/8 dark:hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(gasto.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[220px]">
                      <span className="truncate block">{gasto.descripcion}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORIA_COLOR[gasto.categoria]}`}>
                        {CATEGORIA_LABEL[gasto.categoria]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground tabular-nums">
                      {formatearMonto(gasto.monto)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {gasto.comprobante_url ? (
                        <a
                          href={gasto.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(gasto)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary dark:hover:text-foreground hover:bg-primary/8 dark:hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(gasto.id)}
                          disabled={eliminandoId === gasto.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {eliminandoId === gasto.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GastoModal
        isOpen={modalOpen}
        gasto={editando}
        onClose={() => { setModalOpen(false); setEditando(null) }}
        onSaved={handleSaved}
      />
    </div>
  )
}
