'use client'

import { useState, useRef, useEffect } from 'react'
import { User, X, UserPlus, Loader2 } from 'lucide-react'
import { useSaleForm } from '@/ventas/store'
import { crearCliente } from '@/app/(admin)/clientes/actions'
import { ANONYMOUS_CLIENT_ID, ANONYMOUS_CLIENT_NAME } from '@/lib/constants'
import toast from 'react-hot-toast'

interface ClienteInfo { id: string; nombre: string; documento: string }
interface ClienteBasico { id: string; nombre: string; numero_documento: string | null }

export function BuscadorClientes({ initialClientes = [] }: { initialClientes?: ClienteBasico[] }) {
  const clienteId  = useSaleForm((s) => s.clienteId)
  const setCliente = useSaleForm((s) => s.setCliente)

  const [dni, setDni]               = useState('')
  const [nombre, setNombre]         = useState('')
  const [suggestions, setSuggestions] = useState<ClienteInfo[]>([])
  const [creating, setCreating]     = useState(false)
  const [selected, setSelected]     = useState<ClienteInfo | null>(null)
  const [showGeneric, setShowGeneric] = useState(false)

  const prevId       = useRef(clienteId)
  const containerRef = useRef<HTMLDivElement>(null)
  const [allClientes, setAllClientes] = useState<ClienteInfo[]>(
    () => initialClientes.map((c) => ({ id: c.id, nombre: c.nombre, documento: c.numero_documento ?? '' }))
  )

  // Reset cuando el formulario se reinicia
  useEffect(() => {
    if (clienteId === ANONYMOUS_CLIENT_ID && prevId.current !== ANONYMOUS_CLIENT_ID) {
      setDni(''); setNombre(''); setSelected(null); setShowGeneric(false); setSuggestions([])
    }
    prevId.current = clienteId
  }, [clienteId])

  // Filtrado en memoria — sin red, instantáneo
  useEffect(() => {
    const trimmed = nombre.trim().toLowerCase()
    if (trimmed.length < 2) { setSuggestions([]); return }
    const matches = allClientes
      .filter((c) => c.nombre.toLowerCase().includes(trimmed))
      .slice(0, 6)
    setSuggestions(matches)
  }, [nombre, allClientes])

  // Cierra sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function dispatchSelect(id: string, n: string) {
    setCliente(id, n)
  }

  function selectReal(info: ClienteInfo) {
    setSelected(info); setShowGeneric(false); setSuggestions([])
    dispatchSelect(info.id, info.nombre)
    // Agrega el nuevo cliente al cache local para buscarlo en la misma sesión
    setAllClientes((prev) => prev.find((c) => c.id === info.id) ? prev : [...prev, info])
  }

  function selectGenerico() {
    setShowGeneric(true); setSelected(null); setSuggestions([])
    dispatchSelect(ANONYMOUS_CLIENT_ID, ANONYMOUS_CLIENT_NAME)
  }

  function clear() {
    setDni(''); setNombre(''); setSelected(null); setShowGeneric(false); setSuggestions([])
    dispatchSelect(ANONYMOUS_CLIENT_ID, ANONYMOUS_CLIENT_NAME)
  }

  async function handleConfirmar() {
    const trimmedDni    = dni.trim()
    const trimmedNombre = nombre.trim()
    if (!trimmedDni && !trimmedNombre) return

    // Si hay DNI, busca en el cache local primero
    if (trimmedDni) {
      const encontrado = allClientes.find((c) => c.documento === trimmedDni)
      if (encontrado) {
        selectReal(encontrado)
        return
      }
    }

    // No encontrado → crear cliente nuevo
    if (!trimmedNombre) { toast.error('Ingresa el nombre del cliente.'); return }
    setCreating(true)
    const result = await crearCliente({
      nombre: trimmedNombre,
      tipo_documento: 'DNI',
      numero_documento: trimmedDni || undefined,
    })
    setCreating(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Cliente registrado.')
    selectReal({ id: result.id!, nombre: trimmedNombre, documento: trimmedDni })
  }

  // ── Cliente real seleccionado ─────────────────────────────────────────────
  if (selected) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</p>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/30">
          <User className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground">{selected.nombre}</span>
            {selected.documento && (
              <span className="text-xs text-muted-foreground ml-2">DNI {selected.documento}</span>
            )}
          </div>
          <button type="button" onClick={clear} aria-label="Quitar cliente" className="p-1 rounded text-primary/60 hover:text-primary transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  // ── Cliente anónimo seleccionado ──────────────────────────────────────────
  if (showGeneric) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</p>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-muted-foreground">Usuario</span>
          </div>
          <button type="button" onClick={clear} aria-label="Quitar cliente anónimo" className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  const isBusy     = creating
  const canConfirm = nombre.trim().length > 0 || dni.trim().length > 0

  // ── Modo input ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2" ref={containerRef}>
      <p className="text-xs font-medium text-muted-foreground">Cliente</p>

      {/* Campo nombre con sugerencias */}
      <div className="relative">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirmar()}
          placeholder="Nombre completo"
          className="input-field w-full"
          autoComplete="off"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            {suggestions.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectReal(c) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-primary/8 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{c.nombre}</span>
                  {c.documento && (
                    <span className="text-xs text-muted-foreground shrink-0">DNI {c.documento}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DNI (opcional) + botones */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={dni}
          onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirmar()}
          placeholder="DNI (opcional)"
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={isBusy || !canConfirm}
          title="Confirmar / Registrar cliente"
          className="px-3 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-secondary-foreground transition-colors"
        >
          {isBusy
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <UserPlus className="w-4 h-4" />
          }
        </button>
        <button
          type="button"
          onClick={selectGenerico}
          className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors whitespace-nowrap cursor-pointer"
        >
          Sin DNI
        </button>
      </div>
    </div>
  )
}
