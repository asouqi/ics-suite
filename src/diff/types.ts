import type { ICSEvent, ICSTodo, ICSJournal } from '../types'

/**
 * ## Added Component
 *
 * A component that exists in the new calendar but not the old one.
 */
export type AddedChange<T> = {
  type: 'added'
  /** The newly added component */
  item: T
}

/**
 * ## Removed Component
 *
 * A component that existed in the old calendar but not the new one.
 */
export type RemovedChange<T> = {
  type: 'removed'
  /** The removed component */
  item: T
}

/**
 * ## Modified Component
 *
 * A component whose semantic fields changed between the two calendars.
 * Identified by matching UID.
 *
 * Metadata fields (DTSTAMP, LAST-MODIFIED, SEQUENCE) are excluded
 * from the comparison — only user-visible fields are considered.
 */
export type ModifiedChange<T> = {
  type: 'modified'
  /** The component as it was in the old calendar */
  before: T
  /** The component as it is in the new calendar */
  after: T
  /** The names of the fields that changed */
  changedFields: string[]
}

/**
 * ## Component Change
 *
 * A discriminated union of all possible change types for a component.
 */
export type ComponentChange<T> = AddedChange<T> | RemovedChange<T> | ModifiedChange<T>

/**
 * ## Diff Result
 *
 * The complete result of comparing two calendars.
 * Each array contains changes for a specific component type.
 */
export type DiffResult = {
  /** Changes to VEVENT components */
  events: ComponentChange<ICSEvent>[]
  /** Changes to VTODO components */
  todos: ComponentChange<ICSTodo>[]
  /** Changes to VJOURNAL components */
  journals: ComponentChange<ICSJournal>[]
  /**
   * True when there are no changes of any kind.
   * Convenience flag — equivalent to checking all arrays are empty.
   */
  isEmpty: boolean
}

/**
 * ## Diff Options
 *
 * Controls what the diff considers a meaningful change.
 */
export type DiffOptions = {
  /**
   * Additional field names to exclude from the comparison.
   * By default DTSTAMP, LAST-MODIFIED, and SEQUENCE are excluded.
   *
   * @example ['color', 'url'] — ignore color and url changes
   */
  ignoreFields?: string[]

  /**
   * When true, changes to RECURRENCE-ID overrides within a recurring
   * series are reported as modifications to the base event.
   * When false, override changes are ignored.
   *
   * Default: true
   */
  includeOverrides?: boolean
}
