import { useEffect, useMemo, useState } from 'react'
import { Temporal } from 'temporal-polyfill'
import { parse, query, validate } from 'ics-suite'
import type { ExpandedEvent, ValidationResult } from 'ics-suite'

import googleCalendar from '../fixtures/recurring-series.ics?raw'

// ─── types ───────────────────────────────────────────────────────────────────

export type EventsByDay = Map<string, ExpandedEvent[]>

export type CalendarFilters = {
  status:   string  // 'ALL' | 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
  attendee: string  // email or name fragment, empty = no filter
  category: string  // 'ALL' | specific category
}

const DEFAULT_FILTERS: CalendarFilters = {
  status:   'ALL',
  attendee: '',
  category: 'ALL',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

export function toDateKey(
  date: Temporal.ZonedDateTime | Temporal.PlainDate,
): string {
  if (date instanceof Temporal.PlainDate) return date.toString()
  return date.toPlainDate().toString()
}

// Find the earliest concrete start date among the calendar's events (non-recurring
// start dates only — good enough for "jump to a sensible month on load").
function findEarliestEventDay(
  calendar: ReturnType<typeof parse>['calendar'],
): Temporal.PlainDate | null {
  let earliest: Temporal.PlainDate | null = null

  for (const event of calendar.events) {
    if (!event.dtStart) continue

    const date = Temporal.PlainDate.from({
      year: event.dtStart.year,
      month: event.dtStart.month,
      day: event.dtStart.day,
    })

    if (!earliest || Temporal.PlainDate.compare(date, earliest) < 0) {
      earliest = date
    }
  }

  return earliest
}

function matchesFilters(
  event: ExpandedEvent,
  filters: CalendarFilters,
): boolean {
  if (filters.status !== 'ALL' && event.event.status !== filters.status) {
    return false
  }

  if (filters.attendee.trim().length > 0) {
    const fragment = filters.attendee.trim().toLowerCase()
    const matches = event.event.attendees?.some(
      a =>
        a.email.toLowerCase().includes(fragment) ||
        (a.name ?? '').toLowerCase().includes(fragment),
    )
    if (!matches) return false
  }

  return !(filters.category !== 'ALL' && !event.event.categories?.includes(filters.category));
}

// Search forward/backward from `fromMonth` for the nearest month (within a
// reasonable window) containing at least one event that matches the active filters.
function findNearestMatchingMonth(
  calendar: ReturnType<typeof parse>['calendar'],
  filters: CalendarFilters,
  fromMonth: Temporal.PlainDate,
  maxMonthsToSearch = 24,
): Temporal.PlainDate | null {
  for (let offset = 0; offset <= maxMonthsToSearch; offset++) {
    for (const direction of offset === 0 ? [0] : [offset, -offset]) {
      const candidateMonth = fromMonth.add({ months: direction })
      const start = candidateMonth.with({ day: 1 })
      const end   = candidateMonth.with({ day: candidateMonth.daysInMonth })

      const hasMatch = query(calendar)
        .between(start, end)
        .inclusive()
        .where(e => matchesFilters(e, filters))
        .count() > 0

      if (hasMatch) return start
    }
  }
  return null
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useCalendar(icsText?: string) {
  const [month, setMonth] = useState(() =>
    Temporal.PlainDate.from({ year: 2024, month: 1, day: 1 }),
  )
  const [selectedDay, setSelectedDay]     = useState<Temporal.PlainDate | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ExpandedEvent | null>(null)
  const [filters, setFilters]             = useState<CalendarFilters>(DEFAULT_FILTERS)

  const parseResult = useMemo(
    () => parse(icsText ?? googleCalendar),
    [icsText],
  )
  const calendar = parseResult.calendar
  const parseErrors = parseResult.errors
  const parseWarnings = parseResult.warnings

  const summary = useMemo(() => {
    const events = calendar.events
    if (events.length === 0) return null

    let earliest: Temporal.PlainDate | null = null
    let latest: Temporal.PlainDate | null = null

    for (const event of events) {
      if (!event.start) continue
      const date = event.start instanceof Temporal.PlainDate ? event.start : event.start.toPlainDate()
      if (!earliest || Temporal.PlainDate.compare(date, earliest) < 0) earliest = date
      if (!latest || Temporal.PlainDate.compare(date, latest) > 0) latest = date
    }

    return { totalEvents: events.length, earliest, latest }
  }, [calendar])

  // When a new .ics is loaded, jump the visible month to the first event we find
  useEffect(() => {
    const firstEventDay = findEarliestEventDay(calendar) // returns PlainDate | null, not `.with({day:1})`
    console.log(firstEventDay)
    const targetDay = firstEventDay ?? Temporal.Now.plainDateISO()

    setMonth(targetDay.with({ day: 1 }))
    setSelectedDay(targetDay)
    setSelectedEvent(null)
  }, [icsText]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const start = month.with({ day: 1 })
    const end   = month.with({ day: month.daysInMonth })

    const currentMonthHasMatch =
      query(calendar).between(start, end).inclusive()
        .where(e => matchesFilters(e, filters)).count() > 0

    if (!currentMonthHasMatch) {
      const nearest = findNearestMatchingMonth(calendar, filters, month)
      if (nearest) {
        setMonth(nearest)
        setSelectedDay(null)
        setSelectedEvent(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, calendar])

  // Derive all categories present in the calendar for the filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    for (const event of calendar.events) {
      for (const cat of event.categories ?? []) {
        set.add(cat)
      }
    }
    return Array.from(set).sort()
  }, [calendar])

  // Query events for the current month applying all active filters
  const eventsByDay = useMemo((): EventsByDay => {
    const start = month.with({ day: 1 })
    const end   = month.with({ day: month.daysInMonth })

    let q = query(calendar).between(start, end).inclusive()

    if (filters.status !== 'ALL') {
      q = q.withStatus(filters.status as any)
    }

    if (filters.attendee.trim().length > 0) {
      const fragment = filters.attendee.trim().toLowerCase()
      q = q.where(e =>
        e.event.attendees?.some(
          a =>
            a.email.toLowerCase().includes(fragment) ||
            (a.name ?? '').toLowerCase().includes(fragment),
        ) ?? false,
      )
    }

    if (filters.category !== 'ALL') {
      q = q.withCategory(filters.category)
    }

    const events = q.get()
    const map    = new Map<string, ExpandedEvent[]>()

    for (const event of events) {
      const key      = toDateKey(event.start)
      const existing = map.get(key) ?? []
      existing.push(event)
      map.set(key, existing)
    }

    return map
  }, [calendar, month, filters])

  const hasEventsInMonth = eventsByDay.size > 0

  const conflicts = useMemo(() => {
    const start = month.with({ day: 1 })
    const end   = month.with({ day: month.daysInMonth })

    return query(calendar)
      .between(start, end)
      .inclusive()
      .conflicts()
  }, [calendar, month])

  const validation = useMemo((): ValidationResult => {
    return validate(calendar)
  }, [calendar])

  // Events for the selected day
  const dayEvents = useMemo(() => {
    if (!selectedDay) return []
    return eventsByDay.get(selectedDay.toString()) ?? []
  }, [eventsByDay, selectedDay])

  // ── actions ──────────────────────────────────────────────────────────────

  function goToPrevMonth() {
    setMonth(m => m.subtract({ months: 1 }))
    setSelectedDay(null)
    setSelectedEvent(null)
  }

  function goToNextMonth() {
    setMonth(m => m.add({ months: 1 }))
    setSelectedDay(null)
    setSelectedEvent(null)
  }

  function goToToday() {
    const today = Temporal.Now.plainDateISO()
    setMonth(today.with({ day: 1 }))
    setSelectedDay(today)
    setSelectedEvent(null)
  }

  function selectDay(day: Temporal.PlainDate) {
    setSelectedDay(day)
    setSelectedEvent(null)
  }

  function selectEvent(event: ExpandedEvent) {
    setSelectedEvent(event)
  }

  function clearEventSelection() {
    setSelectedEvent(null)
  }

  function updateFilter<K extends keyof CalendarFilters>(
    key: K,
    value: CalendarFilters[K],
  ) {
    setFilters(f => ({ ...f, [key]: value }))
    setSelectedDay(null)
    setSelectedEvent(null)
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setSelectedDay(null)
    setSelectedEvent(null)
  }

  const recurringEvent = calendar.events.find(e => e.rrule)

  return {
    recurringEvent,
    month,
    selectedDay,
    selectedEvent,
    eventsByDay,
    hasEventsInMonth,
    conflicts,
    validation,
    dayEvents,
    filters,
    availableCategories,
    parseWarnings,
    parseErrors,
    summary,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    selectDay,
    selectEvent,
    clearEventSelection,
    updateFilter,
    clearFilters,
  }
}