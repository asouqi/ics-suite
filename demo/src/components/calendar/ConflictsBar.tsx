import { useState } from 'react'
import { Temporal } from 'temporal-polyfill'
import type { ConflictPair } from 'ics-suite'

// ─── types ───────────────────────────────────────────────────────────────────

type ConflictsBarProps = {
  conflicts: ConflictPair[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(dt: Temporal.ZonedDateTime | Temporal.PlainDate): string {
  if (dt instanceof Temporal.PlainDate) return 'All day'
  return `${String(dt.hour).padStart(2, '0')}:${String(dt.minute).padStart(2, '0')}`
}

function formatTimeRange(
  start: Temporal.ZonedDateTime | Temporal.PlainDate,
  end: Temporal.ZonedDateTime | Temporal.PlainDate,
): string {
  if (start instanceof Temporal.PlainDate) return 'All day'
  return `${formatTime(start)} – ${formatTime(end)}`
}

function formatDate(dt: Temporal.ZonedDateTime | Temporal.PlainDate): string {
  const date = dt instanceof Temporal.PlainDate ? dt : dt.toPlainDate()
  return new Date(date.year, date.month - 1, date.day)
    .toLocaleDateString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
}

// ─── ConflictsBar ─────────────────────────────────────────────────────────────

export default function ConflictsBar({ conflicts }: ConflictsBarProps) {
  const [expanded, setExpanded] = useState(false)
  const hasConflicts = conflicts.length > 0

  return (
    <div className={[
      'rounded-lg border transition-colors overflow-hidden',
      hasConflicts
        ? 'border-[var(--color-diff-removed-border)] bg-[var(--color-diff-removed-bg)]'
        : 'border-border bg-muted/30',
    ].join(' ')}>

      {/* Header row — always visible */}
      <button
        onClick={() => hasConflicts && setExpanded(e => !e)}
        className={[
          'w-full flex items-center gap-2 px-4 py-2.5 text-left',
          hasConflicts ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        {/* Icon */}
        <span className="text-sm shrink-0">
          {hasConflicts ? '⚠️' : '✓'}
        </span>

        {/* Label */}
        <span className={[
          'text-xs font-semibold',
          hasConflicts
            ? 'text-[var(--color-diff-removed-text)]'
            : 'text-muted-foreground',
        ].join(' ')}>
          Conflicts
        </span>

        {/* Count or clear */}
        <span className={[
          'text-xs',
          hasConflicts
            ? 'text-[var(--color-diff-removed-text)]'
            : 'text-muted-foreground',
        ].join(' ')}>
          {hasConflicts
            ? `· ${conflicts.length} overlapping ${conflicts.length === 1 ? 'pair' : 'pairs'}`
            : '· No conflicts found'}
        </span>

        {/* Expand arrow */}
        {hasConflicts && (
          <span className={[
            'ml-auto text-xs text-[var(--color-diff-removed-text)]',
            'transition-transform duration-150',
            expanded ? 'rotate-180' : '',
          ].join(' ')}>
            ▾
          </span>
        )}
      </button>

      {/* Expanded pairs */}
      {expanded && hasConflicts && (
        <div className="flex flex-col gap-2 px-4 pb-3 border-t border-[var(--color-diff-removed-border)]">
          {conflicts.map((pair, i) => (
            <ConflictPairRow key={i} pair={pair} index={i} />
          ))}
        </div>
      )}

    </div>
  )
}

// ─── ConflictPairRow ──────────────────────────────────────────────────────────

function ConflictPairRow({ pair, index }: { pair: ConflictPair; index: number }) {
  return (
    <div className="flex flex-col gap-1.5 pt-2">
      <p className="text-xs font-medium text-[var(--color-diff-removed-text)] opacity-60">
        Conflict {index + 1} · {formatDate(pair.a.start)}
      </p>

      <div className="flex flex-col gap-1">
        {/* Event A */}
        <div className="conflict-pair">
          <p className="text-xs font-medium">
            {pair.a.event.summary ?? 'Untitled'}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {formatTimeRange(pair.a.start, pair.a.end)}
          </p>
        </div>

        {/* Overlap indicator */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-[var(--color-diff-removed-border)]" />
          <span className="text-[10px] text-[var(--color-diff-removed-text)] opacity-60 shrink-0">
            overlaps
          </span>
          <div className="flex-1 h-px bg-[var(--color-diff-removed-border)]" />
        </div>

        {/* Event B */}
        <div className="conflict-pair">
          <p className="text-xs font-medium">
            {pair.b.event.summary ?? 'Untitled'}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {formatTimeRange(pair.b.start, pair.b.end)}
          </p>
        </div>
      </div>
    </div>
  )
}