import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'

import { parse } from '../../src'
import { expand } from '../../src/expander'


function parseEvent(ics: string) {
  const { calendar } = parse(ics)
  return calendar.events![0]
}

function wrapEvent(props: string[]) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Example//EN',
    'BEGIN:VEVENT',
    ...props,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

const WINDOW_START = Temporal.PlainDate.from('2024-01-01')
const WINDOW_END = Temporal.PlainDate.from('2024-01-31')

describe('expand — non-recurring event', () => {
  it('returns a single instance when the event falls within the window', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:single@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240115T090000Z',
        'DTEND:20240115T100000Z',
        'SUMMARY:One-off event',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(1)
    expect(instances[0].event.uid).toBe('single@example.com')
    expect(instances[0].isOverride).toBe(false)
    expect(instances[0].override).toBeUndefined()
  })

  it('returns an empty array when the event falls outside the window', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:outside@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240215T090000Z',
        'DTEND:20240215T100000Z',
        'SUMMARY:February event',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(0)
  })

  it('returns an empty array when the event starts before the window', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:before@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20231215T090000Z',
        'DTEND:20231215T100000Z',
        'SUMMARY:December event',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(0)
  })

  it('returns a single instance for an all-day event within the window', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:allday@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART;VALUE=DATE:20240110',
        'DTEND;VALUE=DATE:20240111',
        'SUMMARY:All day event',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(1)
    expect(instances[0].start).toBeInstanceOf(Temporal.PlainDate)
  })
})

describe('expand — FREQ=DAILY', () => {
  it('returns the correct number of daily instances in a window', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:daily@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=31',
        'SUMMARY:Daily event',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END, inclusive: true })

    expect(instances).toHaveLength(31)
  })

  it('returns instances only within the window even when RRULE extends beyond', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:daily-long@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY',
        'SUMMARY:Infinite daily',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END, inclusive: true })

    expect(instances).toHaveLength(31)
    for (const instance of instances) {
      expect(instance.start.month).toBe(1)
    }
  })

  it('respects INTERVAL=2 — every other day', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:every-other@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;INTERVAL=2;COUNT=5',
        'SUMMARY:Every other day',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(5)
  })

  it('stops at COUNT', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:count@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=5',
        'SUMMARY:Five days',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(5)
  })

  it('stops at UNTIL', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:until@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;UNTIL=20240105T090000Z',
        'SUMMARY:Until Jan 5',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(5)
  })
})

describe('expand — FREQ=WEEKLY', () => {
  it('returns one instance per week', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:weekly@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=WEEKLY;COUNT=4',
        'SUMMARY:Weekly event',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(4)
  })

  it('expands BYDAY into multiple days per week', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:mwf@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z', // Monday Jan 1
        'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6',
        'SUMMARY:Mon Wed Fri',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    // Week 1: 1(Mo), 3(We), 5(Fr), Week 2: 8(Mo), 10(We), 12(Fr)
    expect(instances).toHaveLength(6)
  })

  it('respects INTERVAL=2 — every two weeks', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:biweekly@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3',
        'SUMMARY:Biweekly',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    // Jan 1, Jan 15, Jan 29
    expect(instances).toHaveLength(3)
  })
})

describe('expand — FREQ=MONTHLY', () => {
  it('returns one instance per month', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:monthly@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240115T090000Z',
        'RRULE:FREQ=MONTHLY;COUNT=3',
        'SUMMARY:Monthly on the 15th',
      ]),
    )
    const window = {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2024-03-31')
    }
    const instances = expand(event, window)

    // Jan 15, Fab 15, Mar 15
    expect(instances).toHaveLength(3)
  })

  it('expands BYDAY — first Monday of each month', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:first-monday@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=MONTHLY;BYDAY=1MO;COUNT=3',
        'SUMMARY:First Monday',
      ]),
    )
    const window = {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2024-03-31'),
    }
    const instances = expand(event, window)

    expect(instances).toHaveLength(3)
  })

  it('expands BYDAY — last Friday of each month via BYSETPOS', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:last-friday@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1;COUNT=3',
        'SUMMARY:Last Friday',
      ]),
    )
    const window = {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2024-03-31'),
    }
    const instances = expand(event, window)

    expect(instances).toHaveLength(3)
    // Jan last Friday = Jan 26, Feb last Friday = Feb 23, Mar last Friday = Mar 29
    const starts = instances.map(({ start }) => start.day)
    expect(starts).toEqual([26, 23, 29])
  })
})

describe('expand — FREQ=YEARLY', () => {
  it('returns one instance per year', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:yearly@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=YEARLY;COUNT=3',
        'SUMMARY:New Year',
      ]),
    )
    const window = {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2026-12-31'),
    }
    const instances = expand(event, window)

    expect(instances).toHaveLength(3)
  })
})

describe('expand — EXDATE', () => {
  it('excludes dates listed in EXDATE', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:exdate@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=5',
        'EXDATE:20240103T090000Z',
        'SUMMARY:Skip Jan 3',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(4)
    const days = instances.map(({ start }) => start.day)
    expect(days).not.toContain(3)
  })

  it('excludes multiple dates listed in EXDATE', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:exdate-multi@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=5',
        'EXDATE:20240102T090000Z',
        'EXDATE:20240104T090000Z',
        'SUMMARY:Skip Jan 2 and Jan 4',
      ]),
    )

    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    expect(instances).toHaveLength(3)
    const days = instances.map(({ start }) => start.day)
    expect(days).toEqual([1, 3, 5])
  })
})

describe('expand — RECURRENCE-ID overrides', () => {
  it('replaces a generated instance with its override', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Example//EN',
      // Base — weekly every Monday
      'BEGIN:VEVENT',
      'UID:override@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;COUNT=3',
      'SUMMARY:Weekly standup',
      'END:VEVENT',
      // Override — Jan 8 moved to 10am with different summary
      'BEGIN:VEVENT',
      'UID:override@example.com',
      'DTSTAMP:20240101T000000Z',
      'RECURRENCE-ID:20240108T090000Z',
      'DTSTART:20240108T100000Z',
      'DTEND:20240108T110000Z',
      'SUMMARY:Weekly standup (rescheduled)',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const baseEvent = calendar.events![0]
    const instances = expand(baseEvent, { start: WINDOW_START, end: WINDOW_END })
    expect(instances).toHaveLength(3)

    // 8 Jan instance should be the override
    const jan8 = instances.find(({ start }) => start.day === 8)
    expect(jan8).toBeDefined()
    expect(jan8!.isOverride).toBe(true)
    expect(jan8!.override!.summary).toBe('Weekly standup (rescheduled)')
  })

  it('marks non-overridden instances as isOverride false', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Example//EN',
      'BEGIN:VEVENT',
      'UID:mixed@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;COUNT=3',
      'SUMMARY:Weekly',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:mixed@example.com',
      'DTSTAMP:20240101T000000Z',
      'RECURRENCE-ID:20240108T090000Z',
      'DTSTART:20240108T100000Z',
      'SUMMARY:Modified',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const instances = expand(calendar.events![0], { start: WINDOW_START, end: WINDOW_END })

    const nonOverrideEvents = instances.filter(({ isOverride }) => !isOverride)
    expect(nonOverrideEvents).toHaveLength(2)
  })
})

describe('expand — options', () => {
  it('respects maxInstances as a hard cap', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:capped@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY',
        'SUMMARY:Infinite daily',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END, maxInstances: 5 })

    expect(instances).toHaveLength(5)
  })

  it('includes the end boundary when inclusive is true', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:inclusive@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=5',
        'SUMMARY:Daily',
      ]),
    )
    const instances = expand(event, {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2024-01-05'),
      inclusive: true,
    })

    expect(instances).toHaveLength(5)
  })

  it('excludes the end boundary when inclusive is false (default)', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:inclusive@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=5',
        'SUMMARY:Daily',
      ]),
    )
    const instances = expand(event, {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2024-01-05'),
      inclusive: false,
    })

    expect(instances).toHaveLength(4)
  })

  it('uses 1000 as the default maxInstances cap', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:default-cap@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY',
        'SUMMARY:Infinite daily',
      ]),
    )
    const instances = expand(event, {
      start: Temporal.PlainDate.from('2024-01-01'),
      end: Temporal.PlainDate.from('2030-12-31'),
      inclusive: false,
    })

    expect(instances.length).toBeLessThanOrEqual(1000)
  })
})

describe('expand — ExpandedEvent shape', () => {
  it('each instance has start, end, event, and isOverride', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:shape@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'DTEND:20240101T100000Z',
        'RRULE:FREQ=DAILY;COUNT=3',
        'SUMMARY:Shape test',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    for (const instance of instances) {
      expect(instance).toHaveProperty('start')
      expect(instance).toHaveProperty('end')
      expect(instance).toHaveProperty('event')
      expect(instance).toHaveProperty('isOverride')
      expect(instance.event).toBe(event)
    }
  })

  it('start and end are Temporal types — not Date objects', () => {
    const event = parseEvent(
      wrapEvent([
        'UID:temporal@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'DTEND:20240101T100000Z',
        'RRULE:FREQ=DAILY;COUNT=2',
        'SUMMARY:Temporal test',
      ]),
    )
    const instances = expand(event, { start: WINDOW_START, end: WINDOW_END })

    for (const instance of instances) {
      expect(instance.start).not.toBeInstanceOf(Date)
      expect(instance.end).not.toBeInstanceOf(Date)
    }
  })
})