import type { ICSEvent } from '../types'

import { expandEvent } from './engine'
import type { ExpandedEvent, ExpandOptions } from './types.ts'

export type { ExpandedEvent, ExpandOptions }

/**
 * Expands an ICSEvent into concrete occurrences within the given window.
 *
 * For non-recurring events returns at most one instance.
 * For recurring events returns all instances within the window,
 * with RECURRENCE-ID overrides applied.
 *
 * @returns A sorted array of ExpandedEvent instances
 * @param event
 * @param options
 */
export function expand(event: ICSEvent, options: ExpandOptions): ExpandedEvent[] {
  return expandEvent(event, options)
}
