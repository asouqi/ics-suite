import { Temporal } from 'temporal-polyfill'
import type { ExpandedEvent } from 'ics-suite'

// ─── types ───────────────────────────────────────────────────────────────────

type DayPanelProps = {
  selectedDay: Temporal.PlainDate | null
  selectedEvent: ExpandedEvent | null
  dayEvents: ExpandedEvent[]
  onEventSelect: (event: ExpandedEvent) => void
  onBack: () => void
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: 'chip-confirmed',
  TENTATIVE: 'chip-tentative',
  CANCELLED: 'chip-cancelled',
}

const PARTSTAT_LABEL: Record<string, string> = {
  'ACCEPTED':      'Accepted',
  'DECLINED':      'Declined',
  'TENTATIVE':     'Tentative',
  'NEEDS-ACTION':  'No reply',
  'DELEGATED':     'Delegated',
}

function formatDay(day: Temporal.PlainDate): string {
  return new Date(day.year, day.month - 1, day.day)
    .toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
}

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

function formatRRule(event: ExpandedEvent): string | null {
  const rrule = event.event.rrule
  if (!rrule) return null

  const freq: Record<string, string> = {
    DAILY:   'Daily',
    WEEKLY:  'Weekly',
    MONTHLY: 'Monthly',
    YEARLY:  'Yearly',
  }

  const base = freq[rrule.freq] ?? rrule.freq

  if (rrule.byDay && rrule.byDay.length > 0) {
    const days = rrule.byDay.map(b => b.day).join(', ')
    return `${base} on ${days}`
  }

  if (rrule.count) return `${base} · ${rrule.count} occurrences`
  if (rrule.until) return `${base} · until ${rrule.until.year}/${rrule.until.month}/${rrule.until.day}`

  return base
}

export default function DayPanel({
                                   selectedDay,
                                   selectedEvent,
                                   dayEvents,
                                   onEventSelect,
                                   onBack,
                                 }: DayPanelProps) {
  return (
    <div className="section-card flex flex-col h-full min-h-[28rem]">
      {!selectedDay && <EmptyState />}
      {selectedDay && !selectedEvent && (
        <EventList
          day={selectedDay}
          events={dayEvents}
          onEventSelect={onEventSelect}
        />
      )}
      {selectedDay && selectedEvent && (
        <EventDetail
          day={selectedDay}
          event={selectedEvent}
          onBack={onBack}
        />
      )}
    </div>
  )
}

// ─── State 1 — Empty ─────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-2 py-12">
      <div className="text-3xl opacity-20 select-none">📅</div>
      <p className="text-sm text-muted-foreground text-center">
        Click a day to see events
      </p>
    </div>
  )
}

// ─── State 2 — Event list ────────────────────────────────────────────────────

function EventList({
                     day,
                     events,
                     onEventSelect,
                   }: {
  day: Temporal.PlainDate
  events: ExpandedEvent[]
  onEventSelect: (e: ExpandedEvent) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Heading */}
      <div>
        <p className="section-label">Selected day</p>
        <h3 className="text-base font-semibold text-foreground mt-0.5">
          {formatDay(day)}
        </h3>
      </div>

      <div className="border-t border-border" />

      {/* Events */}
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No events on this day
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event, i) => {
            const status    = event.event.status ?? 'CONFIRMED'
            const chipClass = STATUS_CLASS[status] ?? 'chip-confirmed'

            return (
              <li key={i}>
                <button
                  onClick={() => onEventSelect(event)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg
                             border border-border hover:bg-accent
                             transition-colors text-left group"
                >
                  {/* Time */}
                  <span className="text-xs text-muted-foreground font-mono
                                   shrink-0 mt-0.5 w-10">
                    {formatTime(event.start)}
                  </span>

                  {/* Title + status */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {event.event.summary ?? 'Untitled'}
                    </span>
                    <span className={chipClass}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Arrow */}
                  <span className="ml-auto text-muted-foreground opacity-0
                                   group-hover:opacity-100 transition-opacity
                                   shrink-0 mt-0.5">
                    →
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── State 3 — Event detail ──────────────────────────────────────────────────

function EventDetail({
                       day,
                       event,
                       onBack,
                     }: {
  day: Temporal.PlainDate
  event: ExpandedEvent
  onBack: () => void
}) {
  const e         = event.event
  const status    = e.status ?? 'CONFIRMED'
  const chipClass = STATUS_CLASS[status] ?? 'chip-confirmed'
  const rrule     = formatRRule(event)

  return (
    <div className="flex flex-col gap-4">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground
                   hover:text-foreground transition-colors w-fit"
      >
        ← Back to {formatDay(day)}
      </button>

      <div className="border-t border-border" />

      {/* Title + status */}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {e.summary ?? 'Untitled event'}
        </h3>
        <span className={chipClass}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Properties */}
      <div className="flex flex-col">

        {/* When */}
        <div className="prop-row">
          <span className="prop-key">When</span>
          <span className="prop-value">
            {formatTimeRange(event.start, event.end)}
          </span>
        </div>

        {/* Where */}
        {e.location && (
          <div className="prop-row">
            <span className="prop-key">Where</span>
            <span className="prop-value">{e.location}</span>
          </div>
        )}

        {/* Organizer */}
        {e.organizer && (
          <div className="prop-row">
            <span className="prop-key">Organizer</span>
            <span className="prop-value">
              {e.organizer.name ?? e.organizer.email}
            </span>
          </div>
        )}

        {/* Recurring */}
        {rrule && (
          <div className="prop-row">
            <span className="prop-key">Repeats</span>
            <span className="prop-value">{rrule}</span>
          </div>
        )}

        {/* Categories */}
        {e.categories && e.categories.length > 0 && (
          <div className="prop-row">
            <span className="prop-key">Categories</span>
            <span className="prop-value flex flex-wrap gap-1">
              {e.categories.map(cat => (
                <span
                  key={cat}
                  className="rfc-badge"
                >
                  {cat}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* Alarm */}
        {e.alarms && e.alarms.length > 0 && (
          <div className="prop-row">
            <span className="prop-key">Alarm</span>
            <span className="prop-value">
              {e.alarms[0].description ?? 'Reminder set'}
            </span>
          </div>
        )}

      </div>

      {/* Attendees */}
      {e.attendees && e.attendees.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="section-label">
            Attendees · {e.attendees.length}
          </p>
          <ul className="flex flex-col gap-1">
            {e.attendees.map((attendee, i) => {
              const label = PARTSTAT_LABEL[attendee.status ?? 'NEEDS-ACTION'] ?? 'No reply'
              const isAccepted  = attendee.status === 'ACCEPTED'
              const isDeclined  = attendee.status === 'DECLINED'

              return (
                <li key={i} className="flex items-center gap-2 py-1">
                  {/* Avatar */}
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center
                                   justify-center text-xs font-medium text-muted-foreground
                                   shrink-0 uppercase">
                    {(attendee.name ?? attendee.email)[0]}
                  </span>

                  {/* Name / email */}
                  <span className="text-sm text-foreground truncate flex-1">
                    {attendee.name ?? attendee.email}
                  </span>

                  {/* Status */}
                  <span className={[
                    'text-xs shrink-0',
                    isAccepted ? 'text-[var(--color-confirmed-text)]'
                      : isDeclined ? 'text-[var(--color-cancelled-text)]'
                        : 'text-muted-foreground',
                  ].join(' ')}>
                    {label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

    </div>
  )
}