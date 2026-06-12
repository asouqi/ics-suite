import {
  ICSAttendee,
  ICSByDay,
  ICSDate,
  ICSDateOrDateTime,
  ICSDateTime,
  ICSDuration,
  ICSOrganizer,
  ICSRecurrenceRule,
  ICSWeekDay,
} from '../../types'

/**
 * Parses a DATE string into an ICSDate.
 *
 * @param value - An 8-character date string e.g. 20240101
 */
export function parseDate(value: string): ICSDate {
  return {
    year: parseInt(value.slice(0, 4), 10),
    month: parseInt(value.slice(4, 6), 10),
    day: parseInt(value.slice(6, 8), 10)
  }
}

/**
 * Parses a DATE-TIME string into an ICSDateTime.
 * Handles UTC (trailing Z), floating (no timezone), and TZID forms.
 *
 * @param value  - A datetime string e.g. 20240101T090000Z
 * @param params - The property parameters, used to extract TZID
 */
export function parseDateTime(value: string, params: Record<string, string>): ICSDateTime {
  const utc = value.endsWith('Z')
  const clean = utc ? value.slice(0, -1) : value

  return {
    year: parseInt(clean.slice(0, 4), 10),
    month: parseInt(clean.slice(4, 6), 10),
    day: parseInt(clean.slice(6, 8), 10),
    hour: parseInt(clean.slice(9, 11), 10),
    minute: parseInt(clean.slice(11, 13), 10),
    second: parseInt(clean.slice(13, 15), 10),
    utc,
    tzid: params.TZID
  }
}

/**
 * Parses a value that may be either a DATE or DATE-TIME into the
 * appropriate type. Uses the VALUE=DATE parameter or the absence of
 * a T character in the value string to detect the date-only form.
 *
 * @param value  - A date or datetime string
 * @param params - The property parameters
 */
export function parseDateOrDateTime(
  value: string,
  params: Record<string, string>,
): ICSDateOrDateTime {
  if (params.VALUE === 'DATE' || !value.includes('T')) {
    return parseDate(value)
  }
  return parseDateTime(value, params)
}

/**
 * Parses a DURATION string into an ICSDuration.
 * Format: [-]P[nW][nD][T[nH][nM][nS]]
 *
 * @param value - A duration string e.g. P1DT2H or -PT15M
 */
export function parseDuration(value: string): ICSDuration {
  const negative = value.startsWith('-')
  // strip leading -/+ and the required P designator
  const clean = value.replace(/^[-+]?P/, '')

  const duration: ICSDuration = { negative }

  // weeks are excluded from other designators
  const weekMatch = clean.match(/^(\d+)W$/)
  if (weekMatch) {
    duration.weeks = parseInt(weekMatch[1], 10)
  }

  // split at T to separate date and time parts
  const [datePart, timePart] = clean.split('T')

  if (datePart) {
    const days = datePart.match(/(\d+)D/)
    if (days) duration.days = parseInt(days[1], 10)
  }

  if (timePart) {
    const hours = timePart.match(/(\d+)H/)
    const minutes = timePart.match(/(\d+)M/)
    const seconds = timePart.match(/(\d+)S/)
    if (hours) duration.hours = parseInt(hours[1], 10)
    if (minutes) duration.minutes = parseInt(minutes[1], 10)
    if (seconds) duration.seconds = parseInt(seconds[1], 10)
  }

  return duration
}

const WEEKDAYS = new Set(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])

/**
 * Parses a BYDAY entry which may include an optional ordinal prefix.
 * e.g. MO → { day: 'MO' }
 *     -1FR → { ordinal: -1, day: 'FR' }
 *      2TU → { ordinal: 2, day: 'TU' }
 *
 * @param value - A single BYDAY entry string
 */
export function parseByDay(value: string): ICSByDay {
  const day = value.slice(-2) as ICSWeekDay
  const ordinalStr = value.slice(0, -2)
  const ordinal = ordinalStr.length > 0 ? parseInt(ordinalStr, 10) : undefined
  return ordinal !== undefined ? { ordinal, day } : { day }
}

/**
 * Parses an RRULE value string into an ICSRecurrenceRule.
 * The value is a semicolon-separated list of key=value pairs.
 *
 * @param value - An RRULE value string e.g. FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10
 */
export function parseRRule(value: string): ICSRecurrenceRule {
  const parts = value.split(';')
  const rule: Partial<ICSRecurrenceRule> = {}

  for(const part of parts) {
    const eqIndex = part.indexOf('=')
    if (eqIndex === -1) continue

    const key = part.slice(0, eqIndex)
    const value = part.slice(eqIndex + 1)

    switch (key) {
      case 'FREQ':
        rule.freq = value as ICSRecurrenceRule['freq']
        break
      case 'UNTIL':
        rule.until = parseDateOrDateTime(value, {})
        break
      case 'COUNT':
        rule.count = parseInt(value, 10)
        break
      case 'INTERVAL':
        rule.interval = parseInt(value, 10)
        break
      case 'BYSECOND':
        rule.bySecond = value.split(',').map(Number)
        break
      case 'BYMINUTE':
        rule.byMinute = value.split(',').map(Number)
        break
      case 'BYHOUR':
        rule.byHour = value.split(',').map(Number)
        break
      case 'BYDAY':
        rule.byDay = value.split(',').map(parseByDay)
        break
      case 'BYMONTHDAY':
        rule.byMonthDay = value.split(',').map(Number)
        break
      case 'BYYEARDAY':
        rule.byYearDay = value.split(',').map(Number)
        break
      case 'BYWEEKNO':
        rule.byWeekNo = value.split(',').map(Number)
        break
      case 'BYMONTH':
        rule.byMonth = value.split(',').map(Number)
        break
      case 'BYSETPOS':
        rule.bySetPos = value.split(',').map(Number)
        break
      case 'WKST':
        if (WEEKDAYS.has(value)) rule.weekStart = value as ICSWeekDay
        break
    }
  }

  return rule as ICSRecurrenceRule
}

/**
 * Strips the mailto: prefix from a CAL-ADDRESS value.
 *
 * @param value - A CAL-ADDRESS value e.g. mailto:alice@example.com
 */
function extractEmail(value: string): string {
  return value.toLowerCase().startsWith('mailto:') ? value.slice(7) : value
}

/**
 * Parses an ATTENDEE property value and parameters into an ICSAttendee.
 *
 * @param value  - The CAL-ADDRESS value e.g. mailto:alice@example.com
 * @param params - The property parameters
 */
export function parseAttendee(value: string, params: Record<string, string>): ICSAttendee {
  const attendee: ICSAttendee = { email: extractEmail(value) }

  if (params.CN) attendee.name = params.CN
  if (params.ROLE) attendee.role = params.ROLE as ICSAttendee['role']
  if (params.PARTSTAT) attendee.status = params.PARTSTAT as ICSAttendee['status']
  if (params.CUTYPE) attendee.cutype = params.CUTYPE as ICSAttendee['cutype']
  if (params.RSVP) attendee.rsvp = params.RSVP === 'TRUE'
  if (params['DELEGATED-TO']) {
    attendee.delegatedTo = params['DELEGATED-TO'].split(',').map(extractEmail)
  }
  if (params['DELEGATED-FROM']) {
    attendee.delegatedFrom = params['DELEGATED-FROM'].split(',').map(extractEmail)
  }

  return attendee
}

/**
 * Parses an ORGANIZER property value and parameters into an ICSOrganizer.
 *
 * @param value  - The CAL-ADDRESS value e.g. mailto:alice@example.com
 * @param params - The property parameters
 */
export function parseOrganizer(value: string, params: Record<string, string>): ICSOrganizer {
  const organizer: ICSOrganizer = { email: extractEmail(value) }
  if (params.CN) organizer.name = params.CN
  return organizer
}
