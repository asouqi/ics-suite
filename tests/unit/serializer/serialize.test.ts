import { describe, expect, it } from 'vitest'
import { serialize } from '../../../src/serializer/serialize'
import type { ICSCalendar } from '../../../src/types'

describe('serialize - ICSCalendar', () => {
    it('serializes a minimal calendar', () => {
        const calendar: ICSCalendar = {
            prodId: '-//My App//My Calendar//EN',
            version: '2.0',
            events: [],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('BEGIN:VCALENDAR')
        expect(ics).toContain('PRODID:-//My App//My Calendar//EN')
        expect(ics).toContain('VERSION:2.0')
        expect(ics).toContain('END:VCALENDAR')
        expect(ics).toMatch(/\r\n$/) // ends with CRLF
    })

    it('serializes a calendar with optional properties', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Google Inc//Google Calendar//EN',
            version: '2.0',
            calScale: 'GREGORIAN',
            method: 'PUBLISH',
            name: 'My Personal Calendar',
            description: 'Important events and meetings',
            timezone: 'America/New_York',
            color: '#FF5733',
            events: [],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('CALSCALE:GREGORIAN')
        expect(ics).toContain('METHOD:PUBLISH')
        expect(ics).toContain('X-WR-CALNAME:My Personal Calendar')
        expect(ics).toContain('X-WR-CALDESC:Important events and meetings')
        expect(ics).toContain('X-WR-TIMEZONE:America/New_York')
        expect(ics).toContain('COLOR:#FF5733')
    })

    it('serializes a calendar with a simple event', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: '123@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    dtStart: { year: 2024, month: 6, day: 15, hour: 14, minute: 0, second: 0, utc: false },
                    summary: 'Team Meeting',
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('BEGIN:VEVENT')
        expect(ics).toContain('UID:123@example.com')
        expect(ics).toContain('DTSTAMP:20240101T120000Z')
        expect(ics).toContain('DTSTART:20240615T140000')
        expect(ics).toContain('SUMMARY:Team Meeting')
        expect(ics).toContain('END:VEVENT')
    })

    it('serializes a calendar with multiple events', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'event1@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'First Event',
                },
                {
                    uid: 'event2@example.com',
                    dtStamp: { year: 2024, month: 1, day: 2, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'Second Event',
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2)
        expect(ics.match(/END:VEVENT/g)?.length).toBe(2)
        expect(ics).toContain('UID:event1@example.com')
        expect(ics).toContain('UID:event2@example.com')
    })

    it('serializes a calendar with todos', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [],
            todos: [
                {
                    uid: 'todo1@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    dtStart: { year: 2024, month: 6, day: 15, hour: 9, minute: 0, second: 0, utc: false },
                    summary: 'Complete project',
                    due: { year: 2024, month: 6, day: 30, hour: 17, minute: 0, second: 0, utc: false },
                    percentComplete: 50,
                },
            ],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('BEGIN:VTODO')
        expect(ics).toContain('UID:todo1@example.com')
        expect(ics).toContain('SUMMARY:Complete project')
        expect(ics).toContain('DUE:20240630T170000')
        expect(ics).toContain('PERCENT-COMPLETE:50')
        expect(ics).toContain('END:VTODO')
    })

    it('serializes a calendar with journals', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [],
            todos: [],
            journals: [
                {
                    uid: 'journal1@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    dtStart: { year: 2024, month: 6, day: 15, hour: 9, minute: 0, second: 0, utc: false },
                    summary: 'Daily Journal',
                    description: ['Today was productive', 'Completed three tasks'],
                },
            ],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('BEGIN:VJOURNAL')
        expect(ics).toContain('UID:journal1@example.com')
        expect(ics).toContain('SUMMARY:Daily Journal')
        expect(ics).toContain('DESCRIPTION:Today was productive')
        expect(ics).toContain('DESCRIPTION:Completed three tasks')
        expect(ics).toContain('END:VJOURNAL')
    })

    it('serializes a calendar with timezones', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [],
            todos: [],
            journals: [],
            timezones: [
                {
                    tzid: 'America/New_York',
                    standard: {
                        tzOffsetFrom: '-0400',
                        tzOffsetTo: '-0500',
                        tzName: 'EST',
                    },
                    daylight: {
                        tzOffsetFrom: '-0500',
                        tzOffsetTo: '-0400',
                        tzName: 'EDT',
                    },
                },
            ],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('BEGIN:VTIMEZONE')
        expect(ics).toContain('TZID:America/New_York')
        expect(ics).toContain('BEGIN:STANDARD')
        expect(ics).toContain('TZOFFSETTO:-0500')
        expect(ics).toContain('END:STANDARD')
        expect(ics).toContain('BEGIN:DAYLIGHT')
        expect(ics).toContain('TZOFFSETTO:-0400')
        expect(ics).toContain('END:DAYLIGHT')
        expect(ics).toContain('END:VTIMEZONE')
    })

    it.skip('serializes a calendar with an event containing attendees', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'meeting@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'Team Sync',
                    attendees: [
                        {
                            email: 'alice@example.com',
                            name: 'Alice',
                            role: 'REQ-PARTICIPANT',
                            status: 'ACCEPTED',
                            rsvp: true,
                        },
                        {
                            email: 'bob@example.com',
                            name: 'Bob',
                            role: 'OPT-PARTICIPANT',
                            status: 'TENTATIVE',
                        },
                    ],
                    organizer: {
                        email: 'manager@example.com',
                        name: 'Manager',
                    },
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('ORGANIZER;CN=Manager:mailto:manager@example.com')
        expect(ics).toContain('ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE:mailto:alice@example.com')
        expect(ics).toContain('ATTENDEE;CN=Bob;ROLE=OPT-PARTICIPANT;PARTSTAT=TENTATIVE:mailto:bob@example.com')
    })

    it.skip('serializes a calendar with an event containing alarms', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'event-with-alarm@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'Important Meeting',
                    alarms: [
                        {
                            action: 'DISPLAY',
                            trigger: { minutes: 15, negative: true },
                            triggerRelation: 'START',
                            description: 'Meeting starts in 15 minutes',
                        },
                        {
                            action: 'AUDIO',
                            trigger: { hours: 1, negative: true },
                            triggerRelation: 'START',
                        },
                    ],
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics.match(/BEGIN:VALARM/g)?.length).toBe(2)
        expect(ics).toContain('ACTION:DISPLAY')
        expect(ics).toContain('TRIGGER;RELATED=START:-PT15M')
        expect(ics).toContain('DESCRIPTION:Meeting starts in 15 minutes')
        expect(ics).toContain('ACTION:AUDIO')
        expect(ics).toContain('TRIGGER;RELATED=START:-PT1H')
    })

    it('serializes a calendar with recurring event', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'recurring@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    dtStart: { year: 2024, month: 6, day: 15, hour: 14, minute: 0, second: 0, utc: false },
                    summary: 'Weekly Team Meeting',
                    rrule: {
                        freq: 'WEEKLY',
                        count: 10,
                        byDay: [{ day: 'MO' }, { day: 'WE' }, { day: 'FR' }],
                    },
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=10;BYDAY=MO,WE,FR')
    })

    it('serializes a calendar with event containing recurrence exceptions', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'recurring-with-exceptions@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'Daily Standup',
                    rrule: { freq: 'DAILY' },
                    exDate: [
                        { year: 2024, month: 6, day: 20, hour: 9, minute: 0, second: 0, utc: false },
                        { year: 2024, month: 6, day: 21, hour: 9, minute: 0, second: 0, utc: false },
                    ],
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('RRULE:FREQ=DAILY')
        expect(ics).toContain('EXDATE:20240620T090000')
        expect(ics).toContain('EXDATE:20240621T090000')
    })

    it('serializes a complete calendar with all component types', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Complete//Calendar//EN',
            version: '2.0',
            name: 'Complete Calendar',
            events: [
                {
                    uid: 'event@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'Event',
                },
            ],
            todos: [
                {
                    uid: 'todo@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    dtStart: { year: 2024, month: 6, day: 15, hour: 9, minute: 0, second: 0, utc: false },
                    summary: 'Todo',
                },
            ],
            journals: [
                {
                    uid: 'journal@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    dtStart: { year: 2024, month: 6, day: 15, hour: 9, minute: 0, second: 0, utc: false },
                    summary: 'Journal',
                },
            ],
            timezones: [
                {
                    tzid: 'UTC',
                    standard: {
                        tzOffsetFrom: '+0000',
                        tzOffsetTo: '+0000',
                    },
                },
            ],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('BEGIN:VCALENDAR')
        expect(ics).toContain('BEGIN:VEVENT')
        expect(ics).toContain('BEGIN:VTODO')
        expect(ics).toContain('BEGIN:VJOURNAL')
        expect(ics).toContain('BEGIN:VTIMEZONE')
        expect(ics).toContain('END:VTIMEZONE')
        expect(ics).toContain('END:VJOURNAL')
        expect(ics).toContain('END:VTODO')
        expect(ics).toContain('END:VEVENT')
        expect(ics).toContain('END:VCALENDAR')
    })

    it('escapes special characters in text values', () => {
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'escape-test@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    summary: 'Meeting; with, special\\characters\nand newlines',
                    description: 'Line 1\nLine 2',
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        expect(ics).toContain('SUMMARY:Meeting\\; with\\, special\\\\characters\\nand newlines')
        expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2')
    })

    it('folds long lines correctly', () => {
        const longDescription = 'A'.repeat(200)
        const calendar: ICSCalendar = {
            prodId: '-//Test//Test//EN',
            version: '2.0',
            events: [
                {
                    uid: 'long-line@example.com',
                    dtStamp: { year: 2024, month: 1, day: 1, hour: 12, minute: 0, second: 0, utc: true },
                    description: longDescription,
                },
            ],
            todos: [],
            journals: [],
            timezones: [],
        }

        const ics = serialize(calendar)

        // Should contain line continuation (CRLF + space)
        expect(ics).toContain('\r\n ')

        // Each line should not exceed 75 characters
        const lines = ics.split('\r\n')
        for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(75)
        }
    })
})