# ics-suite

A TypeScript-first library for working with `.ics` calendar files. Parse, query, validate, and diff iCalendar data — without needing to understand the RFC spec yourself.

---

## What is an .ics file?

An `.ics` file is a plain text file that represents calendar data. It is the universal format for sharing calendar events — when you export your Google Calendar, receive a meeting invite by email, or subscribe to a public events feed, you are working with `.ics` files.

The format is governed by a specification called iCalendar, defined in RFC 5545. Despite being a standard, every major vendor — Google, Apple, and Microsoft Outlook — interprets and extends it slightly differently, which is a large part of why working with `.ics` files in practice is harder than it should be.

---

## The anatomy of an .ics file

An `.ics` file is made up of nested blocks called components. Each component begins with `BEGIN:` and ends with `END:`. The outermost block is always `VCALENDAR`. Inside it, you find one or more of the following:

**VEVENT** — a calendar event. This is what most people think of when they think of a calendar entry: a title, a start time, an end time, a location, a list of attendees, and so on.

**VTODO** — a task or to-do item with an optional due date. Similar to an event but without a fixed time slot.

**VJOURNAL** — a journal entry associated with a date. Rarely used in practice.

**VTIMEZONE** — timezone definition data embedded in the file, describing offset rules and daylight saving time transitions for a given timezone.

**VALARM** — a reminder attached to an event or task. Defines when and how a notification should fire.

Each component contains a list of properties. A property is a key-value pair, sometimes with additional parameters. For example, an event's start time is the `DTSTART` property, its title is `SUMMARY`, and its unique identifier is `UID`.

---

## What makes .ics files hard to work with

**Recurring events.** Instead of storing fifty copies of a weekly meeting, the format stores one event with a recurrence rule (`RRULE`) that describes the pattern. Expanding that rule into concrete dates — especially when individual instances have been modified or cancelled — requires non-trivial logic. This is the single most common source of bugs in calendar software.

**Timezones.** Dates in `.ics` files can be expressed in UTC, in a named timezone, or as a floating time with no timezone at all. Each case requires different handling. When a recurring event crosses a daylight saving time boundary, the expansion logic must account for the clock change — otherwise events appear at the wrong time.

**Vendor quirks.** Google, Apple, and Outlook all emit files that technically violate the RFC in small ways. A library that only accepts perfectly compliant files will silently fail on a large share of real-world data.

**Round-trip fidelity.** Many libraries can parse an `.ics` file but cannot write one back out correctly. A file that is parsed and then serialized should produce output that any calendar application can read without errors.

---

## What ics-suite does

ics-suite treats a calendar file as a queryable data structure rather than a raw text format. It is designed around the jobs developers actually need to do, not around the structure of the RFC spec.

**Parsing** reads an `.ics` string — including malformed files from real-world sources — and produces a structured in-memory representation of the calendar and all its components.

**Expansion** takes recurring events and produces a flat list of concrete instances within a given date range, correctly handling recurrence rules, excluded dates, and per-instance modifications.

**Querying** provides a chainable API for filtering and transforming events by date range, attendee, timezone, or any custom condition — without needing to write manual filter loops.

**Validation** checks a parsed calendar against RFC 5545 and returns structured errors and warnings, each with a reference to the specific rule that was violated. Unlike parsers that silently ignore invalid data, ics-suite tells you exactly what is wrong and why.

**Diffing** compares two versions of a calendar and returns what was added, removed, or modified — understanding that a change to one instance of a recurring series is a modification, not a deletion and an addition.

**Serialization** writes a calendar back to a valid `.ics` string with round-trip fidelity, producing output that passes validation in Google Calendar, Apple Calendar, and Outlook.

---

## Who this is for

ics-suite is for developers who need to do real work with calendar data — building scheduling tools, syncing calendar feeds, importing or exporting events, validating user-uploaded files, or detecting conflicts across multiple calendars. It is not a minimal parser. It is a complete toolkit for the full lifecycle of working with `.ics` files in a production application.

---

## Design principles

**Job-shaped, not spec-shaped.** The API is organized around what developers need to do, not around the structure of RFC 5545. You should not need to read the RFC to use this library.

**Concrete results.** Methods return expanded event instances with real dates. Recurrence rules, timezone identifiers, and raw property strings stay inside the library where they belong.

**Explicit over implicit.** Timezone behavior is always explicit. There are no silent defaults that produce different results on different machines.

**Loud failures.** When something is wrong with an input file, ics-suite tells you what is wrong, where it is, and which rule it violates — instead of returning empty results or throwing an untyped error.

**Zero magic.** The library has no side effects, no global state, and no configuration files. Every function takes input and returns output.