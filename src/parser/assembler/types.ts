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

/** Handles parsing and assignment of a single property value. */
export interface IPropertyHandler<T> {
  handle(
    data: T,
    value: string,
    params: Record<string, string>
  ): void
}

/** Manages property assignment for a specific component type. */
export interface IComponentPropertyAssigner {
  readonly componentType: string

  assignProperty(
    data: unknown,
    name: string,
    value: string,
    params: Record<string, string>,
    warnings: AssemblyIssue[]
  ): void
}

/** Registry of property assigners by component type */
export interface IPropertyAssignerRegistry {
  register(componentType: string, assigner: IComponentPropertyAssigner): void
  getAssigner(componentType: string): IComponentPropertyAssigner | undefined
}