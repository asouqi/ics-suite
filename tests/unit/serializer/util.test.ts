import {describe, it, expect} from "vitest";

import {ICSDateOrDateTime, ICSDuration, ICSRecurrenceRule, ICSTimezone} from "../../../src";
import {
    foldLine,
    formatProperty,
    serializeDate,
    serializeDateTime,
    serializeDuration,
    serializeRecurrenceRule, serializeTimezone
} from "../../../src/serializer/util"


describe('serializeDate', () => {
    it('serializes a date to YYYYMMDD format', () => {
        const date = {year: 2024, month: 6, day: 15}
        expect(serializeDate(date)).toBe('20240615')
    })

    it('pads single digit months and days with zeros', () => {
        const date = { year: 2024, month: 1, day: 5 }
        expect(serializeDate(date)).toBe('20240105')
    })

    it('handles leap years correctly', () => {
        const date = { year: 2024, month: 2, day: 29 }
        expect(serializeDate(date)).toBe('20240229')
    })
})

describe('serializeDateTime', () => {
    it('serializes a DATE value without time component', () => {
        const date: ICSDateOrDateTime = { year: 2024, month: 6, day: 15 }
        expect(serializeDateTime(date)).toBe('20240615')
    })

    it('serializes a DATE-TIME in UTC with Z suffix', () => {
        const dateTime: ICSDateOrDateTime = {
            year: 2024,
            month: 6,
            day: 15,
            hour: 14,
            minute: 30,
            second: 0,
            utc: true,
        }
        expect(serializeDateTime(dateTime)).toBe('20240615T143000Z')
    })

    it('serializes a DATE-TIME in local time without Z suffix', () => {
        const dateTime: ICSDateOrDateTime = {
            year: 2024,
            month: 6,
            day: 15,
            hour: 14,
            minute: 30,
            second: 0,
            utc: false,
        }
        expect(serializeDateTime(dateTime)).toBe('20240615T143000')
    })

    it('serializes a DATE-TIME with timezone identifier', () => {
        const dateTime: ICSDateOrDateTime = {
            year: 2024,
            month: 6,
            day: 15,
            hour: 14,
            minute: 30,
            second: 0,
            utc: false,
            tzid: 'America/New_York',
        }
        expect(serializeDateTime(dateTime)).toBe('20240615T143000')
    })

    it('pads time components with zeros', () => {
        const dateTime: ICSDateOrDateTime = {
            year: 2024,
            month: 1,
            day: 5,
            hour: 9,
            minute: 5,
            second: 3,
            utc: true,
        }
        expect(serializeDateTime(dateTime)).toBe('20240105T090503Z')
    })
})

describe('serializeDuration', () => {
    it('serializes a duration with weeks only', () => {
        const duration: ICSDuration = { weeks: 2, negative: false }
        expect(serializeDuration(duration)).toBe('P2W')
    })

    it('serializes a duration with days only', () => {
        const duration: ICSDuration = { days: 7, negative: false }
        expect(serializeDuration(duration)).toBe('P7D')
    })

    it('serializes a duration with hours, minutes, and seconds', () => {
        const duration: ICSDuration = { hours: 2, minutes: 30, seconds: 15, negative: false }
        expect(serializeDuration(duration)).toBe('PT2H30M15S')
    })

    it('serializes a duration with days and time components', () => {
        const duration: ICSDuration = { days: 1, hours: 2, minutes: 30, negative: false }
        expect(serializeDuration(duration)).toBe('P1DT2H30M')
    })

    it('serializes a negative duration with minus sign', () => {
        const duration: ICSDuration = { minutes: 15, negative: true }
        expect(serializeDuration(duration)).toBe('-PT15M')
    })

    it('handles duration with only minutes', () => {
        const duration: ICSDuration = { minutes: 45, negative: false }
        expect(serializeDuration(duration)).toBe('PT45M')
    })
})

describe('serializeRecurrenceRule', () => {
    it('serializes a simple daily recurrence', () => {
        const rrule: ICSRecurrenceRule = { freq: 'DAILY' }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=DAILY')
    })

    it('serializes a recurrence with count', () => {
        const rrule: ICSRecurrenceRule = { freq: 'WEEKLY', count: 10 }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=WEEKLY;COUNT=10')
    })

    it('serializes a recurrence with until date', () => {
        const rrule: ICSRecurrenceRule = {
            freq: 'MONTHLY',
            until: { year: 2024, month: 12, day: 31, hour: 23, minute: 59, second: 59, utc: true },
        }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=MONTHLY;UNTIL=20241231T235959Z')
    })

    it('serializes a recurrence with interval', () => {
        const rrule: ICSRecurrenceRule = { freq: 'WEEKLY', interval: 2 }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=WEEKLY;INTERVAL=2')
    })

    it('does not include interval when it is 1', () => {
        const rrule: ICSRecurrenceRule = { freq: 'DAILY', interval: 1 }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=DAILY')
    })

    it('serializes a recurrence with BYDAY', () => {
        const rrule: ICSRecurrenceRule = {
            freq: 'WEEKLY',
            byDay: [{ day: 'MO' }, { day: 'WE' }, { day: 'FR' }],
        }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR')
    })

    it('serializes a recurrence with BYDAY and ordinals', () => {
        const rrule: ICSRecurrenceRule = {
            freq: 'MONTHLY',
            byDay: [{ ordinal: -1, day: 'FR' }],
        }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=MONTHLY;BYDAY=-1FR')
    })

    it('serializes a complex recurrence rule', () => {
        const rrule: ICSRecurrenceRule = {
            freq: 'YEARLY',
            interval: 2,
            byMonth: [1, 7],
            byDay: [{ ordinal: 1, day: 'MO' }],
            count: 10,
        }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=YEARLY;COUNT=10;INTERVAL=2;BYDAY=1MO;BYMONTH=1,7')
    })

    it('serializes a recurrence with BYMONTHDAY', () => {
        const rrule: ICSRecurrenceRule = {
            freq: 'MONTHLY',
            byMonthDay: [1, 15, -1],
        }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=MONTHLY;BYMONTHDAY=1,15,-1')
    })

    it('serializes a recurrence with weekStart', () => {
        const rrule: ICSRecurrenceRule = {
            freq: 'WEEKLY',
            weekStart: 'SU',
        }
        expect(serializeRecurrenceRule(rrule)).toBe('FREQ=WEEKLY;WKST=SU')
    })
})

describe('formatProperty', () => {
    it('formats a property without parameters', () => {
        expect(formatProperty('SUMMARY', 'Team Meeting')).toBe('SUMMARY:Team Meeting')
    })

    it('formats a property with one parameter', () => {
        expect(formatProperty('DTSTART', '20240615T140000', { TZID: 'America/New_York' }))
            .toBe('DTSTART;TZID=America/New_York:20240615T140000')
    })

    it('formats a property with multiple parameters', () => {
        expect(formatProperty('ATTENDEE', 'mailto:alice@example.com', { CN: 'Alice', ROLE: 'REQ-PARTICIPANT' }))
            .toBe('ATTENDEE;CN=Alice;ROLE=REQ-PARTICIPANT:mailto:alice@example.com')
    })

    it('formats a property with empty parameters object', () => {
        expect(formatProperty('UID', '123@example.com', {})).toBe('UID:123@example.com')
    })

    it('formats a property with undefined parameters', () => {
        expect(formatProperty('VERSION', '2.0')).toBe('VERSION:2.0')
    })
})

describe('foldLine', () => {
    it('does not fold a line shorter than 75 characters', () => {
        const line = 'SUMMARY:Short summary'
        expect(foldLine(line)).toBe(line)
    })

    it('does not fold a line exactly 75 characters', () => {
        const line = 'A'.repeat(75)
        expect(foldLine(line)).toBe(line)
    })

    it('folds a line longer than 75 characters', () => {
        const line = 'DESCRIPTION:' + 'A'.repeat(70)
        const expected = 'DESCRIPTION:' + 'A'.repeat(63) + '\r\n ' + 'A'.repeat(7)
        expect(foldLine(line)).toBe(expected)
    })

    it('folds a very long line into multiple segments', () => {
        const line = 'DESCRIPTION:' + 'A'.repeat(200)
        const folded = foldLine(line)

        // First line should be 75 chars
        expect(folded.split('\r\n')[0].length).toBe(75)

        // Subsequent lines should be 75 chars (including leading space)
        const lines = folded.split('\r\n')
        for (let i = 1; i < lines.length; i++) {
            expect(lines[i].length).toBeLessThanOrEqual(75)
            expect(lines[i].startsWith(' ')).toBe(true)
        }
    })

    it('folds at exactly 75 octets for first line, 74 for continuation', () => {
        const line = 'A'.repeat(150)
        const folded = foldLine(line)
        const lines = folded.split('\r\n')

        expect(lines[0].length).toBe(75)
        expect(lines[1].length).toBe(75) // space + 74 chars
    })
})

describe('serializeTimezone', () => {
    it('serializes a timezone with STANDARD observance only', () => {
        const timezone: ICSTimezone = {
            tzid: 'America/Phoenix',
            standard: {
                tzOffsetFrom: '-0700',
                tzOffsetTo: '-0700',
                tzName: 'MST',
                dtStart: { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0, utc: false },
            },
        }

        const lines = serializeTimezone(timezone)

        expect(lines).toContain('BEGIN:VTIMEZONE')
        expect(lines).toContain('TZID:America/Phoenix')
        expect(lines).toContain('BEGIN:STANDARD')
        expect(lines).toContain('TZOFFSETFROM:-0700')
        expect(lines).toContain('TZOFFSETTO:-0700')
        expect(lines).toContain('TZNAME:MST')
        expect(lines).toContain('DTSTART:19700101T000000')
        expect(lines).toContain('END:STANDARD')
        expect(lines).toContain('END:VTIMEZONE')
    })

    it('serializes a timezone with both STANDARD and DAYLIGHT observances', () => {
        const timezone: ICSTimezone = {
            tzid: 'America/New_York',
            standard: {
                tzOffsetFrom: '-0400',
                tzOffsetTo: '-0500',
                tzName: 'EST',
                dtStart: { year: 1970, month: 11, day: 1, hour: 2, minute: 0, second: 0, utc: false },
                rrule: 'FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
            },
            daylight: {
                tzOffsetFrom: '-0500',
                tzOffsetTo: '-0400',
                tzName: 'EDT',
                dtStart: { year: 1970, month: 3, day: 8, hour: 2, minute: 0, second: 0, utc: false },
                rrule: 'FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
            },
        }

        const lines = serializeTimezone(timezone)

        expect(lines).toContain('BEGIN:VTIMEZONE')
        expect(lines).toContain('TZID:America/New_York')

        // STANDARD block
        expect(lines).toContain('BEGIN:STANDARD')
        expect(lines).toContain('TZOFFSETFROM:-0400')
        expect(lines).toContain('TZOFFSETTO:-0500')
        expect(lines).toContain('TZNAME:EST')
        expect(lines).toContain('RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU')
        expect(lines).toContain('END:STANDARD')

        // DAYLIGHT block
        expect(lines).toContain('BEGIN:DAYLIGHT')
        expect(lines).toContain('TZOFFSETFROM:-0500')
        expect(lines).toContain('TZOFFSETTO:-0400')
        expect(lines).toContain('TZNAME:EDT')
        expect(lines).toContain('RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU')
        expect(lines).toContain('END:DAYLIGHT')

        expect(lines).toContain('END:VTIMEZONE')
    })

    it('serializes a timezone without optional fields', () => {
        const timezone: ICSTimezone = {
            tzid: 'UTC',
            standard: {
                tzOffsetFrom: '+0000',
                tzOffsetTo: '+0000',
            },
        }

        const lines = serializeTimezone(timezone)

        expect(lines).toContain('BEGIN:VTIMEZONE')
        expect(lines).toContain('TZID:UTC')
        expect(lines).toContain('TZOFFSETFROM:+0000')
        expect(lines).toContain('TZOFFSETTO:+0000')
        expect(lines).not.toContain('TZNAME')
        expect(lines).not.toContain('DTSTART')
        expect(lines).not.toContain('RRULE')
    })
})