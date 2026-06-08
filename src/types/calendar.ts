/**
 * ## Calendar Component
 *
 * Represents a VCALENDAR component — the top-level container for all
 * iCalendar data. Every valid .ics file contains exactly one VCALENDAR
 * block wrapping all other components.
 *
 * @rfc RFC 5545, Section 3.4
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.4
 */

import type { ICSEvent } from "./event"
import type { ICSJournal } from "./journal"
import type { ICSTimezone } from "./timezone"
import type { ICSTodo } from "./todo"

/**
 * ## Calendar Scale
 *
 * Defines the calendar system used by the calendar object.
 * RFC 5545 only defines GREGORIAN as a valid value. Non-Gregorian
 * calendar systems are handled by RFC 7529.
 *
 * @rfc RFC 5545, Section 3.7.1
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.1
 */
export type ICSCalendarScale = 'GREGORIAN'

/**
 * ## iTIP Method
 *
 * Defines the scheduling method when the calendar is used as a
 * meeting invitation or scheduling message per RFC 5546 (iTIP).
 *
 * When METHOD is present, the file is a scheduling message rather
 * than a simple calendar export. The method determines how receiving
 * calendar applications should process the content.
 *
 * - PUBLISH: broadcast event information, no reply expected
 * - REQUEST: invite attendees, RSVP expected
 * - REPLY: attendee response to a REQUEST
 * - CANCEL: cancel a previously sent event
 * - ADD: add instances to an existing recurring event
 * - REFRESH: request the latest version of an event
 * - COUNTER: propose a change to an event
 * - DECLINECOUNTER: reject a COUNTER proposal
 *
 * @rfc RFC 5546, Section 1.4
 * @see https://datatracker.ietf.org/doc/html/rfc5546#section-1.4
 *
 * @example
 * METHOD:REQUEST
 */
export type ICSMethod =
    | 'PUBLISH'
    | 'REQUEST'
    | 'REPLY'
    | 'ADD'
    | 'CANCEL'
    | 'COUNTER'
    | 'DECLINECOUNTER'

/**
 * ## Calendar
 *
 * The top-level object representing a parsed .ics file.
 * Contains all components extracted from the VCALENDAR block.
 *
 * Required properties: PRODID, VERSION
 *
 * @rfc RFC 5545, Section 3.4
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.4
 */
export type ICSCalendar = {
    /**
     * Identifies the product the crated the calendar file.
     * Follows a formal public identifier syntax.
     *
     * @rfc RFC 5545, Section 3.7.3
     * @exmple -//Google Inc//Google Calendar//EN
     */
    prodId: string

    /**
     * The iCalendar specification version.
     * Always "2.0" for RFC 5545 compliant files.
     *
     * @rfc RFC 5545, Section 3.7.4
     */
    version: string

    /**
     * The calendar system. Defaults to GREGORIAN when absent.
     *
     * @rfc RFC 5545, Section 3.7.1
     */
    calScale?: ICSCalendarScale

    /**
     * The iTIP scheduling method.
     * Present only when the file is a scheduling message, not a plain export.
     *
     * @rfc RFC 5545, Section 1.4
     */
    method?: ICSMethod

    /**
     * The display name of the calendar.
     * Defined as a vendor extension (X-WR-CALNAME) but universally supported
     * by Google Calendar, Apple Calendar, and Outlook.
     *
     * @nonstandard X-WR-CALNAME
     */
    name?: string

    /**
     * A description of the calendar.
     *
     * @nonstandard X-WR-CALNAME
     */
    description?: string

    /**
     * A CSS name or hex value of the calendar.
     * Defined in RFC 7986, an extension to RFC 5545.
     *
     * @rfc RFC 7986, Section 5.9
     */
    color?: string

    /**
     * The default timezone for floating datetime values in this calendar.
     * When a datetime has no TZID and is not UTC, this timezone is used.
     *
     * @nonstandard X-WR-CALNAME
     * @example America/New_York
     */
    timezone?: string

    /**
     * All VEVENT components found in this calendar.
     * Includes both recurring events and their instance overrides.
     *
     * @rfc RFC 5545, Section 3.6.1
     */
    events?: ICSEvent[]

    /**
     * All VTODO components found in this calendar.
     *
     * @rfc RFC 5545, Section 3.6.2
     */
    todos?: ICSTodo[]

    /**
     * All VJOURNAL components found in this calendar.
     *
     * @rfc RFC 5545, Section 3.6.3
     */
    journals: ICSJournal[]

    /**
     * All VTIMEZONE components found in this calendar.
     * Used to resolve TZID references in datetime properties.
     *
     * @rfc RFC 5545, Section 3.6.5
     */
    timezones: ICSTimezone[]
}