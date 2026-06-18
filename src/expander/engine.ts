/**
 * ## Recurrence Expander Engine
 *
 * Implements the iCalendar recurrence expansion algorithm as defined
 * in RFC 5545 Section 3.8.5. Takes a parsed ICSEvent and a date window
 * and produces a flat list of concrete ExpandedEvent instances.
 *
 * The algorithm works in five stages per frequency period:
 * 1. Advance the anchor date by FREQ + INTERVAL
 * 2. Expand the anchor into a candidate set via BYxxx expanding rules
 * 3. Filter the candidate set via BYxxx filtering rules
 * 4. Apply BYSETPOS to select from the filtered set
 * 5. Remove EXDATE dates and apply RECURRENCE-ID overrides
 *
 * @rfc RFC 5545, Section 3.8.5
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5
 */
import { Temporal } from 'temporal-polyfill'

import { ICSDateOrDateTime, ICSEvent, ICSRecurrenceRule } from '../types'

import { expandCandidates } from './rrule'
import { ExpandedEvent, ExpandOptions } from './types'


const DEFAULT_MAX_INSTANCES = 1000
const DEFAULT_TIMEZONE = 'UTC'

function toTemporal(date: ICSDateOrDateTime, timezone: string) {
  if ('hour' in date) {
    const tz = date.utc ? 'UTC' : (date.tzid ?? timezone)
    return Temporal.ZonedDateTime.from({
      year: date.year,
      month: date.month,
      day: date.day,
      hour: date.hour,
      minute: date.minute,
      second: date.second,
      timeZone: tz
    })
  } 
  return Temporal.PlainDate.from({
    year: date.year,
    month: date.month,
    day: date.day
  })
}

/** convert ExpandOptions boundary to a comparable PlainDate */
function toPlainDate(boundary: Temporal.ZonedDateTime | Temporal.PlainDate) {
  if (boundary instanceof Temporal.PlainDate) return boundary
  return boundary.toPlainDate()
}

/** check if the candidate date falls within the expansion window */
function isInWindow(
  candidate: Temporal.PlainDate,
  start: Temporal.PlainDate,
  end: Temporal.PlainDate,
  inclusive: boolean
) {
  const afterStart = Temporal.PlainDate.compare(candidate, start) >= 0
  const beforeEnd= inclusive
    ? Temporal.PlainDate.compare(candidate, end) <= 0
    : Temporal.PlainDate.compare(candidate, end) < 0
  return afterStart && beforeEnd
}

/**
 * Calculates the duration of an event as a Temporal Duration, uses for boundary end:
 * DTEND or DTSTART or DURATION or fallback to zero
 **/
function getEventDuration(
  event: ICSEvent,
  dtStart: Temporal.ZonedDateTime | Temporal.PlainDate,
  defaultTimezone: string
) {
  if (event.dtEnd) {
   const end = toTemporal(event.dtEnd, defaultTimezone)
   if (dtStart instanceof Temporal.PlainDate && end instanceof Temporal.PlainDate) {
     return dtStart.until(end)
   }
   if (dtStart instanceof Temporal.ZonedDateTime && end instanceof Temporal.ZonedDateTime) {
     return dtStart.until(end)
   }
  }

  if (event.duration) {
    const duration = event.duration
    const d = Temporal.Duration.from({
      weeks: duration.weeks ?? 0,
      days: duration.weeks ?? 0,
      hours: duration.hours ?? 0,
      minutes: duration.minutes ?? 0,
      seconds: duration.seconds ?? 0,
    })
    return duration.negative ? d.negated() : d
  }

  return Temporal.Duration.from({ seconds: 0 })
}

/**
 * Builds a Set of date strings from the EXDATE list for fast lookup.
 * Uses ISO date strings as keys — YYYY-MM-DD for date-only,
 * full ISO string for datetimes.
 */
function buildExDateSet(event: ICSEvent, defaultTimezone: string): Set<string> {
  const set = new Set<string>()
  if (!event.exDate) return set

  for (const ex of event.exDate) {
    const t = toTemporal(ex, defaultTimezone)
    if (t instanceof Temporal.PlainDate) {
      set.add(t.toString())
    } else {
      set.add(t.toPlainDate().toString())
    }
  }
  return set
}

/**
 * Builds a map from date string to override ICSEvent.
 * Used to replace generated instances with their RECURRENCE-ID overrides
 **/
function buildOverrideMap(
  event: ICSEvent,
  defaultTimezone: string
) {
  const map = new Map<string, ICSEvent>()
  if (!event.overrides) return map

  for (const override of event.overrides) {
    if (!override.recurrenceId) continue
    const date = toTemporal(override.recurrenceId, defaultTimezone).toString()
    map.set(date, override)
  }

  return map
}

/** Advances the anchor date by one frequency unit multiplied by INTERVAL */
function advanceAnchor(anchor: Temporal.PlainDate, rrule: ICSRecurrenceRule) {
  const interval = rrule.interval ?? 1
  switch (rrule.freq) {
    case 'YEARLY':
      return anchor.add({ years: interval })
    case 'MONTHLY':
      return anchor.add({ months: interval })
    case 'WEEKLY':
      return anchor.add({ weeks: interval })
    case 'DAILY':
      return anchor.add({ days: interval })
    default:
      // sub-daily freq advance by day for PlainDate, that will be fin for our use case
      return anchor.add({ days: interval })
  }
}


/**
 * Builds a Temporal start datetime for a specific occurrence.
 * For timed events, combines the candidate date with the original time.
 * For all-day events, returns the candidate PlainDate.
 */
function buildInstanceStart(
  candidate: Temporal.PlainDate,
  originalStart: Temporal.ZonedDateTime | Temporal.PlainDate
): Temporal.ZonedDateTime | Temporal.PlainDate {
  if (originalStart instanceof Temporal.PlainDate) {
    return candidate
  }

  // Preserve the original time and timezone on the new date
  return candidate.toZonedDateTime({
    timeZone: originalStart.timeZoneId,
    plainTime: originalStart.toPlainTime(),
  })
}

/**
 * Builds a single ExpandedEvent instance.
 * Checks the override map and EXDATE set.
 * Returns null when the instance should be skipped.
 */
function buildInstance(
  event: ICSEvent,
  start: Temporal.ZonedDateTime | Temporal.PlainDate,
  duration: Temporal.Duration,
  overrideMap: Map<string, ICSEvent>,
  _exDateSet: Set<string>,
): ExpandedEvent {
  const key = start.toString()
  const override = overrideMap.get(key)

  // Calculate the end by adding duration to start
  let end: Temporal.ZonedDateTime | Temporal.PlainDate
  if (start instanceof Temporal.PlainDate) {
    end = start.add(duration)
  } else {
    end = start.add(duration)
  }

  return {
    start,
    end,
    event,
    isOverride: !!override,
    override: override,
  }
}

/**
 * Expands an ICSEvent into concrete ExpandedEvent instances within the
 * given window.
 */
export function expandEvent(event: ICSEvent, options: ExpandOptions) {
  const defaultTimezone = options.defaultTimezone ?? DEFAULT_TIMEZONE
  const maxInstances = options.maxInstances ?? DEFAULT_MAX_INSTANCES
  const inclusive = options.inclusive ?? false

  const windowStart = toPlainDate(options.start)
  const windowEnd = toPlainDate(options.end)

  if (!event.dtStart) return []
  const dtStartTemporal = toTemporal(event.dtStart, defaultTimezone)
  const dtStartPlain = toPlainDate(dtStartTemporal)

  const duration = getEventDuration(event, dtStartPlain, defaultTimezone)

  const exDateSet = buildExDateSet(event, defaultTimezone)
  const overrideMap = buildOverrideMap(event, defaultTimezone)

  // no recurring event just a single instance
  if (!event.rrule) {
    if (!isInWindow(dtStartPlain, windowStart, windowEnd, inclusive)) return []
    return [buildInstance(event, dtStartTemporal, duration, overrideMap, exDateSet)]
  }

  // walk through recurrence sequence
  const rrule = event.rrule
  const expandedEvent: ExpandedEvent[] = []

  const untilDate = rrule.until
    ? toPlainDate(toTemporal(rrule.until, defaultTimezone))
    : null

  const countLimit = rrule.count ?? null
  const hardLimit = maxInstances * 10

  let anchor = dtStartPlain
  let occurrenceCount = 0
  let iterations = 0

  while (iterations < hardLimit) {
    iterations++

    if (untilDate && Temporal.PlainDate.compare(anchor, untilDate) > 0) break

    const candidates = expandCandidates(anchor, rrule)
    for (const candidate of candidates) {
      if (untilDate && Temporal.PlainDate.compare(candidate, untilDate) > 0) break
      if (countLimit !== null && occurrenceCount >= countLimit) break

      occurrenceCount++

      if (exDateSet.has(candidate.toString())) continue
      if (!isInWindow(candidate, windowStart, windowEnd, inclusive)) continue

      const instanceStart = buildInstanceStart(candidate, dtStartTemporal)
      const instance = buildInstance(event, instanceStart, duration, overrideMap, exDateSet)
      expandedEvent.push(instance)

      if (expandedEvent.length >= maxInstances) break
    }

    if (countLimit !== null && occurrenceCount >= countLimit) break
    if (expandedEvent.length >= maxInstances) break

    anchor = advanceAnchor(anchor, rrule)
    // // compare <anchor, windowEnd> to zero and !untilDate && !contLimit
    if (Temporal.PlainDate.compare(anchor, windowEnd) > 0 && !untilDate && !countLimit) break
  }

  return expandedEvent
}