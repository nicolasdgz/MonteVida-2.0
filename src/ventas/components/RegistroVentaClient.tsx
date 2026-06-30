'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { History } from 'lucide-react'
import { BuscadorClientes } from './BuscadorClientes'
import { BuscadorProductos } from './BuscadorProductos'
import { LineasVenta } from './LineasVenta'
import { ResumenVenta } from './ResumenVenta'
import type { Product, Cliente } from '@/types/database'

type ClienteBasico = Pick<Cliente, 'id' | 'nombre' | 'numero_documento'>

export function RegistroVentaClient({ products, clientes }: { products: Product[]; clientes: ClienteBasico[] }) {
  const router = useRouter()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block mb-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-primary/[0.08] text-primary/70 border border-primary/[0.15]">
            Punto de venta
          </span>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Nueva venta</h1>
          <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">Registrá los productos de la operación</p>
        </div>
        <Link
          href="/ventas/historial"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 text-sm font-medium transition-colors shrink-0"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Ver historial</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Izquierda: cliente + productos + líneas */}
        <div className="lg:col-span-2 space-y-4">
          <BuscadorClientes initialClientes={clientes} />
          <BuscadorProductos products={products} />
          <LineasVenta />
        </div>

        {/* Derecha: resumen */}
        <div>
          <ResumenVenta onSuccess={() => router.refresh()} />
        </div>
      </div>
    </div>
  )
}
