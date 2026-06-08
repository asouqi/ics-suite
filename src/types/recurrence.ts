/**
 * ## Recurrence Types
 *
 * Types representing the recurrence model defined in RFC 5545.
 * Recurrence allows a single calendar component to represent
 * a repeating series of occurrences without storing each one separately.
 *
 * Three properties together define the full recurrence model:
 * - RRULE: the pattern rule
 * - EXDATE: dates to exclude from the expansion
 * - RECURRENCE-ID: marks a component as an override of one instance
 *
 * @rfc RFC 5545, Section 3.8.5
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5
 */

import { ICSDateOrDateTime } from "./common"

/**
 * ## Recurrence Frequency
 *
 * The base unit of repetition for a recurrence rule.
 * All other rule parts filter or refine this base frequency.
 *
 * @rfc RFC 5545, Section 3.3.10 — FREQ rule part
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10
 *
 * @example
 * RRULE:FREQ=WEEKLY
 */
export type ICSFrequency =
    | 'SECONDLY'
    | 'MINUTELY'
    | 'HOURLY'
    | 'DAILY'
    | 'WEEKLY'
    | 'MONTHLY'
    | 'YEARLY'

/**
 * ## Week Day
 *
 * A two-letter abbreviation representing a day of the week.
 * Used in BYDAY and WKST rule parts.
 *
 * @rfc RFC 5545, Section 3.3.10 — BYDAY rule part
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10
 */
export type ICSWeekDay = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

/**
 * ## BYDAY Entry
 *
 * A weekday optionally prefixed with an ordinal integer.
 * When an ordinal is present, it selects a specific occurrence of
 * that day within the frequency period.
 *
 * @rfc RFC 5545, Section 3.3.10 — BYDAY rule part
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10
 *
 * @example
 * // Every Monday
 * BYDAY=MO         → { day: 'MO' }
 *
 * // The last Friday of the month
 * BYDAY=-1FR       → { ordinal: -1, day: 'FR' }
 *
 * // The second Tuesday of the year
 * BYDAY=2TU        → { ordinal: 2, day: 'TU' }
 */
export type ICSByDay = {
    /**
     * Selects the Nth occurrence of the weekday within the period.
     * Positive values count from the start, negative from the end.
     * Absent when the rule means every occurrence of that weekday.
     */
    ordinal?: number
    day: ICSWeekDay
}

/**
 * ## Recurrence Rule
 *
 * Defines the pattern by which a calendar component repeats over time.
 * A single RRULE can express patterns ranging from simple ("every day")
 * to complex ("the last Friday of every month until December 31").
 *
 * The expansion algorithm works by:
 * 1. Generating candidate dates at the base FREQ interval
 * 2. Filtering by BYxxx rule parts in the order defined by the RFC
 * 3. Applying BYSETPOS to select from the filtered set
 * 4. Stopping when COUNT or UNTIL is reached
 *
 * @rfc RFC 5545, Section 3.8.5.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.3
 *
 * @example
 * // Every weekday for 10 occurrences
 * RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;COUNT=10
 *
 * // The last Friday of every month
 * RRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1
 */
export type ICSRecurrenceRule = {
    /**
     * The base frequency of repetition.
     * Required every PRULE must have a FREQ.
     *
     * @rfc RFC 5545, Section 3.3.10 — FREQ rule part
     */
    freq: ICSFrequency

    /**
     * The inclusive end boundary of the recurrence.
     * No occurrences are generated after this date.
     * Mutually exclusive with `count`.
     *
     * @rfc RFC 5545, Section 3.3.10 — UNTIL rule part
     */
    until?: ICSDateOrDateTime

    /**
     * The total number of occurrences to generate including the first.
     * Mutually exclusive with `until`.
     *
     * Node: dates excluded via EXDATE do not count against this total.
     *
     * @rfc RFC 5545, Section 3.3.10 — COUNT rule part
     */
    count?: number

    /**
     * The interval between occurrences in unites of FREQ.
     * Defaults to 1 when absent.
     *
     * @rfc RFC 5545, Section 3.3.10 — INTERVAL rule part
     * @example RRULE:FREQ=WEEKLY;INTERVAL=2 — every two weeks
     */
    interval?: number

    /**
     * Filters occurrences to those within the specified seconds of a minute.
     * Valid values: 0-60
     *
     * @rfc RFC 5545, Section 3.3.10 — BYSECOND rule part
     */
    bySecond?: number[]

    /**
     * Filters occurrences to those within the specified minutes of an hour.
     * Valid values: 0-59
     *
     * @rfc RFC 5545, Section 3.3.10 — BYMINUTE rule part
     */
    byMinute?: number[]

    /**
     * Filters occurrences to those within the specified hours of a day.
     * Valid values: 0-23
     *
     * @rfc RFC 5545, Section 3.3.10 — BYHOUR rule part
     */
    byHour?: number[]

    /**
     * Filters occurrences to the specified weekdays.
     * When used with MONTHLY or YEARLY, each entry may include an ordinal
     * to select a specific occurrence of that weekday within the period.
     *
     * @rfc RFC 5545, Section 3.3.10 — BYDAY rule part
     * @example BYDAY=MO,FR — every Monday and Friday
     */
    byDay?: ICSByDay[]

    /**
     * Fillers occurrences to the specified days of the month.
     * Positive values count from the start, negative from the end.
     * Valid values: 1-31 and -31 to -1
     *
     * @rfc RFC 5545, Section 3.3.10 — BYMONTHDAY rule part
     * @example BYMONTHDAY=15,-1 — the 15th and the last day of the month
     */
    byMonthDay?: number[]

    /**
     * Filters occurrences to the specified days of the year.
     * Positive values count from the start, negative from the end.
     * Valid values: 1-366 and -366 to -1
     *
     * @rfc RFC 5545, Section 3.3.10 — BYYEARDAY rule part
     */
    byYearDay?: number[]

    /**
     * Filters occurrences to the specified ISO week numbers of the year.
     * Positive values count from the start of the year, negative from the end.
     * Valid values: 1-53 and -53 to -1
     *
     * @rfc RFC 5545, Section 3.3.10 — BYWEEKNO rule part
     */
    byWeekNo?: number[]

    /**
     * Filters occurrences to the specified months of the year.
     * Valid values: 1 (January) through 12 (December)
     *
     * @rfc RFC 5545, Section 3.3.10 — BYMONTH rule part
     * @example BYMONTH=1,7 — January and July only
     */
    byMonth?: number[]

    /**
     * Selects specific occurrences from the set generated by BYxx rules.
     * Applied after all other BYxx filters. Positive values count from
     * the start of the set, negative from the end.
     *
     * @rfc RFC 5545, Section 3.3.10 — BYSETPOS rule part
     * @example BYSETPOS=-1 — the last occurrences in the set
     */
    bySetPos?: number[]

    /**
     * Defines which day of the week the week starts on.
     * Affects the interpretation of BYWEEKENO and BYDAY with WEEKLY frequency.
     * Defaults to Monday when absent.
     *
     * @rfc RFC 5545, Section 3.3.10 — WKST rule part
     */
    weekStart?: ICSWeekDay
}