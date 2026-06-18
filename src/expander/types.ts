/**
 * ## Expander Types
 *
 * Types forming the public contract of the recurrence expander module.
 *
 * The expander takes a single ICSEvent and a date window, and returns
 * a flat list of concrete occurrences — each with real start and end
 * dates ready to render on a calendar.
 */

import type { Temporal } from 'temporal-polyfill'

import type { ICSEvent } from '../types'

/**
 * ## Expanded Event
 *
 * A single concrete occurrence of an event within the requested window.
 *
 * For a non-recurring event there is exactly one ExpandedEvent.
 * For a recurring event there is one per occurrence within the window,
 * with overridden instances reflected by the `isOverride` flag.
 *
 * The original event is always accessible via `event` — the expander
 * never mutates or copies it.
 */
export type ExpandedEvent = {
  /**
   * The concrete start of this specific occurrence.
   * ZonedDateTime for timed events, PlainDate for all-day events.
   */
  start: Temporal.ZonedDateTime | Temporal.PlainDate

  /**
   * The concrete end of this specific occurrence.
   * ZonedDateTime for timed events, PlainDate for all-day events.
   */
  end: Temporal.ZonedDateTime | Temporal.PlainDate

  /**
   * The original base event.
   * Always a reference — never a copy. Contains uid, summary,
   * location, attendees, rrule, and all other metadata.
   */
  event: ICSEvent

  /**
   * True when this occurrence was replaced by a RECURRENCE-ID override.
   * When true, `override` contains the modified VEVENT.
   */
  isOverride: boolean

  /**
   * The override event when `isOverride` is true.
   * Contains the modified fields for this specific occurrence —
   * different start time, summary, location, etc.
   * Undefined when `isOverride` is false.
   */
  override?: ICSEvent
}

/**
 * ## Expand Options
 *
 * Controls the expansion window and behavior.
 * Only `start` and `end` are required.
 */
export type ExpandOptions = {
  /**
   * The start of the expansion window (inclusive).
   * Occurrences that start before this date are excluded.
   */
  start: Temporal.ZonedDateTime | Temporal.PlainDate

  /**
   * The end of the expansion window.
   * Whether this boundary is inclusive is controlled by `inclusive`.
   * Default behavior is exclusive — occurrences at exactly this
   * datetime are excluded.
   */
  end: Temporal.ZonedDateTime | Temporal.PlainDate

  /**
   * The timezone used to interpret floating datetime values —
   * datetimes with no Z suffix and no TZID parameter.
   *
   * Default: 'UTC'
   */
  defaultTimezone?: string

  /**
   * Maximum number of instances to return.
   * Acts as a safety valve against accidentally expanding an
   * infinite series (no COUNT and no UNTIL).
   *
   * Default: 1000
   */
  maxInstances?: number

  /**
   * Whether the `end` boundary is inclusive.
   * When true, occurrences at exactly `end` are included.
   *
   * Default: false
   */
  inclusive?: boolean
}
