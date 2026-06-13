import {
  ICSAlarm,
  ICSCalendar,
  ICSEvent,
  ICSJournal,
  ICSTimezone,
  ICSTimezoneObservance,
  ICSTodo,
} from '../../types'

/**
 * A union
 of all component objects that can sit on the assembly stack.
 * Each entry represents a component currently being built.
 */
export type StackEntry =
  | { kind: 'VCALENDAR'; data: Partial<ICSCalendar> }
  | { kind: 'VEVENT'; data: Partial<ICSEvent> }
  | { kind: 'VTODO'; data: Partial<ICSTodo> }
  | { kind: 'VJOURNAL'; data: Partial<ICSJournal> }
  | { kind: 'VALARM'; data: Partial<ICSAlarm> }
  | { kind: 'VTIMEZONE'; data: Partial<ICSTimezone> }
  | { kind: 'STANDARD'; data: Partial<ICSTimezoneObservance> }
  | { kind: 'DAYLIGHT'; data: Partial<ICSTimezoneObservance> }


export type AssemblyIssue = {
  message: string
  property?: string
  raw?: string
}