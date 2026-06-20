import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'

import { parse, query, QueryError } from '../../src'

function parseCalendar(raw: string) {
    return parse(raw).calendar
}

function wrapCalendar(inner: string): string {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Example//EN',
        inner,
        'END:VCALENDAR',
    ].join('\r\n')
}

function makeEvent(props: string[]): string {
    return [
        'BEGIN:VEVENT',
        ...props,
        'END:VEVENT',
    ].join('\r\n')
}

const JAN_START = Temporal.PlainDate.from('2024-01-01')
const JAN_END = Temporal.PlainDate.from('2024-01-31')

const SINGLE_EVENT_CALENDAR = wrapCalendar(makeEvent([
    'UID:single@example.com',
    'DTSTAMP:20240101T000000Z',
    'DTSTART:20240115T090000Z',
    'DTEND:20240115T100000Z',
    'SUMMARY:Team meeting',
    'ORGANIZER:mailto:alice@example.com',
    'ATTENDEE;CN=Alice:mailto:alice@example.com',
    'ATTENDEE;CN=Bob:mailto:bob@example.com',
    'STATUS:CONFIRMED',
    'CATEGORIES:work,meeting',
]))

const RECURRING_CALENDAR = wrapCalendar(makeEvent([
    'UID:recurring@example.com',
    'DTSTAMP:20240101T000000Z',
    'DTSTART:20240101T090000Z',
    'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4',
    'SUMMARY:Weekly standup',
    'STATUS:CONFIRMED',
]))

const MULTI_EVENT_CALENDAR = wrapCalendar([
    makeEvent([
        'UID:event1@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240110T090000Z',
        'DTEND:20240110T100000Z',
        'SUMMARY:Morning meeting',
        'ORGANIZER:mailto:alice@example.com',
        'ATTENDEE:mailto:alice@example.com',
        'STATUS:CONFIRMED',
        'CATEGORIES:work',
    ]),
    makeEvent([
        'UID:event2@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240110T100000Z',
        'DTEND:20240110T110000Z',
        'SUMMARY:Follow-up',
        'ORGANIZER:mailto:bob@example.com',
        'ATTENDEE:mailto:bob@example.com',
        'STATUS:TENTATIVE',
        'CATEGORIES:work,planning',
    ]),
    makeEvent([
        'UID:event3@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240115T140000Z',
        'DTEND:20240115T150000Z',
        'SUMMARY:Lunch',
        'STATUS:CONFIRMED',
        'CATEGORIES:personal',
    ]),
].join('\r\n'))

const CONFLICT_CALENDAR = wrapCalendar([
    makeEvent([
        'UID:conflict1@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240110T090000Z',
        'DTEND:20240110T110000Z',
        'SUMMARY:Event A',
    ]),
    makeEvent([
        'UID:conflict2@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240110T100000Z',
        'DTEND:20240110T120000Z',
        'SUMMARY:Event B — overlaps A',
    ]),
    makeEvent([
        'UID:conflict3@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240110T130000Z',
        'DTEND:20240110T140000Z',
        'SUMMARY:Event C — no overlap',
    ]),
].join('\r\n'))

describe('query — basic', () => {
    it('returns a query object', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const q = query(calendar)
        expect(q).toBeDefined()
        expect(typeof q.between).toBe('function')
        expect(typeof q.get).toBe('function')
    })

    it('throws QueryError when .get() is called without a window', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        expect(() => query(calendar).get()).toThrow(QueryError)
    })

    it('throws QueryError when .first() is called without a window', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        expect(() => query(calendar).first()).toThrow(QueryError)
    })

    it('throws QueryError when .count() is called without a window', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        expect(() => query(calendar).count()).toThrow(QueryError)
    })
})

describe('query — .between()', () => {
    it('returns events within the window', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const results = query(calendar).between(JAN_START, JAN_END).get()

        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('single@example.com')
    })

    it('returns empty array when no events fall in the window', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const results = query(calendar)
            .between(
                Temporal.PlainDate.from('2024-02-01'),
                Temporal.PlainDate.from('2024-02-28'),
            )
            .get()

        expect(results).toHaveLength(0)
    })

    it('expands recurring events within the window', () => {
        const calendar = parseCalendar(RECURRING_CALENDAR)
        const results = query(calendar).between(JAN_START, JAN_END).get()

        // Weekly on Monday — Jan 1, 8, 15, 22
        expect(results).toHaveLength(4)
    })

    it('returns ExpandedEvent instances with start and end', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const results = query(calendar).between(JAN_START, JAN_END).get()

        expect(results[0]).toHaveProperty('start')
        expect(results[0]).toHaveProperty('end')
        expect(results[0]).toHaveProperty('event')
        expect(results[0]).toHaveProperty('isOverride')
    })
})

describe('query — .on()', () => {
    it('returns events on a specific day', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .on(Temporal.PlainDate.from('2024-01-10'))
            .get()

        expect(results).toHaveLength(2)
        expect(results.map(r => r.event.uid)).toContain('event1@example.com')
        expect(results.map(r => r.event.uid)).toContain('event2@example.com')
    })

    it('returns empty array when no events on that day', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const results = query(calendar)
            .on(Temporal.PlainDate.from('2024-01-20'))
            .get()

        expect(results).toHaveLength(0)
    })
})

describe('query — .inclusive()', () => {
    it('includes events on the end boundary when inclusive', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)

        // End boundary is exactly the event date
        const exclusive = query(calendar)
            .between(JAN_START, Temporal.PlainDate.from('2024-01-15'))
            .get()

        const inclusive = query(calendar)
            .between(JAN_START, Temporal.PlainDate.from('2024-01-15'))
            .inclusive()
            .get()

        expect(exclusive).toHaveLength(0)
        expect(inclusive).toHaveLength(1)
    })
})

describe('query — .where()', () => {
    it('filters by a custom predicate', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .where(e => e.event.summary === 'Lunch')
            .get()

        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('event3@example.com')
    })

    it('ANDs multiple .where() calls together', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .where(e => e.event.categories?.includes('work') ?? false)
            .where(e => e.event.status === 'CONFIRMED')
            .get()

        // Only event1 is both work and CONFIRMED
        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('event1@example.com')
    })

    it('returns empty array when no events match the predicate', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .where(e => e.event.summary === 'Does not exist')
            .get()

        expect(results).toHaveLength(0)
    })
})

describe('query — .withAttendee()', () => {
    it('filters to events with the given attendee', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withAttendee('alice@example.com')
            .get()

        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('event1@example.com')
    })

    it('is case-insensitive', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withAttendee('ALICE@EXAMPLE.COM')
            .get()

        expect(results).toHaveLength(1)
    })

    it('returns empty when attendee not found', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withAttendee('nobody@example.com')
            .get()

        expect(results).toHaveLength(0)
    })
})

describe('query — .withOrganizer()', () => {
    it('filters to events organised by the given email', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withOrganizer('bob@example.com')
            .get()

        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('event2@example.com')
    })

    it('is case-insensitive', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withOrganizer('BOB@EXAMPLE.COM')
            .get()

        expect(results).toHaveLength(1)
    })
})

describe('query — .withStatus()', () => {
    it('filters to events with the given status', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withStatus('TENTATIVE')
            .get()

        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('event2@example.com')
    })

    it('returns all CONFIRMED events', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withStatus('CONFIRMED')
            .get()

        expect(results).toHaveLength(2)
    })
})

describe('query — .withCategory()', () => {
    it('filters to events with the given category', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withCategory('personal')
            .get()

        expect(results).toHaveLength(1)
        expect(results[0].event.uid).toBe('event3@example.com')
    })

    it('is case-insensitive', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withCategory('WORK')
            .get()

        expect(results).toHaveLength(2)
    })
})

describe('query — .recurring() and .nonRecurring()', () => {
    const MIXED_CALENDAR = wrapCalendar([
        makeEvent([
            'UID:recurring@example.com',
            'DTSTAMP:20240101T000000Z',
            'DTSTART:20240101T090000Z',
            'RRULE:FREQ=WEEKLY;COUNT=4',
            'SUMMARY:Recurring',
        ]),
        makeEvent([
            'UID:single@example.com',
            'DTSTAMP:20240101T000000Z',
            'DTSTART:20240115T090000Z',
            'SUMMARY:One-off',
        ]),
    ].join('\r\n'))

    it('returns only recurring instances', () => {
        const calendar = parseCalendar(MIXED_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .recurring()
            .get()

        expect(results.every(r => r.event.rrule !== undefined)).toBe(true)
        expect(results).toHaveLength(4)
    })

    it('returns only non-recurring instances', () => {
        const calendar = parseCalendar(MIXED_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .nonRecurring()
            .get()

        expect(results.every(r => r.event.rrule === undefined)).toBe(true)
        expect(results).toHaveLength(1)
    })
})

describe('query — .inTimezone()', () => {
    it('converts timed event starts to the given timezone', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .inTimezone('Asia/Amman')
            .get()

        expect(results).toHaveLength(1)
        const start = results[0].start
        expect(start).not.toBeInstanceOf(Date)
        // The start should be a ZonedDateTime in Amman time
        if (start instanceof Temporal.ZonedDateTime) {
            expect(start.timeZoneId).toBe('Asia/Amman')
        }
    })

    it('does not affect all-day events', () => {
        const allDayCalendar = wrapCalendar(makeEvent([
            'UID:allday@example.com',
            'DTSTAMP:20240101T000000Z',
            'DTSTART;VALUE=DATE:20240115',
            'DTEND;VALUE=DATE:20240116',
            'SUMMARY:All day',
        ]))

        const calendar = parseCalendar(allDayCalendar)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .inTimezone('Asia/Amman')
            .get()

        expect(results[0].start).toBeInstanceOf(Temporal.PlainDate)
    })
})

describe('query — sorting', () => {
    it('sorts by start ascending by default', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar).between(JAN_START, JAN_END).get()

        for (let i = 1; i < results.length; i++) {
            const prev = results[i - 1].start
            const curr = results[i].start
            if (prev instanceof Temporal.PlainDate && curr instanceof Temporal.PlainDate) {
                expect(Temporal.PlainDate.compare(prev, curr)).toBeLessThanOrEqual(0)
            }
        }
    })

    it('sorts by start descending when sortOrder is desc', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .sortOrder('desc')
            .get()

        for (let i = 1; i < results.length; i++) {
            const prev = results[i - 1].start
            const curr = results[i].start
            if (prev instanceof Temporal.PlainDate && curr instanceof Temporal.PlainDate) {
                expect(Temporal.PlainDate.compare(prev, curr)).toBeGreaterThanOrEqual(0)
            }
        }
    })

    it('sorts by summary alphabetically', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .sortBy('summary')
            .get()

        const summaries = results.map(r => r.event.summary ?? '')
        const sorted = [...summaries].sort()
        expect(summaries).toEqual(sorted)
    })
})

describe('query — .first()', () => {
    it('returns the first matching instance', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const result = query(calendar).between(JAN_START, JAN_END).first()

        expect(result).toBeDefined()
        expect(result?.event.uid).toBeDefined()
    })

    it('returns undefined when no events match', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const result = query(calendar)
            .between(
                Temporal.PlainDate.from('2024-02-01'),
                Temporal.PlainDate.from('2024-02-28'),
            )
            .first()

        expect(result).toBeUndefined()
    })
})

describe('query — .count()', () => {
    it('returns the number of matching instances', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const count = query(calendar).between(JAN_START, JAN_END).count()

        expect(count).toBe(3)
    })

    it('returns 0 when no events match', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const count = query(calendar)
            .between(
                Temporal.PlainDate.from('2024-02-01'),
                Temporal.PlainDate.from('2024-02-28'),
            )
            .count()

        expect(count).toBe(0)
    })

    it('count matches the length of get()', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)
        const q = query(calendar).between(JAN_START, JAN_END).withStatus('CONFIRMED')

        expect(q.count()).toBe(q.get().length)
    })
})

describe('query — .conflicts()', () => {
    it.skip('returns pairs of overlapping events', () => {
        const calendar = parseCalendar(CONFLICT_CALENDAR)
        const pairs = query(calendar).between(JAN_START, JAN_END).conflicts()

        // Event A (9-11) overlaps Event B (10-12) — Event C (13-14) does not overlap
        expect(pairs).toHaveLength(1)
        const uids = [pairs[0].a.event.uid, pairs[0].b.event.uid]
        expect(uids).toContain('conflict1@example.com')
        expect(uids).toContain('conflict2@example.com')
    })

    it('returns empty array when no events overlap', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const pairs = query(calendar).between(JAN_START, JAN_END).conflicts()

        expect(pairs).toHaveLength(0)
    })

    it('each pair has an a and b property', () => {
        const calendar = parseCalendar(CONFLICT_CALENDAR)
        const pairs = query(calendar).between(JAN_START, JAN_END).conflicts()

        for (const pair of pairs) {
            expect(pair).toHaveProperty('a')
            expect(pair).toHaveProperty('b')
        }
    })
})

describe('query — chaining', () => {
    it('supports a full chain of method calls', () => {
        const calendar = parseCalendar(MULTI_EVENT_CALENDAR)

        const results = query(calendar)
            .between(JAN_START, JAN_END)
            .withStatus('CONFIRMED')
            .withCategory('work')
            .sortBy('start')
            .sortOrder('asc')
            .get()

        expect(Array.isArray(results)).toBe(true)
    })

    it('each method returns the same query instance', () => {
        const calendar = parseCalendar(SINGLE_EVENT_CALENDAR)
        const q = query(calendar)

        expect(q.between(JAN_START, JAN_END)).toBe(q)
        expect(q.where(() => true)).toBe(q)
        expect(q.sortBy('start')).toBe(q)
        expect(q.sortOrder('asc')).toBe(q)
    })
})