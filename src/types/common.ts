/**
 * ## Common Value Types
 *
 * Shared primitive types used across all iCalendar components.
 * These correspond to the value types defined in RFC 5545 Section 3.3.
 *
 * @rfc RFC 5545, Section 3.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3
 */


/**
 * ## Date Value
 *
 * Represents a calendar date with no time or timezone component.
 * Used for all-day events where no specific time is relevant.
 *
 * @rfc RFC 5545, Section 3.3.4
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.4
 *
 * @example
 * // January 1, 2024
 * DTSTART;VALUE=DATE:20240101
 */
export type ICSDate = {
    year: number
    month: number
    day: number
}

/**
 * ## Date-Time Value
 *
 * Represents a precise moment in time, optionally associated with a timezone.
 * Three forms are defined by the RFC:
 *
 * - Floating: no timezone, interpreted in local time wherever it is read
 * - UTC: suffixed with Z, always unambiguous
 * - With TZID: paired with a timezone identifier parameter
 *
 * @rfc RFC 5545, Section 3.3.5
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.5
 *
 * @example
 * // UTC
 * DTSTART:20240101T090000Z
 *
 * // With timezone
 * DTSTART;TZID=America/New_York:20240101T090000
 */
export type ICSDateTime = {
    year: number
    month: number
    day: number
    minute: number
    second: number
    /** True when value is expressed in UTC, indicated by a trailing Z */
    utc: boolean
    /** The TZID parameter value when the time is expressed in a named
     * timezone.
     * Absent for UTC and floating times.
     *
     * @example America/New_York
     * */
    tzid?: string
}

/**
 * ## Date or Date-Time Value
 *
 * A discriminated union representing a value that can be either a
 * calendar date or a precise datetime. The RFC allows both forms
 * for properties like DTSTART and DTEND.
 *
 * Use the `utc`, `hour`, `minute`, `second` fields to distinguish at runtime:
 * an ICSDate will not have time fields.
 *
 * @rfc RFC 5545, Section 3.3.4 and 3.3.5
 */
export type ICSDateOrDateTime = ICSDate | ICSDateTime

/**
 * ## Duration Value
 *
 * Represents a span of time used in properties like DURATION and TRIGGER.
 * Durations may be positive or negative. A negative duration on a TRIGGER
 * means the alarm fires before the event starts.
 *
 * @rfc RFC 5545, Section 3.3.6
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.6
 *
 * @example
 * // 1 day and 2 hours
 * DURATION:P1DT2H
 *
 * // 15 minutes before event (negative trigger)
 * TRIGGER:-PT15M
 */
export type ICSDuration = {
    weeks?: number
    days?: number
    hours?: number
    minutes?: number
    seconds?: number
    /** True when the duration is negative, used in TRIGGER to fire before an event */
    negative: boolean
}

/**
 * ## Geographic Position
 *
 * A latitude and longitude pair attached to an event or todo via the GEO property.
 * Values are decimal degrees, positive north and east.
 *
 * @rfc RFC 5545, Section 3.8.1.6
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.6
 *
 * @example
 * GEO:37.386013;-122.082932
 */
export type ICSGeo = {
    lat: number
    lon: number
}

/**
 * ## Access Classification
 *
 * Defines the access level of a calendar component. Used to indicate
 * whether the entry is meant to be shared publicly, kept private, or
 * treated as confidential within an organization.
 *
 * @rfc RFC 5545, Section 3.8.1.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.3
 *
 * @example
 * CLASS:PRIVATE
 */
export type ICSClass = 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL'

/**
 * ## Component Status
 *
 * Defines the overall status of an event, todo, or journal entry.
 * Valid values differ by component type:
 *
 * - VEVENT: TENTATIVE | CONFIRMED | CANCELLED
 * - VTODO: NEEDS-ACTION | COMPLETED | IN-PROCESS | CANCELLED
 * - VJOURNAL: DRAFT | FINAL | CANCELLED
 *
 * @rfc RFC 5545, Section 3.8.1.11
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.11
 *
 * @example
 * STATUS:CONFIRMED
 */
export type ICSStatus =
    | 'TENTATIVE'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'NEEDS-ACTION'
    | 'COMPLETED'
    | 'IN-PROGRESS'
    | 'DRAFT'
    | 'FINAL'

/**
 * ## Free/Busy Time Type
 *
 * Classifies a period of time in a VFREEBUSY component, indicating
 * whether the time slot is available or occupied.
 *
 * @rfc RFC 5545, Section 3.2.9
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.9
 *
 * @example
 * FREEBUSY;FBTYPE=BUSY:19970901T130000Z/19970901T140000Z
 */
export type ICSFreeBusyType =
    | 'FRRE'
    | 'BUSY'
    | 'BUSY-UNAVAILABLE'
    | 'BUSY-TENTATIVE'

/**
 * ## Extended Property
 *
 * Represents any non-standard property prefixed with X- as permitted
 * by the RFC for vendor-specific extensions. All major vendors use these:
 * Google uses X-GOOGLE-*, Apple uses X-APPLE-*, Outlook uses X-MICROSOFT-*.
 *
 * Unknown properties encountered during parsing are stored here rather
 * than dropped, ensuring no data is lost and round-trip fidelity is preserved.
 *
 * @rfc RFC 5545, Section 3.8.8.2
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.8.2
 *
 * @example
 * X-GOOGLE-CONFERENCE:https://meet.google.com/abc-defg-hij
 */
export type ICSExtendedProperty = {
    /** The full property name including the X- prefix */
    name: string
    value: string
    /** Any parameters present on the property line */
    params: Record<string, string>
}