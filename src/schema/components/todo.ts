import {parseAttendee, parseOrganizer, parseRRule} from "../../parser/assembler";
import {escapeText, serializeRecurrenceRule} from "../../serializer/util";
import {ICSTodo} from "../../types";
import {PropertyHandlers as P } from "../property";

import {BasedComponent} from "./base";

export class Todo extends BasedComponent<ICSTodo> {
    readonly componentType = 'VTODO'

    protected readonly propertyMap = {
        UID: P.string('uid'),
        DTSTAMP: P.dateTime('dtStamp'),
        DTSTART: P.dateTime('dtStart'),
        DUE: P.dateTime('due'),
        DURATION: P.duration('duration'),
        COMPLETED: P.dateTime('completed'),
        SUMMARY: P.string('summary'),
        DESCRIPTION: P.string('description'),
        LOCATION: P.string('location'),
        URL: P.string('url'),
        STATUS: P.string('status'),
        CLASS: P.string('class'),
        PRIORITY: P.int('priority'),
        SEQUENCE: P.int('sequence'),
        'PERCENT-COMPLETE': P.int('percentComplete'),
        CREATED: P.dateTime('created'),
        'LAST-MODIFIED': P.dateTime('lastModified'),
        RRULE: P.custom<ICSTodo>({
            parse: (data, value) => {
                data.rrule = parseRRule(value)
            },
            toICS: (data) => {
                return data.rrule ? [{ value: serializeRecurrenceRule(data.rrule) }] : null
            }
        }),
        EXDATE: P.addDateTime('exDate'),
        'RECURRENCE-ID': P.dateTime('recurrenceId'),
        ORGANIZER: P.custom<ICSTodo>({
            parse: (data, value, params) => {
                data.organizer = parseOrganizer(value, params)
            },
            toICS:  (data) => {
                if (!data.organizer) return null
                const params: Record<string, string> = {}
                if (data.organizer.name) params.CN = data.organizer.name
                return [{ value: `mailto:${data.organizer.email}`, params }]
            }
        }),
        ATTENDEE: P.custom<ICSTodo>({
            parse: (data, value, params) => {
                data.attendees = data.attendees ?? []
                data.attendees.push(parseAttendee(value, params))
            },
            toICS: (data) => {
                const attendees = data.attendees ?? []
                if (attendees.length === 0) return null

                return attendees.map(attendee => {
                    const params: Record<string, string> = {}
                    if (attendee.name) params.CN = attendee.name
                    if (attendee.role) params.ROLE = attendee.role
                    if (attendee.status) params.PARTSTAT = attendee.status
                    if (attendee.cutype) params.CUTYPE = attendee.cutype
                    if (attendee.rsvp !== undefined) params.RSVP = attendee.rsvp ? 'TRUE' : 'FALSE'

                    return { value: `mailto:${attendee.email}`, params }
                })
            }
        }),
        CATEGORIES: P.custom<ICSTodo>({
            parse: (data, value) => {
                data.categories = value.split(',').map((c) => c.trim())
            },
            toICS: (data) => {
                return data.categories && data.categories.length > 0
                    ? [{ value: data.categories.map(escapeText).join(',') }]
                    : null
            }
        }),
    }
}