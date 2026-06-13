import {parseAttendee, parseOrganizer, parseRRule} from "../../parser/assembler";
import {escapeText, serializeRecurrenceRule} from "../../serializer/util";
import {ICSJournal} from "../../types";
import {PropertyHandlers as P } from "../property";

import {BasedComponent} from "./base";

export class Journal extends BasedComponent<ICSJournal> {
    readonly componentType = 'VJOURNAL'

    protected readonly propertyMap = {
        UID: P.string('uid'),
        DTSTAMP: P.dateTime('dtStamp'),
        DTSTART: P.dateTime('dtStart'),
        SUMMARY: P.string('summary'),
        DESCRIPTION: P.addValue('description'),
        STATUS: P.string('status'),
        CLASS: P.string('class'),
        CATEGORIES: P.custom<ICSJournal>({
            parse: (data, value) => {
                data.categories = value.split(',').map((c) => c.trim())
            },
            toICS: (data) => {
                return data.categories && data.categories.length > 0
                    ? [{ value: data.categories.map(escapeText).join(',') }]
                    : null
            }
        }),
        CREATED: P.dateTime('created'),
        'LAST-MODIFIED': P.dateTime('lastModified'),
        SEQUENCE: P.int('sequence'),
        RRULE: P.custom<ICSJournal>({
            parse: (data, value) => {
                data.rrule = parseRRule(value)
            },
            toICS: (data) => {
                return data.rrule ? [{ value: serializeRecurrenceRule(data.rrule) }] : null
            }
        }),
        EXDATE: P.addDateTime('exDate'),
        'RECURRENCE-ID': P.dateTime('recurrenceId'),
        ORGANIZER: P.custom<ICSJournal>({
            parse: (data, value, params) => {
                data.organizer = parseOrganizer(value, params)
            },
            toICS: (data) => {
                if (!data.organizer) return null
                const params: Record<string, string> = {}
                if (data.organizer.name) params.CN = data.organizer.name
                return [{ value: `mailto:${data.organizer.email}`, params }]
            }
        }),
        ATTENDEE: P.custom<ICSJournal>({
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

                    return { value: `mailto:${attendee.email}`, params }
                })
            }
        }),
        COMMENT: P.addValue('comment'),
    }
}