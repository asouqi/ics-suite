import {Temporal} from "temporal-polyfill";

import {ExpandedEvent} from "../expander/types";
import {ICSStatus} from "../types";

/**
 * ## Sort Field
 *
 * The field to sort results by.
 *
 * - start   — sort by instance start datetime (default)
 * - end     — sort by instance end datetime
 * - summary — sort alphabetically by title
 */
export type SortField = 'start' | 'end' | 'summary'

/**
 * ## Sort Order
 *
 * The direction of the sort.
 *
 * - asc  — ascending, earliest first or A→Z (default)
 * - desc — descending, latest first or Z→A
 */
export type SortOrder = 'asc' | 'desc'

/**
 * ## Query Filter
 *
 * A generic predicate function passed to `.where()`.
 * Typed over the expanded instance type T.
 *
 * @example
 * // For IQuery (events)
 * const filter: QueryFilter<ExpandedEvent> = e => e.event.summary === 'Standup'
 *
 * // For ITodoQuery
 * const filter: QueryFilter<ExpandedTodo> = t => (t.event.percentComplete ?? 0) < 100
 */
export type QueryFilter<T> = (item: T) => boolean

/**
 * ## Event Filter
 *
 * Convenience alias for QueryFilter<ExpandedEvent>.
 * Used by IQuery.
 */
export type EventFilter = QueryFilter<ExpandedEvent>

// TODO:: TodoFilter and JournalFilter


/**
 * ## Query State
 *
 * Internal accumulator holding all options set via chained method calls.
 * Generic over the filter type so each component query has typed filters.
 */
export type QueryState<T> = {
    start?: Temporal.ZonedDateTime | Temporal.PlainDate
    end?: Temporal.ZonedDateTime | Temporal.PlainDate
    inclusive: boolean
    filters: QueryFilter<T>[]
    timezone?: string
    sortField: SortField
    sortOrder: SortOrder
    maxInstances: number
}

/**
 * ## Conflict Pair
 *
 * A pair of ExpandedEvent instances that overlap in time.
 * Returned by IQuery.conflicts().
 *
 * Conflict detection is event-specific — todos and journals
 * do not have the same timed overlap semantics.
 */
export type ConflictPair = {
    a: ExpandedEvent
    b: ExpandedEvent
}

/**
 * ## IBaseQuery
 *
 * The shared chainable contract for all component query types.
 * Generic over T — the expanded instance type being queried.
 *
 * Every method except the terminal methods (.get(), .first(), .count())
 * returns `this` for chaining.
 *
 * Specialised by:
 * - IQuery        for VEVENT via ExpandedEvent
 * - ITodoQuery    for VTODO via ExpandedTodo
 * - IJournalQuery for VJOURNAL via ExpandedJournal
 */
export interface IBaseQuery<T> {
    /**
     * Sets the expansion window. Only components that start within this
     * range are included. Recurring components are expanded within this window.
     *
     * Required before calling any terminal method. Calling .get(), .first(),
     * or .count() without a window throws a QueryError.
     *
     * @param start - Start of the window (inclusive)
     * @param end   - End of the window (exclusive by default)
     */
    between(
        start: Temporal.ZonedDateTime | Temporal.PlainDate,
        end: Temporal.ZonedDateTime | Temporal.PlainDate,
    ): this

    /**
     * Shorthand for a window of exactly one calendar day.
     * Equivalent to .between(startOfDay, endOfDay).
     *
     * @param date - The date to query
     */
    on(date: Temporal.PlainDate): this

    /**
     * Makes the end boundary of the window inclusive.
     * By default .between() uses an exclusive end boundary.
     */
    inclusive(): this

    /**
     * Adds a custom filter predicate.
     * Multiple .where() calls are ANDed together.
     *
     * @param fn - A predicate that returns true to include the item
     */
    where(fn: QueryFilter<T>): this

    /**
     * Filters to components with the given status.
     *
     * @param status - The ICSStatus value to match
     */
    withStatus(status: ICSStatus): this

    /**
     * Filters to components that include the given category.
     * Comparison is case-insensitive.
     *
     * @param category - The category string to match
     */
    withCategory(category: string): this

    /**
     * Filters to components organized by the given email address.
     * Comparison is case-insensitive.
     *
     * @param email - The organizer email address to match
     */
    withOrganizer(email: string): this

    /**
     * Filters to only recurring instances.
     * An instance is recurring when its base component has an RRULE.
     */
    recurring(): this

    /**
     * Filters to only non-recurring instances.
     * An instance is non-recurring when its base component has no RRULE.
     */
    nonRecurring(): this

    /**
     * Sets the field to sort results by.
     * Default: 'start'
     *
     * @param field - The field to sort by
     */
    sortBy(field: SortField): this

    /**
     * Sets the sort direction.
     * Default: 'asc'
     *
     * @param order - 'asc' or 'desc'
     */
    sortOrder(order: SortOrder): this

    /**
     * Executes the query and returns all matching instances.
     * Throws a QueryError when no window has been set.
     *
     * @returns A sorted array of expanded instances
     */
    get(): T[]

    /**
     * Executes the query and returns the first matching instance.
     * Returns undefined when no instances match.
     */
    first(): T | undefined

    /**
     * Executes the query and returns the number of matching instances
     * without building the full result array.
     */
    count(): number
}

/**
 * ## IQuery
 *
 * The query interface for VEVENT components.
 * Extends IBaseQuery<ExpandedEvent> with event-specific methods.
 *
 * Returned by query(calendar).
 */
export interface IQuery extends IBaseQuery<ExpandedEvent> {
    /**
     * Filters to events that include the given email as an attendee.
     * Comparison is case-insensitive.
     *
     * @param email - The attendee email address to match
     */
    withAttendee(email: string): this

    /**
     * Converts all instance start and end datetime to the given timezone.
     * Has no effect on all-day events (PlainDate instances).
     *
     * @param timezone - A valid IANA timezone identifier
     */
    inTimezone(timezone: string): this

    /**
     * Executes the query and returns pairs of instances that overlap in time.
     * Two instances conflict when one starts before the other ends.
     *
     * @returns An array of ConflictPair objects
     */
    conflicts(): ConflictPair[]
}

/**
 * ## ITodoQuery
 *
 * The query interface for VTODO components.
 * Extends IBaseQuery<ExpandedTodo> with todo-specific methods.
 *
 * Returned by queryTodos(calendar).
 */
export interface ITodoQuery extends IBaseQuery<'ExpandedTodo'> {
    /**
     * Filters to todos where percent complete falls within the given range.
     * Both min and max are inclusive.
     *
     * @param min - Minimum percent complete (0–100)
     * @param max - Maximum percent complete (0–100)
     */
    withPercentComplete(min: number, max: number): this

    /**
     * Filters to todos that are past their due date and not yet completed.
     * Compares against today's date.
     */
    overdue(): this
}


/**
 * ## IJournalQuery
 *
 * The query interface for VJOURNAL components.
 * Extends IBaseQuery<ExpandedJournal> with journal-specific methods.
 *
 * Returned by queryJournals(calendar).
 *
 * Journals are simple — no conflict detection, no timezone conversion,
 * no attendee filtering. The base interface covers all common needs.
 */
// export interface IJournalQuery extends IBaseQuery<'ExpandedJournal'> {}

/**
 * ## QueryError
 *
 * Thrown when a query is executed without a required windowing call,
 * or when an invalid option is provided.
 */
export class QueryError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'QueryError'
    }
}
