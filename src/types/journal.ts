/**
 * ## Journal Component
 *
 * Represents a VJOURNAL component — a dated journal entry or note
 * associated with a calendar. Journals do not have a time duration
 * and are not used for scheduling.
 *
 * In practice, VJOURNAL is rarely emitted by major calendar applications
 * but is included in ics-suite for complete RFC 5545 compliance.
 *
 * @rfc RFC 5545, Section 3.6.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.3
 */

import type { ICSAttendee, ICSOrganizer } from "./attendee"
import type {
    ICSClass,
    ICSDateOrDateTime,
    ICSExtendedProperty,
    ICSStatus,
} from "./common"
import type { ICSRecurrenceRule } from "./recurrence"

/**
 * ## Journal
 *
 * A VJOURNAL component representing a dated note or record.
 *
 * Required properties: UID, DTSTAMP
 *
 * @rfc RFC 5545, Section 3.6.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.3
 */
export type ICSJournal = {
    /**
     * A globally unique identifier for this journal entry.
     *
     * @rfc RFC 5545, Section 3.8.4.7
     */
    uid: string

    /**
     * the datetime at which the journal was created in the calendar system.
     * Must be in UTC.
     *
     * @rfc RFC 5545, Section 3.8.7.2
     */
    dtStamp: ICSDateOrDateTime

    /**
     * The date or associated with this journal entry.
     * Unlike VEVENT, VJOURNAL does not have an end date.
     *
     * @rfc RFC 5545, Section 3.8.2.4
     */
    dtStart: ICSDateOrDateTime

    /**
     * The title of the journal entry.
     *
     * @rfc RFC 5545, Section 3.8.1.12
     */
    summary?: string

    /**
     * The body text of the journal entry.
     * A single journal component may have multiple DESCRIPTION properties.
     *
     * @rfc RFC 5545, Section 3.8.1.5
     */
    description?: string[]

    /**
     * One or more comments associated with the jounral entry.
     *
     * @rfc RFC 5545, Section 3.8.1.4
     */
    comment?: string[]

    /**
     * The workflow status of the journal entry.
     * Valid values for VJOURNAL: DRAFT | FINAL | CANCELLED
     *
     * @rfc RFC 5545, Section 3.8.1.11
     */
    status?: ICSStatus

    /**
     * The access classification of the journal entry.
     *
     * @rfc RFC 5545, Section 3.8.1.3
     */
    class?: ICSClass

    /**
     * A list of categories or tags associated with the journal entry.
     *
     * @rfc RFC 5545, Section 3.8.1.2
     */
    categories?: string[]

    /**
     * The recurrence rule for a repeating journal entry.
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
     *
     * @rfc RFC 5545, Section 3.8.5.1
     */
    exDate?: ICSDateOrDateTime[]

    /**
     * Present when this entry is a modified instance of a recurring series.
     *
     * @rfc RFC 5545, Section 3.8.4.4
     */
    recurrenceId?: ICSDateOrDateTime

    /**
     * The person or entity who created the journal entry.
     *
     * @rfc RFC 5545, Section 3.8.4.3
     */
    organizer?: ICSOrganizer

    /**
     * Participants assigned with this journal entry.
     *
     * @rfc RFC 5545, Section 3.8.4.1
     */
    attendees?: ICSAttendee[]

    /**
     * The datetime at which the journal entry was first crated by the user.
     *
     * @rfc RFC 5545, Section 3.8.7.1
     */
    created?: ICSDateOrDateTime

    /**
     * The datetime at which the journal entry was last modified.
     *
     * @rfc RFC 5545, Section 3.8.7.3
     */
    lastModified?: ICSDateOrDateTime

    /**
     * A monotonically incrementing revision number.
     *
     * @rfc RFC 5545, Section 3.8.7.4
     */
    sequence?: number

    /**
     * Non-standard X- prefixed properties preserved form the original file.
     *
     * @rfc RFC 5545, Section 3.8.8.2
     */
    extended?: ICSExtendedProperty[]
}