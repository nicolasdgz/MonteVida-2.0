'use client'

export function getPageNums(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

interface PaginacionProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemLabel: string
  onPageChange: (page: number) => void
}

const NAV_BTN = 'px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

export function Paginacion({ currentPage, totalPages, totalCount, itemLabel, onPageChange }: PaginacionProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-1">
      <p className="text-xs text-muted-foreground">
        Página {currentPage} de {totalPages} · {totalCount} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={NAV_BTN}>
          ←
        </button>
        {getPageNums(currentPage, totalPages).map((n, i) =>
          n === '...'
            ? <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">…</span>
            : <button
                key={n}
                onClick={() => onPageChange(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === currentPage ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {n}
              </button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={NAV_BTN}>
          →
        </button>
      </div>
    </div>
  )
}
