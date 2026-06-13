import {ICSCalendar} from "../types"

export type ParseOptions = {
    /**
     * Whether to throw on errors or collect them and continue.
     * Default: false
     * */
    strict?: boolean

    /**
     * Override the timezone used to interpret floating datetimes
     * (datetime with no Z and no TZID).
     * Default: UTC
     */
    defaultTimezone?: string
}

export type ParseResult = {
    calendar: ICSCalendar
    errors: ParseIssue[]
    warnings: ParseIssue[]
}

export type ParseIssue = {
    message: string
    property?: string
    raw?: string
}
