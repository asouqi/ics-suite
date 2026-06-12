import { describe, expect, it } from 'vitest'

import { parseAttendee, parseDate, parseDateOrDateTime, parseDateTime, parseDuration, parseOrganizer, parseRRule } from '../../../src/parser/assembler'

describe('parseDate', () => {
  it('parses a basic date string', () => {
    expect(parseDate('20240101')).toEqual({ year: 2024, month: 1, day: 1})
  })

  it('parses end of year date', () => {
    expect(parseDate('20241231')).toEqual({ year: 2024, month: 12, day: 31})
  })
})

describe('parseDateTime', () => {
  it('parses a UTC datetime', () => {
    expect(parseDateTime('20240101T090000Z', {})).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      hour: 9,
      minute: 0,
      second: 0,
      utc: true,
      tzid: undefined,
    })
  })

  it('parses a floating datetime with no timezone', () => {
    expect(parseDateTime('20240101T090000', {})).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      hour: 9,
      minute: 0,
      second: 0,
      utc: false,
      tzid: undefined,
    })
  })

  it('parses a datetime with a TZID parameter', () => {
    expect(parseDateTime('20240101T090000', { TZID: 'America/New_York' })).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      hour: 9,
      minute: 0,
      second: 0,
      utc: false,
      tzid: 'America/New_York',
    })
  })

  it('parses midnight correctly', () => {
    expect(parseDateTime('20240101T000000Z', {})).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      utc: true,
      tzid: undefined,
    })
  })
})

describe('parseDateOrDateTime', () => {
  it('returns an ICSDate when VALUE=DATE param is present', () => {
    expect(parseDateOrDateTime('20240101', { VALUE: 'DATE' })).toEqual({
      year: 2024,
      month: 1,
      day: 1,
    })
  })

  it('returns an ICSDate when the value has 8 characters and no T', () => {
    expect(parseDateOrDateTime('20240101', {})).toEqual({
      year: 2024,
      month: 1,
      day: 1,
    })
  })

  it('returns an ICSDateTime when value contains T', () => {
    expect(parseDateOrDateTime('20240101T090000Z', {})).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      hour: 9,
      minute: 0,
      second: 0,
      utc: true,
      tzid: undefined,
    })
  })
})

describe('parseDuration', () => {
  it('parses a day duration', () => {
    expect(parseDuration('P1D')).toEqual({
      negative: false, days: 1
    })
  })

  it('parses a time duration', () => {
    expect(parseDuration('PT1H30M')).toEqual({
      negative: false, hours: 1, minutes: 30
    })
  })

  it('parses a combined date and time duration', () => {
    expect(parseDuration('P1DT2H')).toEqual({
      negative: false, days: 1, hours: 2
    })
  })

  it('parses a week duration', () => {
    expect(parseDuration('P2W')).toEqual({
      negative: false, weeks: 2
    })
  })

  it('parses a negative duration', () => {
    expect(parseDuration('-PT15M')).toEqual({
      negative: true,
      minutes: 15,
    })
  })

  it('parses a full duration with all parts', () => {
    expect(parseDuration('P1DT2H3M4S')).toEqual({
      negative: false,
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    })
  })
})

describe('parseRRule', () => {
  it('parses a simple daily rule', () => {
    expect(parseRRule('FREQ=DAILY')).toEqual({
      freq: 'DAILY'
    })
  })

  it('parses a weekly rule with COUNT', () => {
    expect(parseRRule('FREQ=WEEKLY;COUNT=10')).toEqual({
      freq: 'WEEKLY',
      count: 10
    })
  })

  it('parses a rule with UNTIL', () => {
    expect(parseRRule('FREQ=DAILY;UNTIL=20241231T000000Z')).toEqual({
      freq: 'DAILY',
      until: {
        year: 2024,
        month: 12,
        day: 31,
        hour: 0,
        minute: 0,
        second: 0,
        utc: true,
        tzid: undefined,
      },
    })
  })

  it('parses BYDAY with multiple days', () => {
    expect(parseRRule('FREQ=WEEKLY;BYDAY=MO,WE,FR')).toEqual({
      freq: 'WEEKLY',
      byDay: [{ day: 'MO' }, { day: 'WE' }, { day: 'FR' }],
    })
  })

  it('parses BYDAY with an ordinal', () => {
    expect(parseRRule('FREQ=MONTHLY;BYDAY=-1FR')).toEqual({
      freq: 'MONTHLY',
      byDay: [{ ordinal: -1, day: 'FR' }],
    })
  })

  it('parses BYDAY with a positive ordinal', () => {
    expect(parseRRule('FREQ=MONTHLY;BYDAY=2MO')).toEqual({
      freq: 'MONTHLY',
      byDay: [{ ordinal: 2, day: 'MO' }],
    })
  })

  it('parses INTERVAL', () => {
    expect(parseRRule('FREQ=WEEKLY;INTERVAL=2')).toEqual({
      freq: 'WEEKLY',
      interval: 2,
    })
  })

  it('parses BYMONTH', () => {
    expect(parseRRule('FREQ=YEARLY;BYMONTH=1,7')).toEqual({
      freq: 'YEARLY',
      byMonth: [1, 7],
    })
  })

  it('parses BYMONTHDAY', () => {
    expect(parseRRule('FREQ=MONTHLY;BYMONTHDAY=15,-1')).toEqual({
      freq: 'MONTHLY',
      byMonthDay: [15, -1],
    })
  })

  it('parses BYSETPOS', () => {
    expect(parseRRule('FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1')).toEqual({
      freq: 'MONTHLY',
      byDay: [{ day: 'FR' }],
      bySetPos: [-1],
    })
  })

  it('parses WKST', () => {
    expect(parseRRule('FREQ=WEEKLY;WKST=SU')).toEqual({
      freq: 'WEEKLY',
      weekStart: 'SU',
    })
  })
})

describe('parseAttendee', () => {
  it('parses a basic attendee', () => {
    expect(parseAttendee('mailto:alice@example.com', {})).toEqual({
      email: 'alice@example.com',
    })
  })

  it('parses an attendee with CN and ROLE', () => {
    expect(
      parseAttendee('mailto:alice@example.com', {
        CN: 'Alice',
        ROLE: 'REQ-PARTICIPANT',
      }),
    ).toEqual({
      email: 'alice@example.com',
      name: 'Alice',
      role: 'REQ-PARTICIPANT',
    })
  })

  it('parses PARTSTAT', () => {
    expect(parseAttendee('mailto:alice@example.com', { PARTSTAT: 'ACCEPTED' })).toEqual({
      email: 'alice@example.com',
      status: 'ACCEPTED',
    })
  })

  it('parses RSVP=TRUE as boolean true', () => {
    expect(parseAttendee('mailto:alice@example.com', { RSVP: 'TRUE' })).toEqual({
      email: 'alice@example.com',
      rsvp: true,
    })
  })

  it('parses RSVP=FALSE as boolean false', () => {
    expect(parseAttendee('mailto:alice@example.com', { RSVP: 'FALSE' })).toEqual({
      email: 'alice@example.com',
      rsvp: false,
    })
  })

  it('parses CUTYPE', () => {
    expect(parseAttendee('mailto:alice@example.com', { CUTYPE: 'ROOM' })).toEqual({
      email: 'alice@example.com',
      cutype: 'ROOM',
    })
  })
})

describe('', () => {
  it('parses a basic organizer', () => {
    expect(parseOrganizer('mailto:alice@example.com', {})).toEqual({
      email: 'alice@example.com',
    })
  })

  it('parses an organizer with CN', () => {
    expect(
      parseOrganizer('mailto:alice@example.com', {
        CN: 'Alice' }),
    ).toEqual({
      email: 'alice@example.com',
      name: 'Alice',
    })
  })
})