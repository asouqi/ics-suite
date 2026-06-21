/**
 * ## Diff
 *
 * Compares two ICSCalendar objects and returns a structured description
 * of what changed between them.
 *
 * Components are matched by UID. For each UID the diff determines whether
 * the component was added, removed, or modified. Modification is detected
 * by comparing semantic fields — metadata fields like DTSTAMP, LAST-MODIFIED,
 * and SEQUENCE are excluded by default.
 */

import type { ICSCalendar } from '../types/calendar.ts'
import type { ICSEvent } from '../types/event.ts'
import type { ICSJournal } from '../types/journal.ts'
import type { ICSTodo } from '../types/todo.ts'

import type { ComponentChange, DiffOptions, DiffResult, ModifiedChange } from './types.ts'

export type { ComponentChange, DiffOptions, DiffResult }

// ---------------------------------------------------------------------------
// Fields excluded from comparison by default
// ---------------------------------------------------------------------------

/**
 * Fields that change automatically without user intent.
 * Excluded from modification detection by default.
 */
const DEFAULT_IGNORED_FIELDS = new Set(['dtStamp', 'lastModified', 'sequence'])

// ---------------------------------------------------------------------------
// Semantic fields compared per component type
// ---------------------------------------------------------------------------

const EVENT_FIELDS: (keyof ICSEvent)[] = [
  'summary',
  'description',
  'location',
  'dtStart',
  'dtEnd',
  'duration',
  'status',
  'class',
  'priority',
  'transp',
  'url',
  'color',
  'geo',
  'rrule',
  'organizer',
  'attendees',
  'categories',
  'alarms',
  'exDate',
  'rDate',
  'recurrenceId',
]

const TODO_FIELDS: (keyof ICSTodo)[] = [
  'summary',
  'description',
  'location',
  'dtStart',
  'due',
  'duration',
  'completed',
  'status',
  'class',
  'priority',
  'percentComplete',
  'url',
  'rrule',
  'organizer',
  'attendees',
  'categories',
]

const JOURNAL_FIELDS: (keyof ICSJournal)[] = [
  'summary',
  'description',
  'dtStart',
  'status',
  'class',
  'categories',
  'rrule',
  'organizer',
]

/**
 * Compares two ICSCalendar objects and returns a DiffResult describing
 * what changed between them.
 *
 * @param a       - The old calendar
 * @param b       - The new calendar
 * @param options - Diff options
 * @returns A DiffResult with changes grouped by component type
 */
export function diff(a: ICSCalendar, b: ICSCalendar, options: DiffOptions = {}): DiffResult {
  const ignoreFields = buildIgnoreSet(options.ignoreFields)
  const includeOverrides = options.includeOverrides ?? true

  const events = diffComponents<ICSEvent>(
    a.events || [],
    b.events || [],
    EVENT_FIELDS,
    ignoreFields,
    includeOverrides,
  )

  const todos = diffComponents<ICSTodo>(
    a.todos || [],
    b.todos || [],
    TODO_FIELDS,
    ignoreFields,
    false, // todos do not have overrides in the same sense
  )

  const journals = diffComponents<ICSJournal>(
    a.journals,
    b.journals,
    JOURNAL_FIELDS,
    ignoreFields,
    false,
  )

  return {
    events,
    todos,
    journals,
    isEmpty: events.length === 0 && todos.length === 0 && journals.length === 0,
  }
}

// ---------------------------------------------------------------------------
// Core diffing logic
// ---------------------------------------------------------------------------

/**
 * Diffs two arrays of components by UID, returning a list of changes.
 * Generic over T — works for events, todos, and journals.
 */
function diffComponents<T extends { uid: string; overrides?: ICSEvent[] }>(
  oldItems: T[],
  newItems: T[],
  fields: (keyof T)[],
  ignoreFields: Set<string>,
  includeOverrides: boolean,
): ComponentChange<T>[] {
  const oldMap = new Map(oldItems.map((item) => [item.uid, item]))
  const newMap = new Map(newItems.map((item) => [item.uid, item]))

  const changes: ComponentChange<T>[] = []

  // Removed — in old but not in new
  for (const [uid, item] of oldMap) {
    if (!newMap.has(uid)) {
      changes.push({ type: 'removed', item })
    }
  }

  // Added — in new but not in old
  for (const [uid, item] of newMap) {
    if (!oldMap.has(uid)) {
      changes.push({ type: 'added', item })
    }
  }

  // Modified — in both but different
  for (const [uid, oldItem] of oldMap) {
    const newItem = newMap.get(uid)
    if (!newItem) continue

    const changedFields = findChangedFields(oldItem, newItem, fields, ignoreFields)

    // Also check overrides when enabled
    if (includeOverrides && hasOverrideChanges(oldItem, newItem)) {
      if (!changedFields.includes('overrides')) {
        changedFields.push('overrides')
      }
    }

    if (changedFields.length > 0) {
      changes.push({
        type: 'modified',
        before: oldItem,
        after: newItem,
        changedFields,
      } satisfies ModifiedChange<T>)
    }
  }

  return changes
}

/**
 * Returns the names of fields that differ between two components.
 * Excludes fields in the ignore set.
 */
function findChangedFields<T>(
  a: T,
  b: T,
  fields: (keyof T)[],
  ignoreFields: Set<string>,
): string[] {
  const changed: string[] = []

  for (const field of fields) {
    const fieldName = String(field)
    if (ignoreFields.has(fieldName)) continue
    if (!deepEqual(a[field], b[field])) {
      changed.push(fieldName)
    }
  }

  return changed
}

/**
 * Checks whether the overrides on two events differ.
 * Compares override count and recurrenceId values.
 */
function hasOverrideChanges(a: { overrides?: ICSEvent[] }, b: { overrides?: ICSEvent[] }): boolean {
  const aOverrides = a.overrides ?? []
  const bOverrides = b.overrides ?? []

  if (aOverrides.length !== bOverrides.length) return true

  // Build sets of recurrenceId keys for fast comparison
  const aKeys = new Set(aOverrides.map((o) => serializeDateOrDateTime(o.recurrenceId)))
  const bKeys = new Set(bOverrides.map((o) => serializeDateOrDateTime(o.recurrenceId)))

  for (const key of aKeys) {
    if (!bKeys.has(key)) return true
  }

  return false
}

/**
 * Deep equality check for calendar field values.
 * Handles primitives, arrays, objects, and undefined.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  if (a === null || b === null) return a === b

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object)
    const bKeys = Object.keys(b as object)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  }

  return false
}

/**
 * Builds the complete set of fields to ignore during comparison.
 * Merges the default ignored fields with any user-provided ones.
 */
function buildIgnoreSet(extraFields?: string[]): Set<string> {
  const set = new Set(DEFAULT_IGNORED_FIELDS)
  if (extraFields) {
    for (const field of extraFields) set.add(field)
  }
  return set
}

/**
 * Serializes a date or datetime value to a string key.
 * Used for comparing recurrenceId values across override sets.
 */
function serializeDateOrDateTime(value: unknown): string {
  if (!value || typeof value !== 'object') return String(value)
  const v = value as Record<string, unknown>
  if ('hour' in v) {
    return `${v.year}${v.month}${v.day}T${v.hour}${v.minute}${v.second}`
  }
  return `${v.year}${v.month}${v.day}`
}
