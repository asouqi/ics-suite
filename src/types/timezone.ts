/**
 * ## Timezone Component
 *
 * Represents a VTIMEZONE component, which embeds timezone offset rules
 * directly in an .ics file. This allows the file to be interpreted
 * correctly without requiring the reader to have external timezone data.
 *
 * A VTIMEZONE component contains one or more STANDARD and DAYLIGHT
 * sub-components, each describing the UTC offset in effect during
 * a particular period of the year.
 *
 * Note: Many files rely on the TZID matching a known IANA timezone
 * identifier (e.g. America/New_York) rather than embedding full rules.
 * ics-suite resolves both forms.
 *
 * @rfc RFC 5545, Section 3.6.5
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.5
 */

import type { ICSDateTime } from "./common"

/**
 * ## Timezone Observance Part
 *
 * Represents either a STANDARD or DAYLIGHT sub-component within a
 * VTIMEZONE block. Each observance defines the UTC offset and the
 * recurrence rule that determines when it takes effect.
 *
 * @rfc RFC 5545, Section 3.6.5
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.5
 *
 * @example
 * BEGIN:DAYLIGHT
 * TZOFFSETFROM:-0500
 * TZOFFSETTO:-0400
 * TZNAME:EDT
 * DTSTART:19700308T020000
 * RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
 * END:DAYLIGHT
 */
export type ICSTimezoneObservance = {
    /**
     * The UTC offset in effect before this observance begins.
     * Used by the transition calculation to determine the exact
     * moment the new offset takes effect.
     *
     * @rfc RFC 5545, Section 3.8.3.3
     * @example -0500
     */
    tzOffsetFrom: string

    /**
     * The UTC offset that takes effect when this observance begins.
     *
     * @rfc RFC 5545, Section 3.8.3.4
     * @example -0400
     */
    tzOffsetTo: string

    /**
     * The abbreviation used to identify this timezone period.
     *
     * @rfc RFC 5545, Section 3.8.3.2
     * @example EDT
     */
    tzName?: string

    /**
     * The first datetime at which this observance take effect.
     * Combined with RRULE to determine all subsequent transition times.
     *
     * @rfc RFC 5545, Section 3.8.2.4
     */
    dtStart?: ICSDateTime

    /**
     * The recurrence rule defining when this observance repeats each year.
     * Stored as a raw string because timezone RRULEs are always simple
     * yearly patterns and do not require full expansion.
     *
     * @rfc RFC 5545, Section 3.8.2.4
     * @example RRULE:FREQ=YARLY;BYMONTH=3;BYDAY=2SU
     */
    rrule?: string
}

/**
 * ## Timezone
 *
 * Represents a complete VTIMEZONE component. Each timezone has a unique
 * TZID which is referenced by DTSTART, DTEND, and other datetime properties
 * elsewhere in the calendar file.
 *
 * A timezone typically defines two observances:
 * - STANDARD: the offset during winter / non-DST periods
 * - DAYLIGHT: the offset during summer / DST periods
 *
 * Timezones that do not observe daylight saving time contain only
 * a STANDARD observance.
 *
 * @rfc RFC 5545, Section 3.6.5
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.5
 *
 * @example
 * BEGIN:VTIMEZONE
 * TZID:America/New_York
 * BEGIN:STANDARD
 * ...
 * END:STANDARD
 * BEGIN:DAYLIGHT
 * ...
 * END:DAYLIGHT
 * END:VTIMEZONE
 */
export type ICSTimezone = {
    /**
     * The unique identifier for this timezone.
     * Should match an IANA timezone database identifier when possible.
     *
     * @rfc RFC 5545, Section 3.8.3.1
     * @example America/New_York
     */
    tzid: string

    /**
     * The observance in effect during standard (non-DST) time.
     *
     * @rfc RFC 5545, Section 3.6.5
     */
    standard?: ICSTimezoneObservance

    /**
     * The observance in effect during daylight saving time.
     * Absent for timezones that do not observe DST.
     *
     * @rfc RFC 5545, Section 3.6.5
     */
    daylight?: ICSTimezoneObservance
}