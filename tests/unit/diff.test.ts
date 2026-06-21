import { describe, expect, it } from 'vitest'

import { parse, diff } from '../../src'

function parseCalendar(raw: string) {
  return parse(raw).calendar
}

function wrapCalendar(inner: string): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Example//EN', inner, 'END:VCALENDAR'].join(
    '\r\n',
  )
}

function makeEvent(props: string[]): string {
  return ['BEGIN:VEVENT', ...props, 'END:VEVENT'].join('\r\n')
}

function makeTodo(props: string[]): string {
  return ['BEGIN:VTODO', ...props, 'END:VTODO'].join('\r\n')
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_EVENT = makeEvent([
  'UID:event1@example.com',
  'DTSTAMP:20240101T000000Z',
  'DTSTART:20240115T090000Z',
  'DTEND:20240115T100000Z',
  'SUMMARY:Team meeting',
  'LOCATION:Conference Room A',
])

const MODIFIED_EVENT = makeEvent([
  'UID:event1@example.com',
  'DTSTAMP:20240102T000000Z', // DTSTAMP changed — should be ignored
  'DTSTART:20240115T100000Z', // start time changed
  'DTEND:20240115T110000Z', // end time changed
  'SUMMARY:Team meeting',
  'LOCATION:Conference Room B', // location changed
])

const SECOND_EVENT = makeEvent([
  'UID:event2@example.com',
  'DTSTAMP:20240101T000000Z',
  'DTSTART:20240120T140000Z',
  'DTEND:20240120T150000Z',
  'SUMMARY:Follow-up',
])

const BASE_TODO = makeTodo([
  'UID:todo1@example.com',
  'DTSTAMP:20240101T000000Z',
  'SUMMARY:Write tests',
  'STATUS:NEEDS-ACTION',
])

const MODIFIED_TODO = makeTodo([
  'UID:todo1@example.com',
  'DTSTAMP:20240102T000000Z',
  'SUMMARY:Write tests',
  'STATUS:COMPLETED',
])

describe('diff — empty calendars', () => {
  it('returns isEmpty true when both calendars are identical', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(BASE_EVENT))

    const result = diff(a, b)

    expect(result.isEmpty).toBe(true)
    expect(result.events).toHaveLength(0)
  })

  it('returns isEmpty true when both calendars have no events', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)

    expect(result.isEmpty).toBe(true)
  })

  it('returns isEmpty false when there are changes', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)

    expect(result.isEmpty).toBe(false)
  })
})

describe('diff — added events', () => {
  it('detects an event added to the new calendar', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar(BASE_EVENT))

    const result = diff(a, b)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('added')
  })

  it('carries the added event on the item field', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar(BASE_EVENT))

    const result = diff(a, b)
    const change = result.events[0]

    expect(change.type).toBe('added')
    if (change.type === 'added') {
      expect(change.item.uid).toBe('event1@example.com')
    }
  })

  it('detects multiple added events', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar([BASE_EVENT, SECOND_EVENT].join('\r\n')))

    const result = diff(a, b)

    expect(result.events.filter((c) => c.type === 'added')).toHaveLength(2)
  })
})

describe('diff — removed events', () => {
  it('detects an event removed from the new calendar', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('removed')
  })

  it('carries the removed event on the item field', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)
    const change = result.events[0]

    expect(change.type).toBe('removed')
    if (change.type === 'removed') {
      expect(change.item.uid).toBe('event1@example.com')
    }
  })
})

describe('diff — modified events', () => {
  it('detects a modified event', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(MODIFIED_EVENT))

    const result = diff(a, b)

    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('modified')
  })

  it('carries before and after on a modified change', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(MODIFIED_EVENT))

    const result = diff(a, b)
    const change = result.events[0]

    expect(change.type).toBe('modified')
    if (change.type === 'modified') {
      expect(change.before.uid).toBe('event1@example.com')
      expect(change.after.uid).toBe('event1@example.com')
    }
  })

  it('reports which fields changed', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(MODIFIED_EVENT))

    const result = diff(a, b)
    const change = result.events[0]

    expect(change.type).toBe('modified')
    if (change.type === 'modified') {
      expect(change.changedFields).toContain('dtStart')
      expect(change.changedFields).toContain('dtEnd')
      expect(change.changedFields).toContain('location')
    }
  })

  it('ignores DTSTAMP changes by default', () => {
    const a = parseCalendar(wrapCalendar(BASE_EVENT))
    const b = parseCalendar(wrapCalendar(MODIFIED_EVENT))

    const result = diff(a, b)
    const change = result.events[0]

    expect(change.type).toBe('modified')
    if (change.type === 'modified') {
      expect(change.changedFields).not.toContain('dtStamp')
    }
  })

  it('does not report a change when only ignored fields differ', () => {
    const eventA = makeEvent([
      'UID:stamp@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240115T090000Z',
      'SUMMARY:Same event',
    ])

    const eventB = makeEvent([
      'UID:stamp@example.com',
      'DTSTAMP:20240199T000000Z', // only DTSTAMP changed
      'DTSTART:20240115T090000Z',
      'SUMMARY:Same event',
    ])

    const a = parseCalendar(wrapCalendar(eventA))
    const b = parseCalendar(wrapCalendar(eventB))

    const result = diff(a, b)

    expect(result.isEmpty).toBe(true)
  })
})

describe('diff — mixed changes', () => {
  it('detects added, removed, and modified events in one diff', () => {
    const a = parseCalendar(wrapCalendar([BASE_EVENT, SECOND_EVENT].join('\r\n')))

    // event1 modified, event2 removed, event3 added
    const event3 = makeEvent([
      'UID:event3@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240125T090000Z',
      'SUMMARY:New event',
    ])

    const b = parseCalendar(wrapCalendar([MODIFIED_EVENT, event3].join('\r\n')))

    const result = diff(a, b)

    expect(result.events.filter((c) => c.type === 'added')).toHaveLength(1)
    expect(result.events.filter((c) => c.type === 'removed')).toHaveLength(1)
    expect(result.events.filter((c) => c.type === 'modified')).toHaveLength(1)
    expect(result.isEmpty).toBe(false)
  })
})

describe('diff — todos', () => {
  it('detects an added todo', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar(BASE_TODO))

    const result = diff(a, b)

    expect(result.todos).toHaveLength(1)
    expect(result.todos[0].type).toBe('added')
  })

  it('detects a modified todo', () => {
    const a = parseCalendar(wrapCalendar(BASE_TODO))
    const b = parseCalendar(wrapCalendar(MODIFIED_TODO))

    const result = diff(a, b)

    expect(result.todos).toHaveLength(1)
    expect(result.todos[0].type).toBe('modified')
    if (result.todos[0].type === 'modified') {
      expect(result.todos[0].changedFields).toContain('status')
    }
  })

  it('detects a removed todo', () => {
    const a = parseCalendar(wrapCalendar(BASE_TODO))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)

    expect(result.todos).toHaveLength(1)
    expect(result.todos[0].type).toBe('removed')
  })
})

describe('diff — options', () => {
  it('ignores additional fields when specified in ignoreFields', () => {
    const eventA = makeEvent([
      'UID:ignore@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240115T090000Z',
      'SUMMARY:Event',
      'LOCATION:Room A',
    ])

    const eventB = makeEvent([
      'UID:ignore@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240115T090000Z',
      'SUMMARY:Event',
      'LOCATION:Room B', // location changed but we ignore it
    ])

    const a = parseCalendar(wrapCalendar(eventA))
    const b = parseCalendar(wrapCalendar(eventB))

    const result = diff(a, b, { ignoreFields: ['location'] })

    expect(result.isEmpty).toBe(true)
  })

  it('includes override changes when includeOverrides is true', () => {
    const baseRaw = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Example//EN',
      'BEGIN:VEVENT',
      'UID:recurring@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;COUNT=3',
      'SUMMARY:Weekly',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const withOverrideRaw = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Example//EN',
      'BEGIN:VEVENT',
      'UID:recurring@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;COUNT=3',
      'SUMMARY:Weekly',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:recurring@example.com',
      'DTSTAMP:20240101T000000Z',
      'RECURRENCE-ID:20240108T090000Z',
      'DTSTART:20240108T100000Z',
      'SUMMARY:Weekly (rescheduled)',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const a = parseCalendar(baseRaw)
    const b = parseCalendar(withOverrideRaw)

    const result = diff(a, b, { includeOverrides: true })

    expect(result.events.some((c) => c.type === 'modified')).toBe(true)
  })
})

describe('diff — result shape', () => {
  it('always has events, todos, journals, and isEmpty', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)

    expect(result).toHaveProperty('events')
    expect(result).toHaveProperty('todos')
    expect(result).toHaveProperty('journals')
    expect(result).toHaveProperty('isEmpty')
  })

  it('events todos and journals are always arrays', () => {
    const a = parseCalendar(wrapCalendar(''))
    const b = parseCalendar(wrapCalendar(''))

    const result = diff(a, b)

    expect(Array.isArray(result.events)).toBe(true)
    expect(Array.isArray(result.todos)).toBe(true)
    expect(Array.isArray(result.journals)).toBe(true)
  })
})
