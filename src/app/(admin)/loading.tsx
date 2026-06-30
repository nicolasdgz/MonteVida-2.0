export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted/60 rounded-lg" />
      </div>

      {/* Stats / action row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-xl" />
        ))}
      </div>

      {/* Main content block skeleton */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 flex-1 bg-muted/70 rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
