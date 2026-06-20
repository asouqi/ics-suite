import {ICSCalendar} from "../types"

import {Query} from "./event"
import {ConflictPair,
    EventFilter,
    QueryError,
    IJournalQuery,
    IQuery,
    ITodoQuery,
    QueryFilter,
    SortField,
    SortOrder} from "./types"

export type {
    IQuery,
    ITodoQuery,
    IJournalQuery,
    ConflictPair,
    SortField,
    SortOrder,
    QueryFilter,
    EventFilter,
}
export { QueryError }

/**
 * ## Query
 *
 * Chainable API for filtering, transforming, and sorting expanded
 * calendar events within a date window.
 *
 * @example
 * import { parse, query } from 'ics-suite'
 * import { Temporal } from 'temporal-polyfill'
 *
 * const { calendar } = parse(icsString)
 *
 * const events = query(calendar)
 *   .between(
 *     Temporal.PlainDate.from('2024-01-01'),
 *     Temporal.PlainDate.from('2024-01-31'),
 *   )
 *   .withAttendee('alice@example.com')
 *   .withStatus('CONFIRMED')
 *   .inTimezone('Asia/Amman')
 *   .sortBy('start')
 *   .get()
 */
export function query(calendar: ICSCalendar): IQuery {
    return new Query(calendar)
}
