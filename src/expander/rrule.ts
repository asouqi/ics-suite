import { Temporal } from 'temporal-polyfill'

import { ICSByDay, ICSRecurrenceRule, ICSWeekDay } from '../types'

export const WEEKDAY_MAP: Record<ICSWeekDay, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
}

/**
 * A transformation stage in an RFC 5545 RRULE expansion pipeline.
 * Takes a set of candidate dates and returns a filtered/expanded set
 */
type RRuleExpansionStage = (candidates: Temporal.PlainDate[]) => Temporal.PlainDate[]

/**
 * Creates an RFC 5545 BYMONTH filtering/expansion stage.
 *
 * For YEARLY: expands anchor into one date per BYMONTH value.
 * For other frequencies: filters candidates to matching months.
 *
 * @param freq - The RRULE FREQ component (YEARLY, MONTHLY, WEEKLY, DAILY, etc.)
 * @param byMonth - Array of month values (1-12) from BYMONTH rule
 * @returns Stage function that processes candidates
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4.10
 */
function createRRuleByMonthStage(freq: string, byMonth: number[]): RRuleExpansionStage {
  return (candidates) => {
    if (freq === 'YEARLY') {
      return byMonth.map((m) =>
        Temporal.PlainDate.from({
          year: candidates[0].year,
          month: m,
          day: candidates[0].day,
        }),
      )
    }
    return candidates.filter(c => byMonth.includes(c.month))
  }
}

/**
 * Creates an RFC 5545 BYMONTHDAY filtering/expansion stage.
 *
 * For MONTHLY/YEARLY: expands candidates into specific days of the month.
 * For other frequencies: filters candidates to matching month days.
 * Supports negative day values (e.g., -1 = last day of month).
 *
 * @param freq - The RRULE FREQ component
 * @param byMonthDay - Array of month day values (1-31, -1 to -31) from BYMONTHDAY rule
 * @returns Stage function that processes candidates
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4.11
 */
function createRRuleByMonthDayStage(freq: string, byMonthDay: number[]): RRuleExpansionStage {
  return (candidates) => {
    if (freq === 'MONTHLY' || freq === 'YEARLY') {
      const expanded: Temporal.PlainDate[] = []
      for (const c of candidates) {
        for (const d of byMonthDay) {
          const daysInMonth = c.daysInMonth
          const day = d > 0 ? d : daysInMonth + d + 1
          if (day >= 1 && day <= daysInMonth) {
            expanded.push(
              Temporal.PlainDate.from({ year: c.year, month: c.month, day })
            )
          }
        }
      }
      return expanded
    }
    return candidates.filter(c => {
      const daysInMonth = c.daysInMonth
      return byMonthDay.some(d => {
        const day = d > 0 ? d : daysInMonth + d + 1
        return day === c.day
      })
    })
  }
}

/**
 * Returns all days in a month that match the given weekday.
 */
function weekdayDaysInMonth(
  year: number,
  month: number,
  weekday: number,
): number[] {
  const days: number[] = []
  const daysInMonth = Temporal.PlainDate.from({ year, month, day: 1 })
    .daysInMonth

  for (let d = 1; d <= daysInMonth; d++) {
    const date = Temporal.PlainDate.from({ year, month, day: d })
    if (date.dayOfWeek === weekday) days.push(d)
  }
  return days
}

/**
 * Resolves a BYDAY entry with an optional ordinal to a concrete day
 * number within a given year and month.
 * Returns null when the ordinal is out of range.
 */
function resolveByDay(
  year: number,
  month: number,
  weekday: number,
  ordinal?: number,
): number | null {
  const matching = weekdayDaysInMonth(year, month, weekday)
  if (!ordinal) return null // no ordinal means all days — handled upstream
  const idx = ordinal > 0 ? ordinal - 1 : matching.length + ordinal
  return matching[idx] ?? null
}

/**
 * Creates an RFC 5545 BYDAY filtering/expansion stage.
 *
 * For WEEKLY: expands anchor week into matching weekdays.
 * For MONTHLY/YEARLY with ordinal (e.g., "2MO"): resolves to specific dates.
 * For MONTHLY/YEARLY without ordinal: expands to all matching weekdays in period.
 * For DAILY and finer: filters candidates to matching weekdays.
 *
 * @param freq - The RRULE FREQ component
 * @param byDay - Array of BYDAY entries with optional ordinals (e.g., [{day: "MO"}, {day: "TH", ordinal: 2}])
 * @returns Stage function that processes candidates
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4.12
 */
function createRRuleByDayStage(freq: string, byDay: ICSByDay[]): RRuleExpansionStage {
  return (candidates) => {
    const expanded: Temporal.PlainDate[] = []
    if (freq === 'WEEKLY') {
      const monday = candidates[0].subtract({ days: candidates[0].dayOfWeek - 1 })
      for (const { day, ordinal } of byDay) {
        if (ordinal !== undefined) continue // we don't apply ordinals to WEEKLY
        const offset = WEEKDAY_MAP[day] - 1
        expanded.push(monday.add({ days: offset }))
      }

      return expanded
    }

    if (freq === 'MONTHLY' || freq === 'YEARLY') {
      const hasOrdinal = byDay.some(b => b.ordinal !== undefined)
      if (hasOrdinal) {
        for (const c of candidates) {
          for (const { day, ordinal } of byDay) {
            const weekday = WEEKDAY_MAP[day]
            const resolved = resolveByDay(c.year, c.month, weekday, ordinal)
            if (resolved !== null) {
              expanded.push(
                Temporal.PlainDate.from({
                  year: c.year,
                  month: c.month,
                  day: resolved,
                }),
              )
            }
          }
        }
      } else {
        // No ordinal — expand to all matching weekdays in the period
        const weekdays = new Set(byDay.map((b) => WEEKDAY_MAP[b.day]))

        for (const c of candidates) {
          const daysInMonth = c.daysInMonth
          for (let d = 1; d <= daysInMonth; d++) {
            const date = Temporal.PlainDate.from({ year: c.year, month: c.month, day: d })
            if (weekdays.has(date.dayOfWeek)) expanded.push(date)
          }
        }
      }

      return expanded
    }

    // DIALY
    const weekdays = new Set(byDay.map(b => WEEKDAY_MAP[b.day]))
    return candidates.filter(c => weekdays.has(c.dayOfWeek))
  }
}

/**
 * Creates an RFC 5545 BYSETPOS filtering stage.
 *
 * Selects specific positions from the candidate set.
 * Applied last, after all other BYxxx rules.
 * Supports negative positions (e.g., -1 = last item).
 *
 * @param bySetPos - Array of position values (1-based positive, or negative from end) from BYSETPOS rule
 * @returns Stage function that processes candidates
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4.15
 */
function createRRuleBySetPosStage(bySetPos: number[]): RRuleExpansionStage {
  return (candidates) => {
    if (candidates.length === 0) return candidates
    const sorted = [...candidates].sort((a, b) => Temporal.PlainDate.compare(a, b))
    return bySetPos.map(pos => {
      const idx = pos > 0 ? pos - 1 : sorted.length + pos
      return sorted[idx]
    })
      .filter(d => d !== undefined)
  }
}

/**
 * Builds a pipeline of transformation stages for RFC 5545 RRULE expansion.
 * Each stage corresponds to a BYxxx rule component that filters or expands candidates.
 *
 * @param rrule - The ICS recurrence rule containing frequency and BYxxx components
 * @returns Array of pipeline stages to be executed in sequence
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4
 */
function buildRRuleExpansionPipeline(rrule: ICSRecurrenceRule): RRuleExpansionStage[] {
  const stages: RRuleExpansionStage[] = []

  if (rrule.byMonth && rrule.byMonth.length > 0) {
    stages.push(createRRuleByMonthStage(rrule.freq, rrule.byMonth))
  }

  if (rrule.byMonthDay && rrule.byMonthDay.length > 0) {
    stages.push(createRRuleByMonthDayStage(rrule.freq, rrule.byMonthDay))
  }

  if (rrule.byDay && rrule.byDay.length > 0) {
    stages.push(createRRuleByDayStage(rrule.freq, rrule.byDay))
  }

  if (rrule.bySetPos && rrule.bySetPos.length > 0) {
    stages.push(createRRuleBySetPosStage(rrule.bySetPos))
  }

  return stages
}

/**
 * Executes an RFC 5545 RRULE expansion pipeline.
 * Passes the anchor date through each transformation stage sequentially.
 *
 * @param anchor - The starting PlainDate for the expansion
 * @param stages - Pipeline stages to apply in order
 * @returns Sorted, deduplicated array of expanded candidates
 * @see https://tools.ietf.org/html/rfc5545#section-3.6.4
 */
function executeRRuleExpansionPipeline(
  anchor: Temporal.PlainDate,
  stages: RRuleExpansionStage[],
): Temporal.PlainDate[] {
  let candidates = [anchor]

  for (const stage of stages) {
    candidates = stage(candidates)
  }

  const seen = new Set<string>()
  return candidates.filter(c => {
    const key = c.toString()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
    .sort((a, b) => Temporal.PlainDate.compare(a, b))
}

/**
 * Expands a PlainDate anchor into all candidate PlainDates for the
 * current frequency period, applying BYxxx rules.
 * Returns a sorted array of PlainDate candidates.
 */
export function expandCandidates(
  anchor: Temporal.PlainDate,
  rrule: ICSRecurrenceRule
) {
  const stage = buildRRuleExpansionPipeline(rrule)
  return executeRRuleExpansionPipeline(anchor, stage)
}