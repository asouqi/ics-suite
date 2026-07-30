import { useMemo, useState } from 'react'
import { Temporal } from 'temporal-polyfill'
import { parse, query, validate } from 'ics-suite'
import type { ExpandedEvent, ValidationResult } from 'ics-suite'

import googleCalendar from '../fixtures/invalid-calendar.ics?raw'

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

// ─── hook ────────────────────────────────────────────────────────────────────

export function useCalendar() {
  const [month, setMonth] = useState(() =>
    Temporal.PlainDate.from({ year: 2024, month: 1, day: 1 }),
  )
  const [selectedDay, setSelectedDay]     = useState<Temporal.PlainDate | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ExpandedEvent | null>(null)
  const [filters, setFilters]             = useState<CalendarFilters>(DEFAULT_FILTERS)

  // Parse once — stable reference
  const calendar = useMemo(() => parse(googleCalendar).calendar, [])

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

  return {
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