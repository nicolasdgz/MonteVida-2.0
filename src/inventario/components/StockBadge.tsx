interface StockBadgeProps {
  stock: number
  stockMinimo: number
}

export function StockBadge({ stock, stockMinimo }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] bg-red-500/10 text-red-400">
        <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
        Sin stock
      </span>
    )
  }
  if (stock <= stockMinimo) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] bg-amber-500/10 text-amber-400">
        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
        {stock} uds.
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-[0.05em] bg-emerald-500/10 text-emerald-400">
      <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
      {stock} uds.
    </span>
  )
}
