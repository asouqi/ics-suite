/**
 * Represents a BEGIN:COMPONENT line.
 * @example BEGIN:VEVENT -> { type: 'BEGIN', component: 'VEVENT' }
 */
export type BeginToken = {
    type: 'BEGIN',
    component: string
}

/**
 * Represents an END:COMPONENT line.
 * @example END:VEVENT -> { type: 'END', component: 'VEVENT' }
 */
export type EndToken = {
    type: 'END',
    component: string
}

/**
 * Represents a property line with a name, optional parameters, and value.
 * @example
 * DTSTART;TZID=America/New_York:20240101T090000 -> {
 *     type: 'PROPERTY',
 *     name: 'DTSTART',
 *     params: {
 *         TZID: 'America/New_York'
 *     },
 *     value: '20240101T090000'
 * }
 */
export type PropertyToken = {
    type: 'PROPERTY',
    name: string
    params: Record<string, string>
    value: string
}

export type Token = BeginToken | EndToken | PropertyToken