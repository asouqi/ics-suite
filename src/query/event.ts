import {Temporal} from "temporal-polyfill";

import {expandEvent} from "../expander";
import {ExpandedEvent} from "../expander/types";
import {ICSCalendar, ICSStatus} from "../types";

import {ConflictPair, EventFilter, IQuery, QueryError, QueryState, SortField, SortOrder} from "./types";

/**
 * Implementation of the IQuery interface for VEVENT component. Accumulates options via
 * chained method calls and executes the full pipeline on .get().
 *
 * Pipeline order on execution:
 * 1. Expand all events in the calendar using the expander
 * 2. Apply all filters in order
 * 3. Apply timezone conversion when set
 * 4. Sort results
 *
 * Nothing executes until a terminal method is called.
 */
export class Query implements IQuery {
    readonly #calendar: ICSCalendar
    readonly #state: QueryState<ExpandedEvent>

    constructor(calendar: ICSCalendar, state?: QueryState<ExpandedEvent>) {
        this.#calendar = calendar
        this.#state = state ?? {
            inclusive: false,
            filters: [],
            sortField: 'start',
            sortOrder: 'asc',
            maxInstances: 1000,
        }
    }

    between(
        start: Temporal.ZonedDateTime | Temporal.PlainDate,
        end: Temporal.ZonedDateTime | Temporal.PlainDate,
    ): this {
        this.#state.start = start
        this.#state.end = end
        return this
    }

    on(date: Temporal.PlainDate): this {
        this.#state.start = date
        this.#state.end = date
        this.#state.inclusive = true
        return this
    }

    inclusive(): this {
        this.#state.inclusive = true
        return this
    }

    where(fn: EventFilter): this {
        this.#state.filters.push(fn)
        return this
    }

    withAttendee(email: string): this {
        const normalised = email.toLowerCase()
        return this.where(e =>
            e.event.attendees?.some(a => a.email.toLowerCase() === normalised) ?? false,
        )
    }

    withOrganizer(email: string): this {
        const normalised = email.toLowerCase()
        return this.where(e =>
            (e.event.organizer?.email.toLowerCase() ?? '') === normalised,
        )
    }

    withStatus(status: ICSStatus): this {
        return this.where(e => e.event.status === status)
    }

    withCategory(category: string): this {
        const normalised = category.toLowerCase()
        return this.where(e =>
            e.event.categories?.some(c => c.toLowerCase() === normalised) ?? false,
        )
    }

    recurring(): this {
        return this.where(e => e.event.rrule !== undefined)
    }

    nonRecurring(): this {
        return this.where(e => e.event.rrule === undefined)
    }

    inTimezone(timezone: string): this {
        this.#state.timezone = timezone
        return this
    }

    sortBy(field: SortField): this {
        this.#state.sortField = field
        return this
    }

    sortOrder(order: SortOrder): this {
        this.#state.sortOrder = order
        return this
    }

    get(): ExpandedEvent[] {
        return this.#execute()
    }

    first(): ExpandedEvent | undefined {
        return this.#execute()[0]
    }

    count(): number {
        return this.#execute().length
    }

    conflicts(): ConflictPair[] {
        const instances = this.#execute()
        const pairs: ConflictPair[] = []

        for (let i = 0; i < instances.length; i++) {
            for (let j = i + 1; j < instances.length; j++) {
                if (overlaps(instances[i], instances[j])) {
                    pairs.push({ a: instances[i], b: instances[j] })
                }
            }
        }

        return pairs
    }

    #execute(): ExpandedEvent[] {
        const { start, end, inclusive, filters, timezone, sortField, sortOrder, maxInstances } =
            this.#state

        if (!start || !end) {
            throw new QueryError(
                'No date window set — call .between() or .on() before .get()',
            )
        }

        // Step 1 — expand all events in the calendar
        let results: ExpandedEvent[] = this.#calendar!.events?.flatMap(event =>
            expandEvent(event, { start, end, inclusive, maxInstances }),
        ) || []

        // Step 2 — apply all filters in order (AND semantics)
        for (const filter of filters) {
            results = results.filter(filter)
        }

        // Step 3 — apply timezone conversion
        if (timezone) {
            results = results.map(instance => convertTimezone(instance, timezone))
        }

        // Step 4 — sort
        results = sortResults(results, sortField, sortOrder)

        return results
    }
}


function convertTimezone(instance: ExpandedEvent, timezone: string) {
    const start = instance.start instanceof Temporal.ZonedDateTime
    ? instance.start.withTimeZone(timezone)
        : instance.start

    const end = instance.end instanceof Temporal.ZonedDateTime
    ? instance.end.withTimeZone(timezone)
        : instance.end

    return {...instance, start, end}
}

/**
 * Returns true when two expanded event instances overlap in time.
 * Two instances overlap when one starts before the other ends.
 * All-day events are compared by date only.
 */
function overlaps(a: ExpandedEvent, b: ExpandedEvent) {
    // all day event
    if (a.start instanceof Temporal.PlainDate && b.start instanceof Temporal.PlainDate) {
        return Temporal.PlainDate.compare(a.start, b.end) < 0 && Temporal.PlainDate.compare(b.start, a.end) < 0
    }

    if (a.start instanceof Temporal.ZonedDateTime && b.start instanceof Temporal.ZonedDateTime) {
        return Temporal.ZonedDateTime.compare(a.start, b.end) < 0 && Temporal.ZonedDateTime.compare(b.start, a.end) < 0
    }

    // mixed
    const aStart = toComparableDate(a.start)
    const aEnd = toComparableDate(a.end)
    const bStart = toComparableDate(b.start)
    const bEnd = toComparableDate(b.end)

    return Temporal.PlainDate.compare(aStart, bEnd) < 0 && Temporal.PlainDate.compare(bStart, aEnd) < 0
}

function toComparableDate(
    value: Temporal.ZonedDateTime | Temporal.PlainDate,
): Temporal.PlainDate {
    if (value instanceof Temporal.PlainDate) return value
    return value.toPlainDate()
}

function sortResults(results: ExpandedEvent[], field: SortField, order: SortOrder) {
    return [...results].sort((a, b) => {
        let comparison = 0

        switch (field) {
            case "start":
                comparison = compareTemporalValues(a.start, b.start)
                break
            case "end":
                comparison = compareTemporalValues(a.end, b.end)
                break
            case "summary": {
                const aSummary = a.event.summary ?? ''
                const bSummary = b.event.summary ?? ''
                comparison = aSummary.localeCompare(bSummary)
                break
            }
        }

        return order === 'asc' ? comparison : -comparison
    })
}

function compareTemporalValues(
    a: Temporal.ZonedDateTime | Temporal.PlainDate,
    b: Temporal.ZonedDateTime | Temporal.PlainDate,
) {
    if (a instanceof Temporal.PlainDate && b instanceof Temporal.PlainDate) {
        return Temporal.PlainDate.compare(a, b)
    }

    if (a instanceof Temporal.ZonedDateTime && b instanceof Temporal.ZonedDateTime) {
        return Temporal.ZonedDateTime.compare(a, b)
    }

    return Temporal.PlainDate.compare(toComparableDate(a), toComparableDate(b))
}