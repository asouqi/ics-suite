import {PropertyAssignerRegistry} from "../schema/registry"
import {ICSAlarm, ICSCalendar, ICSEvent, ICSTodo} from "../types"

import {foldLine, serializeTimezone} from "./util"

/**
 * Serialize a calendar to .ics format
 */
export function serialize(calendar: ICSCalendar): string {
    const lines: string[] = []
    const registry = PropertyAssignerRegistry.create()

    lines.push('BEGIN:VCALENDAR')

    const calendarAssigner = registry.getAssigner('VCALENDAR')
    if (calendarAssigner) {
        lines.push(...calendarAssigner.serializeProperties(calendar))
    }

    if (calendar.events && calendar.events.length > 0) {
        for (const event of calendar.events) {
            lines.push(...serializeEvent(event, registry))
        }
    }

    if (calendar.todos && calendar.todos.length > 0) {
        for (const todo of calendar.todos) {
            lines.push(...serializeTodo(todo, registry))
        }
    }

    const journalAssigner = registry.getAssigner('VJOURNAL')
    if (calendar.journals && calendar.journals.length > 0) {
        for (const journal of calendar.journals) {
            lines.push('BEGIN:VJOURNAL')
            lines.push(...journalAssigner!.serializeProperties(journal))
            lines.push('END:VJOURNAL')
        }
    }

    if (calendar.timezones && calendar.timezones.length > 0) {
        for (const timezone of calendar.timezones) {
            lines.push(...serializeTimezone(timezone))
        }
    }

    lines.push('END:VCALENDAR')

    return lines.map(foldLine).join('\r\n') + '\r\n'
}


function serializeEvent(event: ICSEvent, registry: PropertyAssignerRegistry) {
    const lines: string[] = []

    lines.push('BEGIN:VEVENT')

    // Serialize event properties using the EventAssigner
    lines.push(...registry.getAssigner('VEVENT')!.serializeProperties(event))

    // Serialize child VALARM components
    if (event.alarms && event.alarms.length > 0) {
        for (const alarm of event.alarms) {
            lines.push(...serializeAlarm(alarm, registry))
        }
    }

    // Serialize recurrence overrides
    if (event.overrides && event.overrides.length > 0) {
        for (const override of event.overrides) {
            lines.push(...serializeEvent(override, registry))
        }
    }

    lines.push('END:VEVENT')

    return lines
}

function serializeTodo(todo: ICSTodo, registry: PropertyAssignerRegistry): string[] {
    const lines: string[] = []

    lines.push('BEGIN:VTODO')

    lines.push(...registry.getAssigner('VTODO')!.serializeProperties(todo))

    if (todo.alarms && todo.alarms.length > 0) {
        for (const alarm of todo.alarms) {
            lines.push(...serializeAlarm(alarm, registry))
        }
    }

    lines.push('END:VTODO')

    return lines
}

function serializeAlarm(alarm: ICSAlarm, registry: PropertyAssignerRegistry): string[] {
    const lines: string[] = []

    lines.push('BEGIN:VALARM')

    lines.push(...registry.getAssigner('VALARM')!.serializeProperties(alarm))

    lines.push('END:VALARM')

    return lines
}