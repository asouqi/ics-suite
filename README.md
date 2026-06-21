# ics-suite

A TypeScript-first library for working with `.ics` calendar files.

Parse, query, validate, diff, and expand iCalendar data.

```ts
import { parse, query, validate, diff, expand } from 'ics-suite'
import { Temporal } from 'temporal-polyfill'

const { calendar } = parse(icsString)

const events = query(calendar)
  .between(
    Temporal.PlainDate.from('2024-01-01'),
    Temporal.PlainDate.from('2024-01-31'),
  )
  .withAttendee('alice@example.com')
  .withStatus('CONFIRMED')
  .inTimezone('Asia/Amman')
  .get()
```

---

- **Lenient parser** — handles malformed files from Google, Apple, and Outlook without crashing
- **Recurrence expansion** — expands `RRULE` into concrete instances, handling `EXDATE` and `RECURRENCE-ID` overrides correctly
- **Chainable query API** — filter, sort, and transform events in a single expression
- **Structured validation** — RFC 5545 rule checks with section references, not silent failures
- **Calendar diffing** — compare two versions of a calendar and get exactly what changed
- **Round-trip fidelity** — parse and serialize back to valid `.ics` without data loss

---

## Installation

```bash
npm install ics-suite
```

`temporal-polyfill` is a required peer dependency for timezone-aware date arithmetic.

---

## API

### `parse(input, options?)`

Parses a raw `.ics` string into a typed `ICSCalendar`. Always succeeds — errors are collected rather than thrown.

```ts
const { calendar, errors, warnings } = parse(icsString)

if (errors.length > 0) {
  console.warn('Issues found:', errors)
}
```

Use `parseStrict` to throw on the first error instead:

```ts
const calendar = parseStrict(icsString) // throws ParseError on invalid input
```

**Options**

| Option | Type | Default | Description |
|---|---|---|---|
| `strict` | `boolean` | `false` | Throw on first error |
| `defaultTimezone` | `string` | `'UTC'` | Timezone for floating datetimes |

---

### `query(calendar)`

Chainable API for filtering and transforming expanded events within a date window. Recurring events are expanded automatically.

```ts
const events = query(calendar)
  .between(start, end)       // set the date window — required
  .on(date)                  // shorthand for a single day
  .inclusive()               // make the end boundary inclusive
  .where(e => ...)           // custom predicate
  .withAttendee(email)       // filter by attendee
  .withOrganizer(email)      // filter by organizer
  .withStatus('CONFIRMED')   // filter by status
  .withCategory('work')      // filter by category
  .recurring()               // only recurring events
  .nonRecurring()            // only one-off events
  .inTimezone('Asia/Amman')  // convert to timezone
  .sortBy('start')           // sort field: start | end | summary
  .sortOrder('asc')          // asc | desc
  .get()                     // execute — returns ExpandedEvent[]

// Terminal methods
query(calendar).between(start, end).first()      // first match or undefined
query(calendar).between(start, end).count()      // number of matches
query(calendar).between(start, end).conflicts()  // overlapping event pairs
```

Each `ExpandedEvent` has a concrete `start`, `end`, a reference to the original `event`, and an `isOverride` flag.

---

### `validate(calendar)`

Checks a parsed calendar against RFC 5545 rules. Returns structured issues with RFC section references.

```ts
const { valid, errors, warnings } = validate(calendar)

errors.forEach(e => {
  console.error(`[${e.rfc}] ${e.component} — ${e.message}`)
  // [RFC 5545, Section 3.6.1] VEVENT — missing required UID property
})
```

- `valid` is `true` when there are no errors — warnings do not affect it
- Every issue carries `severity`, `message`, `rfc`, `component`, and optionally `uid` and `property`

---

### `diff(calendarA, calendarB, options?)`

Compares two calendars and returns what changed. Components are matched by `UID`.

```ts
const result = diff(oldCalendar, newCalendar)

result.events   // ComponentChange<ICSEvent>[]
result.todos    // ComponentChange<ICSTodo>[]
result.journals // ComponentChange<ICSJournal>[]
result.isEmpty  // true when nothing changed
```

Each change is one of three shapes:

```ts
{ type: 'added',    item: ICSEvent }
{ type: 'removed',  item: ICSEvent }
{ type: 'modified', before: ICSEvent, after: ICSEvent, changedFields: string[] }
```

`DTSTAMP`, `LAST-MODIFIED`, and `SEQUENCE` are excluded from comparison by default — only user-visible fields trigger a modification.

**Options**

| Option | Type | Default | Description |
|---|---|---|---|
| `ignoreFields` | `string[]` | `[]` | Additional fields to exclude |
| `includeOverrides` | `boolean` | `true` | Detect changes to recurring series overrides |

---

### `expand(event, options)`

Expands a single `ICSEvent` into concrete instances within a date window. Called automatically by `query()` — use directly when you need to expand a single event.

```ts
const instances = expand(event, {
  start: Temporal.PlainDate.from('2024-01-01'),
  end:   Temporal.PlainDate.from('2024-01-31'),
})
```

**Options**

| Option | Type | Default | Description |
|---|---|---|---|
| `start` | `Temporal` | — | Window start (required) |
| `end` | `Temporal` | — | Window end (required) |
| `defaultTimezone` | `string` | `'UTC'` | Timezone for floating datetimes |
| `maxInstances` | `number` | `1000` | Safety cap on output size |
| `inclusive` | `boolean` | `false` | Include events on the end boundary |

---

## License

MIT