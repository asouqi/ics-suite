import type { CalendarFilters } from "@/hook/useCalendar.ts"

type FilterBarProps = {
  filters: CalendarFilters
  availableCategories: string[]
  onUpdate: <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => void
  onClear: () => void
}

const STATUS_OPTIONS = [
  { value: 'ALL',       label: 'All status' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'TENTATIVE', label: 'Tentative' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const STATUS_CHIP: Record<string, string> = {
  CONFIRMED: 'chip-confirmed',
  TENTATIVE: 'chip-tentative',
  CANCELLED: 'chip-cancelled',
}

function isActive(filters: CalendarFilters): boolean {
  return (
    filters.status !== 'ALL' ||
    filters.attendee.trim().length > 0 ||
    filters.category !== 'ALL'
  )
}

export default function FilterBar({
                                    filters,
                                    availableCategories,
                                    onUpdate,
                                    onClear,
                                  }: FilterBarProps) {
  const active = isActive(filters)

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-4
                    bg-muted/40 rounded-lg border border-border">

      <span className="section-label shrink-0">Filters</span>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Status */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_OPTIONS.map(opt => {
          const isSelected = filters.status === opt.value
          const chipClass  = opt.value !== 'ALL'
            ? STATUS_CHIP[opt.value]
            : undefined

          return (
            <button
              key={opt.value}
              onClick={() => onUpdate('status', opt.value)}
              className={[
                chipClass ?? '',
                'transition-all',
                isSelected && opt.value === 'ALL'
                  ? 'bg-foreground text-background border-foreground text-xs font-medium px-2.5 py-0.5 rounded-full border'
                  : !isSelected && opt.value === 'ALL'
                    ? 'text-xs font-medium px-2.5 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                    : isSelected
                      ? 'ring-2 ring-offset-1 ring-primary/50 scale-105'
                      : 'opacity-50 hover:opacity-100',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Attendee search */}
      <input
        type="text"
        value={filters.attendee}
        onChange={e => onUpdate('attendee', e.target.value)}
        placeholder="Filter by attendee…"
        className="text-xs rounded-md border border-border bg-background
                   px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring
                   w-44 transition-colors"
      />

      {/* Category */}
      {availableCategories.length > 0 && (
        <>
          <div className="w-px h-4 bg-border shrink-0" />
          <select
            value={filters.category}
            onChange={e => onUpdate('category', e.target.value)}
            className="text-xs rounded-md border border-border bg-background
                       px-2.5 py-1.5 text-foreground focus:outline-none
                       focus:ring-2 focus:ring-ring cursor-pointer transition-colors"
          >
            <option value="ALL">All categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Clear — only when a filter is active */}
      {active && (
        <>
          <div className="w-px h-4 bg-border shrink-0" />
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground
                       transition-colors underline underline-offset-2"
          >
            Clear
          </button>
        </>
      )}

    </div>
  )
}