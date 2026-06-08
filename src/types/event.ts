/**
 * ## Event Component
 *
 * Represents a VEVENT component — the primary building block of a calendar file.
 * An event describes a scheduled activity with a start time, optional end time
 * or duration, and associated metadata.
 *
 * Events may be one-time or recurring. Recurring events are represented by a
 * single VEVENT with an RRULE. Individual instances of a recurring series that
 * have been modified are represented as separate VEVENT components with a
 * RECURRENCE-ID pointing to the original instance they replace.
 *
 * @rfc RFC 5545, Section 3.6.1
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */

import type { ICSAlarm } from "./alarm"
import type { ICSAttendee, ICSOrganizer } from "./attendee"
import type {
    ICSClass,
    ICSDateOrDateTime,
    ICSDuration,
    ICSExtendedProperty,
    ICSGeo,
    ICSStatus,
} from "./common"
import { ICSRecurrenceRule } from "./recurrence"

/**
 * ## Event
 *
 * A VEVENT component representing a single event or the base definition
 * of a recurring series.
 *
 * Required properties: UID, DTSTAMP
 * Strongly recommended: DTSTART
 *
 * @rfc RFC 5545, Section 3.6.1
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1
 */
export type ICSEvent = {
    /**
     * A gloablly unique identifier for this event.
     * Must be the same across all instances of a recurring series.
     * Used to match RECURRENCE-ID overrides to their base event.
     *
     * @rfc RFC 5545, Section 3.8.4.7
     * @example 7b6c2a3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d@example.com
     */
    uid: string

    /**
     * The datetime at which the event was created in the calendar system.
     * Set automatically by the calendar application, not the user.
     * Must be in UTC.
     *
     * @rfc RFC 5545, Section 3.8.7.2
     */
    dtStamp: ICSDateOrDateTime

    /**
     * The start date or datetime of the event.
     * For all-day events, this is a DATE value (no time component).
     * For timed events, this is a DATA-TIME value.
     *
     * @rfc RFC 5545, Section 3.8.2.4
     */
    dtStart?: ICSDateOrDateTime

    /**
     * The end date or datetime of the event.
     * Must be later than DTSTART.
     * Mutually exclusive with `duration`.
     *
     * For all-day events, DTEND is the non-inclusive end date -
     * a one-day event starting on Jan 1 has DTEND of Jan 2.
     *
     * @rfc RFC 5545, Section 3.8.2.2
     */
    dtEnd?: ICSDateOrDateTime

    /**
     * The duration of the event as an alternative to specifying DTEND.
     * Mutually exclusive with `dtEnd`.
     *
     * @rfc RFC 5545, Section 3.8.2.5
     * @example P1DT2H - 1 day and 2 hours
     */
    duration?: ICSDuration

    /**
     * The title of the event as displayed in calendar applications.
     *
     * @rfc RFC 5545, Section 3.8.1.12
     * @example Team standup
     */
    summary?: string

    /**
     * A detailed description of the event.
     * May contain plain text or, a vendor extensions, HTML.
     *
     * @rfc RFC 5545, Section 3.8.1.5
     */
    description?: string

    /**
     * A human-readable location for the event.
     *
     * @rfc RFC 5545, Section 3.8.1.7
     * @example Conference Room B
     */
    location?: string

    /**
     * The geographic coordinates of the event location.
     *
     * @rfc RFC 5545, Section 3.8.1.6
     */
    geo?: ICSGeo

    /**
     * A URL associated with the event, such as a meeting link.
     *
     * @rfc RFC 5545, Section 3.8.4.6
     */
    url?: string

    /**
     * One or more comments intended for the calendar user.
     *
     * @rfc RFC 5545, Section 3.8.1.4
     */
    comment?: string[]

    /**
     * The overall confirmation status of the event.
     * Valid values for VEVENT: TENTATIVE | CONFIRMED | CANCELLED
     *
     * @rfc RFC 5545, Section 3.8.1.11
     */
    status?: ICSStatus

    /**
     * The access classification of the event.
     *
     * @rfc RFC 5545, Section 3.8.1.3
     */
    class?: ICSClass

    /**
     * The priority of the event on a scale of 0 to 9.
     * 0 means undefined. 1 is the highest priority. 9 is the lowset.
     *
     * @rfc RFC 5545, Section 3.8.1.9
     */
    priority?: number

    /**
     * A list of categories or tags associated with the event.
     *
     * @rfc RFC 5545, Section 3.8.1.2
     * @example ['work', 'meeting']
     */
    categories?: string[]

    /**
     * A CSS color name or hex value for display in calendar applications.
     * Defined in RFC 7986, an extension to RFC 5545.
     *
     * @rfc RFC 7986, Section 5.9
     */
    color?: string

    /**
     * Whether the event consumes time on the calendar for free/busy searches.
     * OPAQUE means the time is marked as busy. TRANSPARENT means it is not.
     * Defaults to OPAQUE when absent.
     *
     * @rfc RFC 5545, Section 3.8.2.7
     */
    transp?: 'OPAQUE' | 'TRANSPARENT'

    /**
     * The recurrence rule defining how this event repeats.
     * When present, this event is the base of a recurring series.
     *
     * @rfc RFC 5545, Section 3.8.5.3
     */
    rrule?: ICSRecurrenceRule

    /**
     * Additional explicit recurrence dates outside of the RRULE pattern.
     *
     * @rfc RFC 5545, Section 3.8.5.2
     */
    rDate?: ICSDateOrDateTime[]

    /**
     * Dates to exclude from the recurrence expansion.
     * Each date must match a date that would otherwise be generated by RRULE.
     *
     * @rfc RFC 5545, Section 3.8.5.1
     */
    exDate?: ICSDateOrDateTime[]

    /**
     * Present when this event is a modified instance of a recurring series.
     * The value is the original datetime of the instance being replaced.
     * Links this override back to its base event via matching UID.
     *
     * @rfc RFC 5545, Section 3.8.4.4
     */
    recurrenceId?: ICSDateOrDateTime

    /**
     * the person or entity who created or owns the event.
     *
     * @rfc RFC 5545, Section 3.8.4.3
     */
    organizer?: ICSOrganizer

    /**
     * The participants invited to the event.
     *
     * @rfc RFC 5545, Section 3.8.4.1
     */
    attendees?: ICSAttendee[]

    /**
     * The datetime at which the event was first created by the user.
     * Distinct from DTSTAMP, which is set by the calendar system.
     *
     * @rfc RFC 5545, Section 3.8.7.1
     */
    created?: ICSDateOrDateTime

    /**
     * The datetime at which the event was last modified.
     *
     * @rfc RFC 5545, Section 3.8.7.3
     */
    lastModified?: ICSDateOrDateTime

    /**
     * A monotonically incrementing revision number.
     * Incremented each time the event is modified and sent to attendees.
     *
     * @rfc RFC 5545, Section 3.8.7.4
     */
    sequence?: number

    /**
     * Alarms (reminders) attached to this event.
     * Each alarm fires at a time relative to the event start or end.
     *
     * @rfc RFC 5545, Section 3.6.6
     */
    alarms?: ICSAlarm[]

    /**
     * Non-standard X- prefixed properties preserved from the original file.
     * Includes vendor extensions from Google, Apple, Outlook, and others.
     *
     * @rfc RFC 5545, Section 3.8.8.2
     */
    extended?: ICSExtendedProperty[]
}

