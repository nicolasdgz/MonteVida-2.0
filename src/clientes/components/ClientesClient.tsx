'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, History, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { ClienteModal } from './ClienteModal'
import { ClienteHistorialModal } from './ClienteHistorialModal'
import { eliminarCliente } from '@/app/(admin)/clientes/actions'
import type { Cliente } from '@/types/database'

interface ClientesClientProps {
  clientes: Cliente[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export function ClientesClient({ clientes: initial, currentPage, totalPages, totalCount }: ClientesClientProps) {
  const router = useRouter()
  const [clientes, setClientes] = useState(initial)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [verHistorial, setVerHistorial] = useState<Cliente | null>(null)

  const filtrados = useMemo(() =>
    clientes.filter((c) =>
      !c.es_anonimo && (
        !search ||
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.numero_documento?.includes(search) ||
        c.telefono?.includes(search)
      )
    ), [clientes, search]
  )

  function handleSaved(cliente: Cliente) {
    setClientes((prev) => {
      const idx = prev.findIndex((c) => c.id === cliente.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = cliente
        return next
      }
      return [cliente, ...prev]
    })
  }

  async function handleEliminar(cliente: Cliente) {
    if (!confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return
    setDeletingId(cliente.id)
    const result = await eliminarCliente(cliente.id)
    setDeletingId(null)
    if (result.error) { toast.error(result.error); return }
    setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
    toast.success('Cliente eliminado.')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalCount} clientes registrados</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-colors shadow-neu-sm dark:shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo cliente</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, doc. o teléfono..."
          className="input-field pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="bg-card shadow-neu dark:shadow-none border border-border rounded-2xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Sin clientes registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50 dark:bg-transparent">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Documento</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Teléfono</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Registrado</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtrados.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group bg-background/60 dark:bg-transparent hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{c.nombre}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {c.numero_documento
                        ? <span><span className="text-muted-foreground/60 text-xs mr-1">{c.tipo_documento}</span>{c.numero_documento}</span>
                        : <span className="text-muted-foreground/60">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{c.telefono ?? <span className="text-muted-foreground/60">—</span>}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.email ?? <span className="text-muted-foreground/60">—</span>}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setVerHistorial(c)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-blue-400 dark:hover:bg-blue-400/10 transition-colors"
                          title="Ver historial"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditando(c); setModalOpen(true) }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(c)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          {deletingId === c.id
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Página {currentPage} de {totalPages} · {totalCount} clientes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/clientes?page=${currentPage - 1}`)}
              disabled={currentPage <= 1}
              className="px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >←</button>
            <button
              onClick={() => router.push(`/clientes?page=${currentPage + 1}`)}
              disabled={currentPage >= totalPages}
              className="px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >→</button>
          </div>
        </div>
      )}

      <ClienteModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null) }}
        cliente={editando}
        onSaved={handleSaved}
      />

      <ClienteHistorialModal
        cliente={verHistorial}
        onClose={() => setVerHistorial(null)}
      />
    </div>
  )
}
