import { PropertyToken, Token } from '../tokenizer/types'
import {
  ICSAlarm,
  ICSCalendar,
  ICSEvent,
  ICSExtendedProperty,
  ICSJournal,
  ICSTimezone,
  ICSTimezoneObservance,
  ICSTodo,
} from '../../types'
import { AssemblyIssue, StackEntry } from './types'
import { PropertyAssignerRegistry } from './registry'

export type AssembleResult = {
  calendar: ICSCalendar
  errors: AssemblyIssue[]
  warnings: AssemblyIssue[]
}

/**
 * Assembles a flat list of token array to a ICSCalendar
 */
export function assemble(tokens: Token[]): AssembleResult {
  const errors: AssemblyIssue[] = []
  const warnings: AssemblyIssue[] = []
  const registry = PropertyAssignerRegistry.create()

  const stack: StackEntry[] = []
  let calendar: Partial<ICSCalendar> = {}

  for (const token of tokens) {
    if (token.type === 'BEGIN') {
      const component = token.component as StackEntry['kind']
      switch (component) {
        case 'VCALENDAR':
          stack.push({
            kind: 'VCALENDAR',
            data: { events: [], todos: [], journals: [], timezones: [] },
          })
          break
        case 'VEVENT':
          stack.push({
            kind: 'VEVENT',
            data: { alarms: [], extended: [] },
          })
          break
        case 'VTODO':
          stack.push({
            kind: 'VTODO',
            data: { alarms: [], extended: [] },
          })
          break
        case 'VJOURNAL':
          stack.push({
            kind: 'VJOURNAL',
            data: {},
          })
          break
        case 'VALARM':
          stack.push({
            kind: 'VALARM',
            data: {},
          })
          break
        case 'VTIMEZONE':
          stack.push({
            kind: 'VTIMEZONE',
            data: {},
          })
          break
        case 'STANDARD':
          stack.push({
            kind: 'STANDARD',
            data: {},
          })
          break
        case 'DAYLIGHT':
          stack.push({
            kind: 'DAYLIGHT',
            data: {},
          })
          break
        default:
          warnings.push({
            message: `Unknown component: ${token.component} — skipping`,
          })
      }
      continue
    }

    if (token.type === 'END') {
      const entry = stack.pop()

      if (!entry) {
        errors.push({ message: `Unexpected END:${token.component} with no matching BEGIN` })
        continue
      }

      if (entry.kind !== token.component) {
        errors.push({
          message: `Mismatched END: expected ${entry.kind} but got ${token.component}`,
        })
        continue
      }

      const parent = stack.at(-1)
      switch (entry.kind) {
        case 'VCALENDAR':
          calendar = entry.data
          break
        case 'VEVENT':
          if (parent?.kind === 'VCALENDAR') {
            parent.data.events!.push(entry.data as ICSEvent)
          }
          break
        case 'VTODO':
          if (parent?.kind === 'VCALENDAR') {
            parent.data.todos!.push(entry.data as ICSTodo)
          }
          break
        case 'VJOURNAL':
          if (parent?.kind === 'VCALENDAR') {
            parent.data.journals!.push(entry.data as ICSJournal)
          }
          break
        case 'VALARM':
          if (parent?.kind === 'VEVENT' || parent?.kind === 'VTODO') {
            parent.data.alarms!.push(entry.data as ICSAlarm)
          }
          break
        case 'VTIMEZONE':
          if (parent?.kind === 'VCALENDAR') {
            parent.data.timezones!.push(entry.data as ICSTimezone)
          }
          break
        case 'STANDARD':
          if (parent?.kind === 'VTIMEZONE') {
            parent.data.standard = entry.data as ICSTimezoneObservance
          }
          break
        case 'DAYLIGHT':
          if (parent?.kind === 'VTIMEZONE') {
            parent.data.daylight = entry.data as ICSTimezoneObservance
          }
          break
      }
      continue
    }

    // assigne property to the current top stack
    const current = stack.at(-1)
    if (!current) {
      warnings.push({
        message: `Property ${token.name} found outside of any component — ignoring`,
        property: token.name,
        raw: token.value,
      })
      continue
    }

    assignProperty(current, token, warnings, registry)
  }

  if (!calendar) {
    errors.push({ message: 'No VCALENDAR component found in input' })
    return {
      calendar: { prodId: '', version: '', events: [], todos: [], journals: [], timezones: [] },
      errors,
      warnings,
    }
  }

  const assembled = calendar as ICSCalendar
  linkRecurrenceOverrides(assembled)

  return { calendar: assembled, errors, warnings }
}

function assignProperty(
  entry: StackEntry,
  token: PropertyToken,
  warnings: AssemblyIssue[],
  registry: PropertyAssignerRegistry,
): void {
  const { name, value, params } = token
  const assigner = registry.getAssigner(entry.kind)

  if (assigner) {
    assigner.assignProperty(entry.data, name, value, params, warnings)
  } else {
    if (name.startsWith('X-')) {
      const ext: ICSExtendedProperty = { name, value, params }
      if ('extended' in entry.data && Array.isArray((entry.data as any).extended)) {
        ;(entry.data as any).extended.push(ext)
      }
      return
    }

    if (name.startsWith('VTIMEZONE') || name.startsWith('TZID')) {
      ;(entry.data as ICSTimezone).tzid = value
      return
    }

    warnings.push({
      message: `No assigner registered for component type: ${entry.kind}`,
      property: name,
    })
  }
}

/**
 * Groups events by UID and attaches any RECURRENCE-ID overrides to their
 * base event. This cannot be done inline during assembly because the
 * override event may appear before or after the base event in the file.
 *
 * After this pass:
 * - Base events have an `overrides` array containing all modified instances
 * - Override events are removed from the top-level calendar.events array
 * - Only base events (and non-recurring events) remain in calendar.events
 */
function linkRecurrenceOverrides(calendar: ICSCalendar): void {
  if (!calendar.events) {
    return
  }

  // Step 1 — group all events by UID
  const byUid = new Map<string, ICSEvent[]>()

  for (const event of calendar.events) {
    if (!event.uid) continue
    const group = byUid.get(event.uid) ?? []
    group.push(event)
    byUid.set(event.uid, group)
  }

  // Step 2 — collect the UIDs of override events so we can remove them
  // from the top-level array after we attach them to their base event
  const overrideUids = new Set<string>()

  for (const [_, group] of byUid) {
    if (group.length < 2) continue

    // The base event has no recurrenceId — all others are overrides
    const base = group.find(e => !e.recurrenceId)
    const overrides = group.filter(e => !!e.recurrenceId)

    if (!base || overrides.length === 0) continue

    // Attach overrides to the base event
    base.overrides = overrides

    // Mark each override UID+recurrenceId pair for removal
    // We use a composite key because the same UID can have many overrides
    for (const override of overrides) {
      overrideUids.add(buildOverrideKey(override))
    }
  }

  // Step 3 — remove override events from the top-level events array
  // They are now accessible only through base.overrides
  if (overrideUids.size > 0) {
    calendar.events = calendar.events.filter(
      e => !e.recurrenceId || !overrideUids.has(buildOverrideKey(e)),
    )
  }
}

/**
 * Builds a unique key for an override event using its UID and recurrenceId.
 * Used to identify and remove override events from the top-level array.
 */
function buildOverrideKey(event: ICSEvent): string {
  const rid = event.recurrenceId
  if (!rid) return event.uid
  // Serialize the recurrenceId to a stable string for use as a map key
  const ridStr = 'year' in rid && 'hour' in rid
    ? `${rid.year}${rid.month}${rid.day}T${rid.hour}${rid.minute}${rid.second}`
    : 'year' in rid
      ? `${rid.year}${rid.month}${rid.day}`
      : String(rid)
  return `${event.uid}::${ridStr}`
}
