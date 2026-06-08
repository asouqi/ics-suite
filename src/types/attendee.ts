/**
 * ## Attendee and Organizer Types
 *
 * Types representing calendar participants as defined in RFC 5545.
 * Both ATTENDEE and ORGANIZER properties use a CAL-ADDRESS value type,
 * which is a mailto: URI identifying the participant.
 *
 * @rfc RFC 5545, Section 3.8.4
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4
 */

/**
 * ## Participation Status
 *
 * Indicates the participation status of an attendee in response to
 * a scheduling request. Valid values differ slightly by component type.
 *
 * - VEVENT: NEEDS-ACTION | ACCEPTED | DECLINED | TENTATIVE | DELEGATED
 * - VTODO: NEEDS-ACTION | ACCEPTED | DECLINED | TENTATIVE | DELEGATED | COMPLETED | IN-PROCESS
 * - VJOURNAL: NEEDS-ACTION | ACCEPTED | DECLINED
 *
 * @rfc RFC 5545, Section 3.2.12
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.12
 *
 * @example
 * ATTENDEE;PARTSTAT=ACCEPTED:mailto:alice@example.com
 */
export type ICSParticipationStatus =
    | 'NEEDS-ACTION'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'TENTATIVE'
    | 'DELEGATED'
    | 'COMPLETED'
    | 'IN-PROGRESS'

/**
 * ## Attendee Role
 *
 * Defines the role of an attendee within a calendar component.
 * Affects how scheduling systems handle the attendee's response.
 *
 * @rfc RFC 5545, Section 3.2.16
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.16
 *
 * @example
 * ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:bob@example.com
 */
export type ICSRole =
    | 'CHAIR'
    | 'REQ-PARTICIPANT'
    | 'OPT-PARTICIPANT'
    | 'NON-PARTICIPANT'

/**
 * ## Calendar User Type
 *
 * Identifies what kind of entity an attendee represents.
 * Helps scheduling systems handle group invites, room bookings,
 * and resource requests differently from individual attendees.
 *
 * @rfc RFC 5545, Section 3.2.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.3
 *
 * @example
 * ATTENDEE;CUTYPE=ROOM:mailto:boardroom@example.com
 */
export type ICSCUTyp =
    | 'INDIVIDUAL'
    | 'GROUP'
    | 'RESOURCE'
    | 'ROOM'
    | 'UNKNOWN'

/**
 * ## Attendee
 *
 * Represents a participant in a calendar component. Each attendee is
 * identified by a mailto: URI and may carry scheduling metadata via
 * parameters on the ATTENDEE property.
 *
 * @rfc RFC 5545, Section 3.8.4.1
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.1
 *
 * @example
 * ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:alice@example.com
 */
export type ICSAttendee = {
    /** The email address extracted from the mailto: URI */
    email: string

    /**
     * Common name — the display name of the attendee.
     *
     * @rfc RFC 5545, Section 3.2.2 — CN parameter
     */
    name?: string

    /**
     * The role of this attendee in the event.
     * Defaults to REQ-PARTICIPANT when absent.
     *
     * @rfc RFC 5545, Section 3.2.16 — ROLE parameter
     */
    role?: ICSRole

    /**
     * The current participation status of this attendee.
     * Defaults to NEEDS-ACTION when absent.
     *
     * @rfc RFC 5545, Section 3.2.12 — PARTSTAT
     */
    status?: ICSParticipationStatus

    /**
     * The type of calendar user this attendee represents.
     * Defaults to INDIVIDUAL when absent.
     *
     * @rfc RFC 5545, Section 3.2.3 — CUTYPE parameter
     */
    cutype?: ICSCUTyp

    /**
     * Whether the attendee is expected to reply to the invitation.
     *
     * @rfc RFC 5545, Section 3.2.17 — RSVP parameter
     */
    rsvp?: boolean

    /**
     * Email addresses of attendees this participant has delegated to.
     *
     * @rfc RFC 5545, Section 3.2.4 — DELEGATED-TO parameter
     */
    delegatedTo?: string[]

    /**
     * Email addresses of attendees who delegated to this participant.
     *
     * @rfc RFC 5545, Section 3.2.5 — DELEGATED-FROM parameter
     */
    delegatedFrom?: string[]
}

/**
 * ## Organizer
 *
 * Represents the person or entity who created or owns the calendar component.
 * The organizer is responsible for sending scheduling requests to attendees.
 *
 * Unlike ATTENDEE, the ORGANIZER property carries fewer parameters —
 * it identifies the owner, not a participant.
 *
 * @rfc RFC 5545, Section 3.8.4.3
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.3
 *
 * @example
 * ORGANIZER;CN=Alice:mailto:alice@example.com
 */
export type ICSOrganizer = {
    /** The email address extracted from the mailto: URI */
    email: string

    /**
     * Common name — the display name of the organizer
     */
    name?: string
}