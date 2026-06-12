import { describe, expect, it } from 'vitest'

import { tokenize, unfold } from '../../../src/parser'
import { assemble } from '../../../src/parser/assembler/assemble'

function parse(ics: string) {
  return assemble(tokenize(unfold(ics)))
}

describe('assemble - VCALENDAR', () => {
  it('assembles a minimal calendar', () => {
    const { calendar, errors } = parse('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Example//EN\r\nEND:VCALENDAR')
    expect(errors.length).toBe(0)
    expect(calendar.version).toBe('2.0')
    expect(calendar.prodId).toBe('-//Example//EN')
    expect(calendar.events).toEqual([])
  })

  it('captures X-WR-CALNAME as calendar name', () => {
    const { calendar } = parse('BEGIN:VCALENDAR\r\nX-WR-CALNAME:My Calendar\r\nEND:VCALENDAR')
    expect(calendar.name).toBe('My Calendar')
  })
})

describe('assemble - VCALENDAR', () => {
  it('assembles a simple event', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Example//EN',
      'BEGIN:VEVENT',
      'UID:abc-123@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART;TZID=America/New_York:20240101T090000',
      'DTEND;TZID=America/New_York:20240101T100000',
      'SUMMARY:Team standup',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar, errors } = parse(raw)
    expect(errors).toHaveLength(0)
    expect(calendar.events).toHaveLength(1)

    const event = calendar.events![0]
    expect(event.uid).toBe('abc-123@example.com')
    expect(event.summary).toBe('Team standup')
    expect(event.dtStart).toEqual({
      year: 2024, month: 1, day: 1,
      hour: 9, minute: 0, second: 0,
      utc: false, tzid: 'America/New_York'
    })
  })

  it('assembles an all-day event with DATE values', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:allday@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART;VALUE=DATE:20240115',
      'DTEND;VALUE=DATE:20240116',
      'SUMMARY:All day event',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const event = calendar.events![0]
    expect(event.dtStart).toEqual({ year: 2024, month: 1, day: 15 })
    expect(event.dtEnd).toEqual({ year: 2024, month: 1, day: 16 })
  })

  it('assembles attendees correctly', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:meeting@example.com',
      'DTSTAMP:20240101T000000Z',
      'ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:alice@example.com',
      'ATTENDEE;CN=Bob;PARTSTAT=NEEDS-ACTION:mailto:bob@example.com',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const event = calendar.events![0]
    expect(event.attendees).toHaveLength(2)
    expect(event.attendees![0]).toEqual({
      email: 'alice@example.com',
      name: 'Alice',
      role: 'REQ-PARTICIPANT',
      status: 'ACCEPTED',
    })
  })

  it('assembles a recurring event with RRULE', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:recurring@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10',
      'SUMMARY:Weekly standup',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const event = calendar.events![0]
    expect(event.rrule).toEqual({
      freq: 'WEEKLY',
      byDay: [{ day: 'MO' }],
      count: 10
    })
  })

  it('preserves X- vendor extension properties', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:ext@example.com',
      'DTSTAMP:20240101T000000Z',
      'X-GOOGLE-CONFERENCE:https://meet.google.com/abc',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const event = calendar.events![0]
    expect(event.extended).toHaveLength(1)
    expect(event.extended![0]).toEqual({
      name: 'X-GOOGLE-CONFERENCE',
      value: 'https://meet.google.com/abc',
      params: {}
    })
  })
})

describe('assemble — VALARM', () => {
  it('attaches an alarm to its parent event', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:alarm@example.com',
      'DTSTAMP:20240101T000000Z',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT15M',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    const event = calendar.events![0]
    expect(event.alarms).toHaveLength(1)
    expect(event.alarms![0].action).toBe('DISPLAY')
    expect(event.alarms![0].trigger).toEqual({
      negative: true,
      minutes: 15
    })
    expect(event.alarms![0].description).toBe('Reminder')
  })
})

describe('assemble - error handling', () => {
  it('assemble — error handling', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:bad@example.com',
      'END:VCALENDAR',
    ].join('\r\n')

    const { errors } = parse(raw)
    expect(errors).toHaveLength(2)
    expect(errors![0].message).toContain('Mismatched END')
  })

  it('returns a fallback calendar when no VCALENDAR is found', () => {
    const { calendar, errors } = parse('VERSION:2.0')
    expect(errors![0].message).toContain('No VCALENDAR component found')
    expect(calendar.events).toEqual([])
  })
})

describe('assemble — recurrence override linking', () => {
  it('attaches override events to their base event', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      // Base recurring event
      'BEGIN:VEVENT',
      'UID:recurring@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;COUNT=3',
      'SUMMARY:Weekly standup',
      'END:VEVENT',
      // Modified instance — Jan 8 moved to 10am
      'BEGIN:VEVENT',
      'UID:recurring@example.com',
      'DTSTAMP:20240101T000000Z',
      'RECURRENCE-ID:20240108T090000Z',
      'DTSTART:20240108T100000Z',
      'SUMMARY:Weekly standup (moved)',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar, errors } = parse(raw)
    expect(errors).toHaveLength(0)

    expect(calendar.events).toHaveLength(1)

    const base = calendar.events![0]
    expect(base.uid).toBe('recurring@example.com')
    expect(base.recurrenceId).toBeUndefined()

    expect(base.overrides).toHaveLength(1)
    expect(base.overrides![0].summary).toBe('Weekly standup (moved)')
    expect(base.overrides![0].recurrenceId).toBeDefined()
  })

  it('handles multiple overrides on the same base event', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:multi@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'RRULE:FREQ=WEEKLY;COUNT=4',
      'SUMMARY:Base',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:multi@example.com',
      'DTSTAMP:20240101T000000Z',
      'RECURRENCE-ID:20240108T090000Z',
      'DTSTART:20240108T100000Z',
      'SUMMARY:Override 1',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:multi@example.com',
      'DTSTAMP:20240101T000000Z',
      'RECURRENCE-ID:20240115T090000Z',
      'DTSTART:20240115T110000Z',
      'SUMMARY:Override 2',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events![0].overrides).toHaveLength(2)
  })

  it('leaves non-recurring events untouched', () => {
    const raw = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:single@example.com',
      'DTSTAMP:20240101T000000Z',
      'DTSTART:20240101T090000Z',
      'SUMMARY:One-off event',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const { calendar } = parse(raw)
    expect(calendar.events).toHaveLength(1)
    expect(calendar.events![0].overrides).toBeUndefined()
  })
})