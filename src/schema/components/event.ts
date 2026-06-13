import {parseAttendee, parseOrganizer, parseRRule} from "../../parser/assembler";
import {escapeText, serializeRecurrenceRule} from "../../serializer/util";
import {ICSEvent} from "../../types";
import {PropertyHandlers as P } from "../property";

import {BasedComponent} from "./base";

export class Event extends BasedComponent<ICSEvent> {
    readonly componentType = 'VEVENT'

    protected readonly propertyMap = {
        UID: P.string('uid'),
        DTSTAMP: P.dateTime('dtStamp'),
        DTSTART: P.dateTime('dtStart'),
        DTEND: P.dateTime('dtEnd'),
        DURATION: P.duration('duration'),
        SUMMARY: P.string('summary'),
        DESCRIPTION: P.string('description'),
        LOCATION: P.string('location'),
        URL: P.string('url'),
        STATUS: P.string('status'),
        CLASS: P.string('class'),
        PRIORITY: P.int('priority'),
        TRANSP: P.string('transp'),
        SEQUENCE: P.int('sequence'),
        CREATED: P.dateTime('created'),
        'LAST-MODIFIED': P.dateTime('lastModified'),
        RRULE: P.custom<ICSEvent>({
            parse: (data, value) => {
                data.rrule = parseRRule(value)
            },
            toICS: (value) => {
                return value.rrule ?
                    [{ value: serializeRecurrenceRule(value.rrule) }] : null
            }
        }),
        EXDATE: P.addDateTime('exDate'),
        RDATE: P.addDateTime('rDate'),
        'RECURRENCE-ID': P.dateTime('recurrenceId'),
        ORGANIZER: P.custom<ICSEvent>({
            parse: (data, value, params) => {
                data.organizer = parseOrganizer(value, params)
            },
            toICS: (data) => {
                if (!data.organizer) return null
                const params: Record<string, string> = {}
                if (data.organizer.name) params.CN = data.organizer.name

                return [{
                    value: `mailto:${data.organizer.email}`,
                    params: Object.keys(params).length > 0 ? params : undefined
                }]
            }
        }),
        ATTENDEE: P.custom<ICSEvent>({
            parse: (data, value, params) => {
                data.attendees = data.attendees ?? []
                data.attendees.push(parseAttendee(value, params))
            },
            toICS:  (data) => {
                const attendees = data.attendees ?? []
                if (attendees.length === 0) return null

                return attendees.map(attendee => {
                    const params: Record<string, string> = {}
                    if (attendee.name) params.CN = attendee.name
                    if (attendee.role) params.ROLE = attendee.role
                    if (attendee.status) params.PARTSTAT = attendee.status
                    if (attendee.cutype) params.CUTYPE = attendee.cutype
                    if (attendee.rsvp !== undefined) params.RSVP = attendee.rsvp ? 'TRUE' : 'FALSE'
                    if (attendee.delegatedTo) {
                        params['DELEGATED-TO'] = attendee.delegatedTo.map(e => `mailto:${e}`).join(',')
                    }
                    if (attendee.delegatedFrom) {
                        params['DELEGATED-FROM'] = attendee.delegatedFrom.map(e => `mailto:${e}`).join(',')
                    }

                    return { value: `mailto:${attendee.email}`, params }
                })
            }
        }),
        CATEGORIES: P.custom<ICSEvent>({
            parse: (data, value) => {
                data.categories = value.split(',').map((c) => c.trim())
            },
            toICS: (value) => {
                return value.categories ?
                    [{value: value.categories.map(escapeText).join(',')}] : null
            }
        }),
        COLOR: P.string('color'),
        GEO: P.custom<ICSEvent>({
            parse: (data, value) => {
                const [lat, lon] = value.split(';').map(Number)
                data.geo = { lat, lon }
            },
            toICS: (value) => {
                return value.geo ? [{ value: `${value.geo.lat};${value.geo.lon}` }] : null
            }
        }),
        COMMENT: P.addValue('comment'),
    }
}