import {ICSDateOrDateTime, ICSDuration, ICSRecurrenceRule, ICSTimezone} from "../types";

/**
 * Formats a date value to iCalendar DATE format
 */
export function serializeDate(date: { year: number; month: number; day: number }): string {
    const year = String(date.year).padStart(4, '0')
    const month = String(date.month).padStart(2, '0')
    const day = String(date.day).padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 * Formats a date-time value to iCalendar DATE-TIME format
 */
export function serializeDateTime(dt: ICSDateOrDateTime): string {
    if (!('hour' in dt)) {
        // It's a DATE
        return serializeDate(dt)
    }

    const datePart = serializeDate(dt)
    const hour = String(dt.hour).padStart(2, '0')
    const minute = String(dt.minute).padStart(2, '0')
    const second = String(dt.second).padStart(2, '0')
    const utcSuffix = dt.utc ? 'Z' : ''

    return `${datePart}T${hour}${minute}${second}${utcSuffix}`
}

/**
 * Formats a duration value to iCalendar DURATION format
 */
export function serializeDuration(duration: ICSDuration): string {
    const sign = duration.negative ? '-' : ''
    let result = 'P'

    if (duration.weeks) {
        result += `${duration.weeks}W`
    } else {
        if (duration.days) result += `${duration.days}D`

        const hasTime = duration.hours || duration.minutes || duration.seconds
        if (hasTime) {
            result += 'T'
            if (duration.hours) result += `${duration.hours}H`
            if (duration.minutes) result += `${duration.minutes}M`
            if (duration.seconds) result += `${duration.seconds}S`
        }
    }

    return sign + result
}

/**
 * Formats a recurrence rule to iCalendar RECUR format
 */
export function serializeRecurrenceRule(rrule: ICSRecurrenceRule): string {
    const parts: string[] = [`FREQ=${rrule.freq}`]

    if (rrule.until) {
        parts.push(`UNTIL=${serializeDateTime(rrule.until)}`)
    }
    if (rrule.count !== undefined) {
        parts.push(`COUNT=${rrule.count}`)
    }
    if (rrule.interval !== undefined && rrule.interval !== 1) {
        parts.push(`INTERVAL=${rrule.interval}`)
    }
    if (rrule.bySecond) {
        parts.push(`BYSECOND=${rrule.bySecond.join(',')}`)
    }
    if (rrule.byMinute) {
        parts.push(`BYMINUTE=${rrule.byMinute.join(',')}`)
    }
    if (rrule.byHour) {
        parts.push(`BYHOUR=${rrule.byHour.join(',')}`)
    }
    if (rrule.byDay) {
        const days = rrule.byDay.map(d =>
            d.ordinal ? `${d.ordinal}${d.day}` : d.day
        )
        parts.push(`BYDAY=${days.join(',')}`)
    }
    if (rrule.byMonthDay) {
        parts.push(`BYMONTHDAY=${rrule.byMonthDay.join(',')}`)
    }
    if (rrule.byYearDay) {
        parts.push(`BYYEARDAY=${rrule.byYearDay.join(',')}`)
    }
    if (rrule.byWeekNo) {
        parts.push(`BYWEEKNO=${rrule.byWeekNo.join(',')}`)
    }
    if (rrule.byMonth) {
        parts.push(`BYMONTH=${rrule.byMonth.join(',')}`)
    }
    if (rrule.bySetPos) {
        parts.push(`BYSETPOS=${rrule.bySetPos.join(',')}`)
    }
    if (rrule.weekStart) {
        parts.push(`WKST=${rrule.weekStart}`)
    }

    return parts.join(';')
}

/**
 * Escapes text values for iCalendar format
 */
export function escapeText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
}

/**
 * Unescapes text values from iCalendar format
 */
export function unescapeText(text: string): string {
    return text
        .replace(/\\n/g, '\n')      // \n → newline
        .replace(/\\,/g, ',')       // \, → comma
        .replace(/\\;/g, ';')       // \; → semicolon
        .replace(/\\\\/g, '\\')     // \\ → backslash (must be last!)
}

/**
 * Formats a property line with parameters
 */
export function formatProperty(
    name: string,
    value: string,
    params?: Record<string, string>
): string {
    let line = name

    if (params && Object.keys(params).length > 0) {
        for (const [key, val] of Object.entries(params)) {
            line += `;${key}=${val}`
        }
    }

    line += `:${value}`
    return line
}

/**
 * Folds a line to 75 octets as per RFC 5545
 */
export function foldLine(line: string): string {
    if (line.length <= 75) return line

    const lines: string[] = []
    let start = 0

    while (start < line.length) {
        const end = start + (start === 0 ? 75 : 74)
        lines.push(line.substring(start, end))
        start = end
    }

    return lines.join('\r\n ')
}

export function serializeTimezone(timezone: ICSTimezone): string[] {
    const lines: string[] = []

    lines.push('BEGIN:VTIMEZONE')
    lines.push(`TZID:${timezone.tzid}`)

    if (timezone.standard) {
        lines.push('BEGIN:STANDARD')
        lines.push(`TZOFFSETFROM:${timezone.standard.tzOffsetFrom}`)
        lines.push(`TZOFFSETTO:${timezone.standard.tzOffsetTo}`)
        if (timezone.standard.tzName) {
            lines.push(`TZNAME:${timezone.standard.tzName}`)
        }
        if (timezone.standard.dtStart) {
            lines.push(`DTSTART:${serializeDateTime(timezone.standard.dtStart)}`)
        }
        if (timezone.standard.rrule) {
            lines.push(`RRULE:${timezone.standard.rrule}`)
        }
        lines.push('END:STANDARD')
    }

    if (timezone.daylight) {
        lines.push('BEGIN:DAYLIGHT')
        lines.push(`TZOFFSETFROM:${timezone.daylight.tzOffsetFrom}`)
        lines.push(`TZOFFSETTO:${timezone.daylight.tzOffsetTo}`)
        if (timezone.daylight.tzName) {
            lines.push(`TZNAME:${timezone.daylight.tzName}`)
        }
        if (timezone.daylight.dtStart) {
            lines.push(`DTSTART:${serializeDateTime(timezone.daylight.dtStart)}`)
        }
        if (timezone.daylight.rrule) {
            lines.push(`RRULE:${timezone.daylight.rrule}`)
        }
        lines.push('END:DAYLIGHT')
    }

    lines.push('END:VTIMEZONE')

    return lines
}