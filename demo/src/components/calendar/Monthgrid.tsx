import { Temporal } from 'temporal-polyfill'
import type { EventsByDay } from "@/hook/useCalendar.ts"
import type { ExpandedEvent } from 'ics-suite'

// ─── types ───────────────────────────────────────────────────────────────────

type MonthGridProps = {
  month: Temporal.PlainDate
  selectedDay: Temporal.PlainDate | null
  eventsByDay: EventsByDay
  hasEventsInMonth: boolean
  onDaySelect: (day: Temporal.PlainDate) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

// ─── constants ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: 'chip-confirmed',
  TENTATIVE: 'chip-tentative',
  CANCELLED:  'chip-cancelled',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns all days to render in the month grid including leading and
 * trailing padding days from adjacent months so the grid always has
 * complete weeks.
 */
function buildCalendarDays(month: Temporal.PlainDate): Temporal.PlainDate[] {
  const firstDay = month.with({ day: 1 })
  const lastDay  = month.with({ day: month.daysInMonth })

  // dayOfWeek: 1 = Monday … 7 = Sunday
  const leadingPad  = firstDay.dayOfWeek - 1
  const trailingPad = 7 - lastDay.dayOfWeek

  const days: Temporal.PlainDate[] = []

  for (let i = leadingPad; i > 0; i--) {
    days.push(firstDay.subtract({ days: i }))
  }
  for (let d = 1; d <= month.daysInMonth; d++) {
    days.push(month.with({ day: d }))
  }
  for (let i = 1; i <= trailingPad; i++) {
    days.push(lastDay.add({ days: i }))
  }

  return days
}

function formatMonthYear(month: Temporal.PlainDate): string {
  return new Date(month.year, month.month - 1, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' })
}

// ─── MonthGrid ───────────────────────────────────────────────────────────────

export default function MonthGrid({
                                    month,
                                    selectedDay,
                                    eventsByDay,
                                    onDaySelect,
                                    onPrevMonth,
                                    onNextMonth,
                                    onToday,
                                  }: MonthGridProps) {
  const today = Temporal.Now.plainDateISO()
  const days  = buildCalendarDays(month)
  const todayInView = today.year === month.year && today.month === month.month

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── Controls ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={onPrevMonth} aria-label="Previous month" className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">←</button>
          <span className="text-sm font-semibold text-foreground px-2 min-w-40 text-center">
            {formatMonthYear(month)}
          </span>
          <button onClick={onNextMonth} aria-label="Next month" className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">→</button>
        </div>

        <button
          onClick={onToday}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {todayInView ? 'Today' : "Jump to today"}
        </button>
      </div>

      {/* ── Weekday headers ── */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 border-l border-t border-border rounded-xl overflow-hidden">
        {days.map(day => {
          const key      = day.toString()
          const events   = eventsByDay.get(key) ?? []
          const isToday  = Temporal.PlainDate.compare(day, today) === 0
          const isSelected = selectedDay
            ? Temporal.PlainDate.compare(day, selectedDay) === 0
            : false
          const isCurrentMonth = day.month === month.month

          return (
            <DayCell
              key={key}
              day={day}
              events={events}
              isToday={isToday}
              isSelected={isSelected}
              isCurrentMonth={isCurrentMonth}
              onClick={() => onDaySelect(day)}
            />
          )
        })}
      </div>

    </div>
  )
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

type DayCellProps = {
  day: Temporal.PlainDate
  events: ExpandedEvent[]
  isToday: boolean
  isSelected: boolean
  isCurrentMonth: boolean
  onClick: () => void
}

function DayCell({
                   day,
                   events,
                   isToday,
                   isSelected,
                   isCurrentMonth,
                   onClick,
                 }: DayCellProps) {
  const visible  = events.slice(0, MAX_CHIPS)
  const overflow = events.length - visible.length

  return (
    <button
      onClick={onClick}
      className={[
        // Square cell — aspect-ratio makes height = width
        'aspect-square w-full flex flex-col items-start',
        'border-r border-b border-border p-1.5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        isSelected
          ? 'bg-primary/5'
          : 'hover:bg-accent',
        !isCurrentMonth ? 'bg-muted/30' : 'bg-background',
      ].join(' ')}
    >
      {/* Day number */}
      <span
        className={[
          'text-xs font-medium leading-none mb-1 w-6 h-6 flex items-center',
          'justify-center rounded-full shrink-0',
          isToday
            ? 'bg-primary text-primary-foreground'
            : isSelected
              ? 'text-primary font-semibold'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground',
        ].join(' ')}
      >
        {day.day}
      </span>

      {/* Event chips */}
      <div className="flex flex-col gap-px w-full overflow-hidden">
        {visible.map((event, i) => (
          <EventChip key={i} event={event} />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-muted-foreground pl-1 leading-none mt-px">
            +{overflow} more
          </span>
        )}
      </div>
    </button>
  )
}

// ─── EventChip ───────────────────────────────────────────────────────────────

function EventChip({ event }: { event: ExpandedEvent }) {
  const status    = event.event.status ?? 'CONFIRMED'
  const chipClass = STATUS_CLASS[status] ?? 'chip-confirmed'

  const time =
    event.start instanceof Temporal.ZonedDateTime
      ? `${String(event.start.hour).padStart(2, '0')}:${String(event.start.minute).padStart(2, '0')}`
      : null

  return (
    <span
      className={[
        chipClass,
        'w-full truncate leading-none py-px px-1 text-[10px] rounded-sm',
      ].join(' ')}
      style={{ borderRadius: '3px' }}
    >
      {time && (
        <span className="opacity-60 mr-0.5 shrink-0 font-normal">{time}</span>
      )}
      <span className="truncate">{event.event.summary ?? 'Untitled'}</span>
    </span>
  )
}