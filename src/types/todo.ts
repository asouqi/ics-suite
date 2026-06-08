/**
 * ## Todo Component
 *
 * Represents a VTODO component — a task or action item associated with
 * a calendar. Unlike VEVENT, a todo does not have to occupy a fixed time slot.
 * It may have a due date, a start date, or no date at all.
 *
 * Todos can be recurring and can track completion percentage,
 * making them suitable for representing tasks in project or GTD workflows.
 *
 * @rfc RFC 5545, Section 3.6.2
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.2
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
import type { ICSRecurrenceRule } from "./recurrence"

/**
 * ## Todo
 *
 * A VTODO component representing a task or action item.
 *
 * Required properties: UID, DTSTAMP
 *
 * Either `due` or `duration` may be specified to indicate when the task
 * should be completed, but not both. If `duration` is present, `dtStart`
 * must also be present.
 *
 * @rfc RFC 5545, Section 3.6.2
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.2
 */
export type ICSTodo = {
    /**
     * A globally unique identifier for this todo.
     *
     * @rfc RFC 5545, Section 3.8.4.7
     */
    uid: string

    /**
     * the datetime at which the todo was created in the calendar system.
     * Must be in UTC.
     *
     * @rfc RFC 5545, Section 3.8.7.2
     */
    dtStamp: ICSDateOrDateTime

    /**
     * The date or datetime at which the todo begins.
     * Required when `duration` is present.
     *
     * @rfc RFC 5545, Section 3.8.2.4
     */
    dtStart: ICSDateOrDateTime

    /**
     * The date or datetime by which to todo must be completed.
     * Mutually exclusive with `duration`.
     *
     * @rfc RFC 5545, Section 3.8.2.3
     */
    due?: ICSDateOrDateTime

    /**
     * The duration of the todo as an alternative to specifying DUE.
     * Mutually exclusive with `due`. Requires `dtStart` to be present.
     *
     * @rfc RFC 5545, Section 3.8.2.5
     */
    duration?: ICSDuration

    /**
     * The datetime at which the todo was completed.
     * Should only be present when `status` is COMPLETED.
     *
     * @rfc RFC 5545, Section 3.8.2.1
     */
    completed?: ICSDateOrDateTime

    /**
     * The title of the todo.
     *
     * @rfc RFC 5545, Section 3.8.1.12
     */
    summary?: string

    /**
     * A detailed description of the todo.
     *
     * @rfc RFC 5545, Section 3.8.1.5
     */
    description?: string

    /**
     * A human-readable location associated with the todo.
     *
     * @rfc RFC 5545, Section 3.8.1.7
     */
    location?: string

    /**
     * The geographic coordinates associated with the todo.
     *
     * @rfc RFC 5545, Section 3.8.1.6
     */
    geo?: ICSGeo

    /**
     * A URL associated with the todo.
     *
     * @rfc RFC 5545, Section 3.8.4.6
     */
    url?: string

    /**
     * The completion or workflow status of the todo.
     * Valid values for VTODO: NEEDS-ACTION | COMPLETED | IN-PROCESS | CANCELLED
     *
     * @rfc RFC 5545, Section 3.8.1.11
     */
    status?: ICSStatus

    /**
     * The access classification of the todo.
     *
     * @rfc RFC 5545, Section 3.8.1.3
     */
    class?: ICSClass

    /**
     * The priority of the todo on a scale of 0 to 9.
     * 0 means undefined. 1 is te highest priority. 9 is the lowset.
     *
     * @rfc RFC 5545, Section 3.8.1.9
     */
    priority?: number

    /**
     * A list of categories or tags associated with the todo.
     *
     * @rfc RFC 5545, Section 3.8.1.2
     */
    categories?: string[]

    /**
     * The percentage of the todo that has been completed.
     * Valid values: 0 to 100.
     *
     * @rfc RFC 5545, Section 3.8.1.8
     */
    percentComplete?: number

    /**
     * The recurrence rule for a repeating todo.
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
     * Present when this todo is a modified instance of a recurring series.
     *
     * @rfc RFC 5545, Section 3.8.4.4
     */
    recurrenceId?: ICSDateOrDateTime

    /**
     * The person or entity who created or owns the todo.
     *
     * @rfc RFC 5545, Section 3.8.4.3
     */
    organizer?: ICSOrganizer

    /**
     * The participants assigned to or associated with the todo.
     *
     * @rfc RFC 5545, Section 3.8.4.1
     */
    attendees?: ICSAttendee[]

    /**
     * The datetime at which the todo was first crated by the user.
     *
     * @rfc RFC 5545, Section 3.8.7.1
     */
    created?: ICSDateOrDateTime

    /**
     * The datetime at which the todo was last modified.
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
     * Alarms (reminders) attached to this todo.
     *
     * @rfc RFC 5545, Section 3.6.6
     */
    alarms?: ICSAlarm[]

    /**
     * Non-standard X- prefixed properties preserved form the original file.
     *
     * @rfc RFC 5545, Section 3.8.8.2
     */
    extended?: ICSExtendedProperty[]
}