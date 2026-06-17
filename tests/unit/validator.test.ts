import { describe, expect, it } from 'vitest'

import { parse } from '../../src'
import { validate } from '../../src/validator'

function parseAndValidate(raw: string) {
  const { calendar } = parse(raw)
  return validate(calendar)
}

function wrapCalendar(inner: string): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Example//EN', inner, 'END:VCALENDAR'].join(
    '\r\n',
  )
}

function makeEvent(props: string[]): string {
  return [
    'BEGIN:VEVENT',
    'UID:test@example.com',
    'DTSTAMP:20240101T000000Z',
    ...props,
    'END:VEVENT',
  ].join('\r\n')
}

describe('validate — VCALENDAR', () => {
  it('passes a valid calendar', () => {
    const { valid, errors } = parseAndValidate(wrapCalendar(''))
    expect(errors).toHaveLength(0)
    expect(valid).toBe(true)
  })

  it('errors when PRODID is missing', () => {
    const raw = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'END:VCALENDAR'].join('\r\n')

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'PRODID')).toBe(true)
  })

  it('errors when VERSION is missing', () => {
    const raw = ['BEGIN:VCALENDAR', 'PRODID:-//Example//EN', 'END:VCALENDAR'].join('\r\n')

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'VERSION')).toBe(true)
  })

  it('errors when VERSION is not 2.0', () => {
    const raw = ['BEGIN:VCALENDAR', 'VERSION:1.0', 'PRODID:-//Example//EN', 'END:VCALENDAR'].join(
      '\r\n',
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'VERSION')).toBe(true)
  })

  it('includes RFC reference on calendar errors', () => {
    const raw = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'END:VCALENDAR'].join('\r\n')
    const { errors } = parseAndValidate(raw)
    expect(errors[0].rfc).toContain('RFC 5545')
  })
})

describe('validate — VEVENT required fields', () => {
  it('passes a valid event', () => {
    const raw = wrapCalendar(makeEvent(['DTSTART:20240101T090000Z', 'SUMMARY:Test']))
    const { valid } = parseAndValidate(raw)
    expect(valid).toBe(true)
  })

  it('errors when UID is missing', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:No UID',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'UID')).toBe(true)
  })

  it('errors when DTSTAMP is missing', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:nodtstamp@example.com',
        'DTSTART:20240101T090000Z',
        'SUMMARY:No DTSTAMP',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'DTSTAMP')).toBe(true)
  })

  it('warns when SUMMARY is missing', () => {
    const raw = wrapCalendar(makeEvent(['DTSTART:20240101T090000Z']))
    const { warnings, valid } = parseAndValidate(raw)

    expect(valid).toBe(true)
    expect(warnings.some((w) => w.property === 'SUMMARY')).toBe(true)
  })
})

describe('validate — VEVENT timing', () => {
  it('errors when DTEND and DURATION are both present', () => {
    const raw = wrapCalendar(
      makeEvent([
        'DTSTART:20240101T090000Z',
        'DTEND:20240101T100000Z',
        'DURATION:PT1H',
        'SUMMARY:Bad event',
      ]),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.message.includes('DTEND') && e.message.includes('DURATION'))).toBe(
      true,
    )
  })

  it('errors when DURATION is present without DTSTART', () => {
    const raw = wrapCalendar(makeEvent(['DURATION:PT1H', 'SUMMARY:No DTSTART']))

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'DTSTART')).toBe(true)
  })

  it('errors when DTEND is before DTSTART', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T100000Z', 'DTEND:20240101T090000Z', 'SUMMARY:Reversed times']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'DTEND')).toBe(true)
  })

  it('passes when DTEND equals DTSTART — zero duration is allowed', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T090000Z', 'DTEND:20240101T090000Z', 'SUMMARY:Zero duration']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.filter((e) => e.property === 'DTEND')).toHaveLength(0)
  })
})

describe('validate — VEVENT value constraints', () => {
  it('errors when PRIORITY is out of range', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T090000Z', 'PRIORITY:10', 'SUMMARY:Bad priority']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'PRIORITY')).toBe(true)
  })

  it('passes when PRIORITY is 0', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T090000Z', 'PRIORITY:0', 'SUMMARY:Undefined priority']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.filter((e) => e.property === 'PRIORITY')).toHaveLength(0)
  })

  it('errors when STATUS is not valid for VEVENT', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T090000Z', 'STATUS:NEEDS-ACTION', 'SUMMARY:Wrong status']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'STATUS')).toBe(true)
  })

  it('passes when STATUS is CONFIRMED', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T090000Z', 'STATUS:CONFIRMED', 'SUMMARY:Valid status']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.filter((e) => e.property === 'STATUS')).toHaveLength(0)
  })
})

describe('validate — RRULE', () => {
  it('errors when both COUNT and UNTIL are present', () => {
    const raw = wrapCalendar(
      makeEvent([
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;COUNT=10;UNTIL=20241231T000000Z',
        'SUMMARY:Bad RRULE',
      ]),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'RRULE')).toBe(true)
  })

  it('errors when INTERVAL is zero', () => {
    const raw = wrapCalendar(
      makeEvent([
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=DAILY;INTERVAL=0',
        'SUMMARY:Zero interval',
      ]),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'RRULE')).toBe(true)
  })

  it('errors when COUNT is zero', () => {
    const raw = wrapCalendar(
      makeEvent(['DTSTART:20240101T090000Z', 'RRULE:FREQ=DAILY;COUNT=0', 'SUMMARY:Zero count']),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'RRULE')).toBe(true)
  })

  it('passes a valid RRULE', () => {
    const raw = wrapCalendar(
      makeEvent([
        'DTSTART:20240101T090000Z',
        'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10',
        'SUMMARY:Valid recurring',
      ]),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.filter((e) => e.property === 'RRULE')).toHaveLength(0)
  })
})

describe('validate — VALARM', () => {
  it('errors when ACTION is missing', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:alarm@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:Event with bad alarm',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'ACTION')).toBe(true)
  })

  it('errors when TRIGGER is missing', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:alarm@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:Event with bad alarm',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'TRIGGER')).toBe(true)
  })

  it('errors when ACTION:DISPLAY has no DESCRIPTION', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:alarm@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:Event',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT15M',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'DESCRIPTION')).toBe(true)
  })

  it('errors when ACTION:EMAIL has no SUMMARY', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:alarm@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:Event',
        'BEGIN:VALARM',
        'ACTION:EMAIL',
        'TRIGGER:-PT15M',
        'DESCRIPTION:Body text',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.property === 'SUMMARY')).toBe(true)
  })

  it('errors when REPEAT is present without DURATION', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:alarm@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:Event',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT15M',
        'DESCRIPTION:Reminder',
        'REPEAT:3',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors.some((e) => e.message.includes('REPEAT') && e.message.includes('DURATION'))).toBe(
      true,
    )
  })

  it('passes a valid DISPLAY alarm', () => {
    const raw = wrapCalendar(
      [
        'BEGIN:VEVENT',
        'UID:alarm@example.com',
        'DTSTAMP:20240101T000000Z',
        'DTSTART:20240101T090000Z',
        'SUMMARY:Event',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-PT15M',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )

    const { errors } = parseAndValidate(raw)
    expect(errors).toHaveLength(0)
  })
})

describe('validate — result shape', () => {
  it('valid is true when there are no errors', () => {
    const raw = wrapCalendar(makeEvent(['DTSTART:20240101T090000Z', 'SUMMARY:Good']))
    const result = parseAndValidate(raw)
    expect(result.valid).toBe(true)
  })

  it('valid is false when there are errors', () => {
    const raw = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'END:VCALENDAR'].join('\r\n')
    const result = parseAndValidate(raw)
    expect(result.valid).toBe(false)
  })

  it('valid is true even when there are warnings', () => {
    // Event with no SUMMARY produces a warning but not an error
    const raw = wrapCalendar(makeEvent(['DTSTART:20240101T090000Z']))
    const { valid, warnings } = parseAndValidate(raw)
    expect(valid).toBe(true)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('each issue has severity, message, rfc, and component', () => {
    const raw = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'END:VCALENDAR'].join('\r\n')
    const { errors } = parseAndValidate(raw)

    for (const issue of errors) {
      expect(issue.severity).toBeDefined()
      expect(issue.message).toBeDefined()
      expect(issue.rfc).toBeDefined()
      expect(issue.component).toBeDefined()
    }
  })
})
