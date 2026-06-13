import { describe, expect, it } from 'vitest'

import {parse} from "../src"
import { serialize } from '../src/serializer/serialize'

describe('Round-trip: Parse → Serialize', () => {
    it('round-trips a minimal calendar', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Calendar//EN',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)

        expect(output).toContain('BEGIN:VCALENDAR')
        expect(output).toContain('VERSION:2.0')
        expect(output).toContain('PRODID:-//Test//Calendar//EN')
        expect(output).toContain('END:VCALENDAR')

        const { calendar: reparsed } = parse(output)
        expect(reparsed.version).toBe('2.0')
        expect(reparsed.prodId).toBe('-//Test//Calendar//EN')
    })

    it('round-trips a calendar with metadata', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Google Inc//Google Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:My Calendar',
            'X-WR-CALDESC:My personal calendar',
            'X-WR-TIMEZONE:America/New_York',
            'COLOR:#FF5733',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        expect(reparsed.prodId).toBe('-//Google Inc//Google Calendar//EN')
        expect(reparsed.calScale).toBe('GREGORIAN')
        expect(reparsed.method).toBe('PUBLISH')
        expect(reparsed.name).toBe('My Calendar')
        expect(reparsed.description).toBe('My personal calendar')
        expect(reparsed.timezone).toBe('America/New_York')
        expect(reparsed.color).toBe('#FF5733')
    })

    it('round-trips a simple event', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:simple-event@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T140000',
            'DTEND:20240615T150000',
            'SUMMARY:Team Meeting',
            'DESCRIPTION:Weekly sync',
            'LOCATION:Room 101',
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        expect(reparsed.events).toHaveLength(1)
        const event = reparsed.events![0]

        expect(event.uid).toBe('simple-event@example.com')
        expect(event.summary).toBe('Team Meeting')
        expect(event.description).toBe('Weekly sync')
        expect(event.location).toBe('Room 101')
        expect(event.status).toBe('CONFIRMED')

        expect(event.dtStamp).toEqual({
            year: 2024,
            month: 1,
            day: 1,
            hour: 12,
            minute: 0,
            second: 0,
            utc: true,
        })

        expect(event.dtStart).toEqual({
            year: 2024,
            month: 6,
            day: 15,
            hour: 14,
            minute: 0,
            second: 0,
            utc: false,
        })
    })

    it('round-trips an all-day event', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:all-day@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART;VALUE=DATE:20240615',
            'DTEND;VALUE=DATE:20240616',
            'SUMMARY:All Day Event',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]
        expect(event.dtStart).toEqual({ year: 2024, month: 6, day: 15 })
        expect(event.dtEnd).toEqual({ year: 2024, month: 6, day: 16 })

        expect(output).toContain('DTSTART;VALUE=DATE:20240615')
        expect(output).toContain('DTEND;VALUE=DATE:20240616')
    })

    it('round-trips an event with timezone', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:tz-event@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART;TZID=America/New_York:20240615T140000',
            'DTEND;TZID=America/New_York:20240615T150000',
            'SUMMARY:Meeting in NY',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]
        expect(event.dtStart).toMatchObject({
            year: 2024,
            month: 6,
            day: 15,
            hour: 14,
            minute: 0,
            second: 0,
            tzid: 'America/New_York',
        })

        expect(output).toContain('DTSTART;TZID=America/New_York:20240615T140000')
    })

    it('round-trips an event with attendees and organizer', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:meeting@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T140000Z',
            'SUMMARY:Team Sync',
            'ORGANIZER;CN=Manager:mailto:manager@example.com',
            'ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE:mailto:alice@example.com',
            'ATTENDEE;CN=Bob;ROLE=OPT-PARTICIPANT;PARTSTAT=TENTATIVE:mailto:bob@example.com',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]

        expect(event.organizer).toEqual({
            email: 'manager@example.com',
            name: 'Manager',
        })

        expect(event.attendees).toHaveLength(2)
        expect(event.attendees![0]).toMatchObject({
            email: 'alice@example.com',
            name: 'Alice',
            role: 'REQ-PARTICIPANT',
            status: 'ACCEPTED',
            rsvp: true,
        })
        expect(event.attendees![1]).toMatchObject({
            email: 'bob@example.com',
            name: 'Bob',
            role: 'OPT-PARTICIPANT',
            status: 'TENTATIVE',
        })
    })

    it('round-trips an event with alarms', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:event-with-alarms@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T140000Z',
            'SUMMARY:Important Meeting',
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            'TRIGGER:-PT15M',
            'DESCRIPTION:Meeting in 15 minutes',
            'END:VALARM',
            'BEGIN:VALARM',
            'ACTION:AUDIO',
            'TRIGGER;RELATED=END:-PT5M',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]
        expect(event.alarms).toHaveLength(2)

        expect(event.alarms![0]).toMatchObject({
            action: 'DISPLAY',
            trigger: { minutes: 15, negative: true },
            description: 'Meeting in 15 minutes',
        })

        expect(event.alarms![1]).toMatchObject({
            action: 'AUDIO',
            trigger: { minutes: 5, negative: true },
            triggerRelation: 'END',
        })

        // Verify output
        expect(output).toContain('TRIGGER:-PT15M')
        expect(output).toContain('TRIGGER;RELATED=END:-PT5M')
    })

    it('round-trips a recurring event', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:recurring@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T140000Z',
            'SUMMARY:Weekly Meeting',
            'RRULE:FREQ=WEEKLY;COUNT=10;BYDAY=MO,WE,FR',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]
        expect(event.rrule).toEqual({
            freq: 'WEEKLY',
            count: 10,
            byDay: [{ day: 'MO' }, { day: 'WE' }, { day: 'FR' }],
        })

        expect(output).toContain('RRULE:FREQ=WEEKLY;COUNT=10;BYDAY=MO,WE,FR')
    })

    it('round-trips a recurring event with exceptions', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:recurring-with-exceptions@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T090000Z',
            'SUMMARY:Daily Standup',
            'RRULE:FREQ=DAILY;COUNT=30',
            'EXDATE:20240620T090000Z',
            'EXDATE:20240621T090000Z',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]
        expect(event.exDate).toHaveLength(2)
        expect(event.exDate![0]).toEqual({
            year: 2024,
            month: 6,
            day: 20,
            hour: 9,
            minute: 0,
            second: 0,
            utc: true,
        })
    })

    it('round-trips a todo', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VTODO',
            'UID:todo@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T090000Z',
            'DUE:20240630T170000Z',
            'SUMMARY:Complete project',
            'PERCENT-COMPLETE:50',
            'STATUS:IN-PROGRESS',
            'END:VTODO',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        expect(reparsed.todos).toHaveLength(1)
        const todo = reparsed.todos![0]

        expect(todo.uid).toBe('todo@example.com')
        expect(todo.summary).toBe('Complete project')
        expect(todo.percentComplete).toBe(50)
        expect(todo.status).toBe('IN-PROGRESS')
    })

    it('round-trips a journal entry', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VJOURNAL',
            'UID:journal@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T090000Z',
            'SUMMARY:Daily Journal',
            'DESCRIPTION:First entry',
            'DESCRIPTION:Second entry',
            'END:VJOURNAL',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        expect(reparsed.journals).toHaveLength(1)
        const journal = reparsed.journals![0]

        expect(journal.uid).toBe('journal@example.com')
        expect(journal.summary).toBe('Daily Journal')
        expect(journal.description).toEqual(['First entry', 'Second entry'])
    })

    it('round-trips special characters in text fields', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:escape-test@example.com',
            'DTSTAMP:20240101T120000Z',
            'SUMMARY:Meeting\\; with\\, special\\\\chars\\nand newlines',
            'DESCRIPTION:Line 1\\nLine 2\\nLine 3',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        const event = reparsed.events![0]
        expect(event.summary).toBe('Meeting; with, special\\chars\nand newlines')
        expect(event.description).toBe('Line 1\nLine 2\nLine 3')

        expect(output).toContain('SUMMARY:Meeting\\; with\\, special\\\\chars\\nand newlines')
        expect(output).toContain('DESCRIPTION:Line 1\\nLine 2\\nLine 3')
    })

    it('round-trips a complete calendar with multiple component types', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Complete//Calendar//EN',
            'X-WR-CALNAME:Complete Calendar',
            'BEGIN:VEVENT',
            'UID:event@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T140000Z',
            'SUMMARY:Event',
            'END:VEVENT',
            'BEGIN:VTODO',
            'UID:todo@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T090000Z',
            'SUMMARY:Todo',
            'END:VTODO',
            'BEGIN:VJOURNAL',
            'UID:journal@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T090000Z',
            'SUMMARY:Journal',
            'END:VJOURNAL',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar } = parse(input)
        const output = serialize(calendar)
        const { calendar: reparsed } = parse(output)

        expect(reparsed.name).toBe('Complete Calendar')
        expect(reparsed.events).toHaveLength(1)
        expect(reparsed.todos).toHaveLength(1)
        expect(reparsed.journals).toHaveLength(1)

        expect(reparsed.events![0].summary).toBe('Event')
        expect(reparsed.todos![0].summary).toBe('Todo')
        expect(reparsed.journals![0].summary).toBe('Journal')
    })

    it('preserves data through multiple round-trips', () => {
        const input = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Test//Test//EN',
            'BEGIN:VEVENT',
            'UID:stable@example.com',
            'DTSTAMP:20240101T120000Z',
            'DTSTART:20240615T140000Z',
            'SUMMARY:Stability Test',
            'DESCRIPTION:Should remain stable',
            'PRIORITY:5',
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n')

        const { calendar: calendar1 } = parse(input)
        const output1 = serialize(calendar1)

        const { calendar: calendar2 } = parse(output1)
        const output2 = serialize(calendar2)

        const { calendar: calendar3 } = parse(output2)

        expect(calendar1.events![0].uid).toBe(calendar3.events![0].uid)
        expect(calendar1.events![0].summary).toBe(calendar3.events![0].summary)
        expect(calendar1.events![0].description).toBe(calendar3.events![0].description)
        expect(calendar1.events![0].priority).toBe(calendar3.events![0].priority)
    })
})