import { ICSAlarm, ICSCalendar, ICSEvent, ICSRecurrenceRule, ICSTodo } from '../types'

import { ValidationIssue } from './types'

function error(
  message: string,
  rfc: string,
  component: string,
  extra: Partial<ValidationIssue> = {},
): ValidationIssue {
  return { severity: 'ERROR', message, rfc, component, ...extra }
}

function warning(
  message: string,
  rfc: string,
  component: string,
  extra: Partial<ValidationIssue> = {},
): ValidationIssue {
  return { severity: 'WARNING', message, rfc, component, ...extra }
}

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * VCALENDAR MUST have a PRODID property
 * @rfc RFC 5545, Section 3.7.3
 */
export function requireProdId(calendar: ICSCalendar): ValidationIssue[] {
  if (!calendar.prodId || calendar.prodId.trim().length === 0) {
    return [
      error(
        'VCALENDAR is missing the required PRODID property',
        'RFC 5545, Section 3.7.3',
        'VCALENDAR',
        { property: 'PRODID' },
      ),
    ]
  }
  return []
}

/**
 * VCALENDAR MUST have a VERSION property with value "2.0"
 * @rfc RFC 5545, Section 3.7.4
 */
export function requireVersion(calendar: ICSCalendar): ValidationIssue[] {
  if (!calendar.version) {
    return [
      error(
        'VCALENDAR is missing the required VERSION property',
        'RFC 5545, Section 3.7.4',
        'VCALENDAR',
        { property: 'VERSION' },
      ),
    ]
  }
  if (calendar.version !== '2.0') {
    return [
      error(
        `VCALENDAR VERSION must be "2.0" but got "${calendar.version}"`,
        'RFC 5545, Section 3.7.4',
        'VCALENDAR',
        { property: 'VERSION' },
      ),
    ]
  }

  return []
}

/**
 * VEVENT MUST have a UID property.
 *
 * @rfc RFC 5545, Section 3.6.1
 */
export function requireEventUid(event: ICSEvent): ValidationIssue[] {
  if (!event.uid || event.uid.trim().length === 0) {
    return [
      error(
        'VEVENT is missing the required UID property',
        'RFC 5545, Section 3.6.1',
        'VEVENT',
        { property: 'UID', }
      ),
    ]
  }
  return []
}

/**
 * VEVENT MUST have a DTSTAMP property.
 *
 * @rfc RFC 5545, Section 3.6.1
 */
export function requireEventDtStamp(event: ICSEvent): ValidationIssue[] {
  if (!event.dtStamp) {
    return [
      error(
        'VEVENT is missing the required DTSTAMP property',
        'RFC 5545, Section 3.6.1',
        'VEVENT',
        { uid: event.uid, property: 'DTSTAMP' },
      ),
    ]
  }
  return []
}

/**
 * VEVENT SHOULD have a SUMMARY property.
 * Not required by the RFC but expected by all calendar applications.
 *
 * @rfc RFC 5545, Section 3.6.1
 */
export function recommendEventSummary(event: ICSEvent): ValidationIssue[] {
  if (!event.summary || event.summary.trim().length === 0) {
    return [
      warning(
        'VEVENT is missing a SUMMARY — most calendar applications require it',
        'RFC 5545, Section 3.6.1',
        'VEVENT',
        { uid: event.uid, property: 'SUMMARY' },
      ),
    ]
  }
  return []
}

/**
 * VEVENT MUST NOT have both DTEND and DURATION.
 *
 * @rfc RFC 5545, Section 3.6.1
 */
export function prohibitEventDtEndAndDuration(event: ICSEvent): ValidationIssue[] {
  if (isDefined(event.dtEnd) && isDefined(event.duration)) {
    return [
      error(
        'VEVENT must not have both DTEND and DURATION',
        'RFC 5545, Section 3.6.1',
        'VEVENT',
        { uid: event.uid },
      ),
    ]
  }
  return []
}

/**
 * When VEVENT has a DURATION, DTSTART MUST also be present.
 *
 * @rfc RFC 5545, Section 3.6.1
 */
export function requireDtStartWithDuration(event: ICSEvent): ValidationIssue[] {
  if (isDefined(event.duration) && !isDefined(event.dtStart)) {
    return [
      error(
        'VEVENT has a DURATION but no DTSTART — DTSTART is required when DURATION is present',
        'RFC 5545, Section 3.6.1',
        'VEVENT',
        { uid: event.uid, property: 'DTSTART' },
      ),
    ]
  }
  return []
}


/**
 * VEVENT DTEND MUST be later than DTSTART when both are present.
 * Checks only datetime values — date-only values are compared by date.
 *
 * @rfc RFC 5545, Section 3.8.2.2
 */
export function requireDtEndAfterDtStart(event: ICSEvent): ValidationIssue[] {
  if (!isDefined(event.dtStart) || !isDefined(event.dtEnd)) return []

  const start = event.dtStart
  const end = event.dtEnd

  // Build comparable numeric timestamps from the date/datetime fields
  const startVal =
    'hour' in start
      ? start.year * 10000000000 + start.month * 100000000 + start.day * 1000000 + start.hour * 10000 + start.minute * 100 + start.second
      : start.year * 10000 + start.month * 100 + start.day

  const endVal =
    'hour' in end
      ? end.year * 10000000000 + end.month * 100000000 + end.day * 1000000 + end.hour * 10000 + end.minute * 100 + end.second
      : end.year * 10000 + end.month * 100 + end.day

  if (endVal < startVal) {
    return [
      error(
        'VEVENT DTEND must not be earlier than DTSTART',
        'RFC 5545, Section 3.8.2.2',
        'VEVENT',
        { uid: event.uid, property: 'DTEND' },
      ),
    ]
  }
  return []
}

/**
 * VEVENT PRIORITY must be between 0 and 9 when present.
 *
 * @rfc RFC 5545, Section 3.8.1.9
 */
export function validateEventPriority(event: ICSEvent): ValidationIssue[] {
  if (!isDefined(event.priority)) return []
  if (event.priority < 0 || event.priority > 9) {
    return [
      error(
        `VEVENT PRIORITY must be 0–9 but got ${event.priority}`,
        'RFC 5545, Section 3.8.1.9',
        'VEVENT',
        { uid: event.uid, property: 'PRIORITY' },
      ),
    ]
  }
  return []
}

/**
 * VEVENT STATUS must be one of TENTATIVE, CONFIRMED, or CANCELLED.
 *
 * @rfc RFC 5545, Section 3.8.1.11
 */
const VALID_EVENT_STATUS = new Set(['TENTATIVE', 'CONFIRMED', 'CANCELLED'])

export function validateEventStatus(event: ICSEvent): ValidationIssue[] {
  if (!isDefined(event.status)) return []
  if (!VALID_EVENT_STATUS.has(event.status)) {
    return [
      error(
        `VEVENT STATUS "${event.status}" is not valid — must be TENTATIVE, CONFIRMED, or CANCELLED`,
        'RFC 5545, Section 3.8.1.11',
        'VEVENT',
        { uid: event.uid, property: 'STATUS' },
      ),
    ]
  }
  return []
}

/**
 * VTODO MUST have a UID property.
 *
 * @rfc RFC 5545, Section 3.6.2
 */
export function requireTodoUid(todo: ICSTodo): ValidationIssue[] {
  if (!todo.uid || todo.uid.trim().length === 0) {
    return [
      error(
        'VTODO is missing the required UID property',
        'RFC 5545, Section 3.6.2',
        'VTODO',
        { property: 'UID' },
      ),
    ]
  }
  return []
}

/**
 * VTODO MUST have a DTSTAMP property.
 *
 * @rfc RFC 5545, Section 3.6.2
 */
export function requireTodoDtStamp(todo: ICSTodo): ValidationIssue[] {
  if (!todo.dtStamp) {
    return [
      error(
        'VTODO is missing the required DTSTAMP property',
        'RFC 5545, Section 3.6.2',
        'VTODO',
        { uid: todo.uid, property: 'DTSTAMP' },
      ),
    ]
  }
  return []
}

/**
 * VTODO MUST NOT have both DUE and DURATION.
 *
 * @rfc RFC 5545, Section 3.6.2
 */
export function prohibitTodoDueAndDuration(todo: ICSTodo): ValidationIssue[] {
  if (isDefined(todo.due) && isDefined(todo.duration)) {
    return [
      error(
        'VTODO must not have both DUE and DURATION',
        'RFC 5545, Section 3.6.2',
        'VTODO',
        { uid: todo.uid },
      ),
    ]
  }
  return []
}

/**
 * VTODO PERCENT-COMPLETE must be between 0 and 100 when present.
 *
 * @rfc RFC 5545, Section 3.8.1.8
 */
export function validateTodoPercentComplete(todo: ICSTodo): ValidationIssue[] {
  if (!isDefined(todo.percentComplete)) return []
  if (todo.percentComplete < 0 || todo.percentComplete > 100) {
    return [
      error(
        `VTODO PERCENT-COMPLETE must be 0–100 but got ${todo.percentComplete}`,
        'RFC 5545, Section 3.8.1.8',
        'VTODO',
        { uid: todo.uid, property: 'PERCENT-COMPLETE' },
      ),
    ]
  }
  return []
}

/**
 * VTODO STATUS must be one of the valid values for VTODO.
 *
 * @rfc RFC 5545, Section 3.8.1.11
 */
const VALID_TODO_STATUS = new Set([
  'NEEDS-ACTION',
  'COMPLETED',
  'IN-PROCESS',
  'CANCELLED',
])

export function validateTodoStatus(todo: ICSTodo): ValidationIssue[] {
  if (!isDefined(todo.status)) return []
  if (!VALID_TODO_STATUS.has(todo.status)) {
    return [
      error(
        `VTODO STATUS "${todo.status}" is not valid — must be NEEDS-ACTION, COMPLETED, IN-PROCESS, or CANCELLED`,
        'RFC 5545, Section 3.8.1.11',
        'VTODO',
        { uid: todo.uid, property: 'STATUS' },
      ),
    ]
  }
  return []
}


/**
 * RRULE MUST NOT have both COUNT and UNTIL.
 *
 * @rfc RFC 5545, Section 3.3.10
 */
export function prohibitCountAndUntil(
  rrule: ICSRecurrenceRule,
  component: string,
  uid?: string,
): ValidationIssue[] {
  if (isDefined(rrule.count) && isDefined(rrule.until)) {
    return [
      error(
        'RRULE must not have both COUNT and UNTIL',
        'RFC 5545, Section 3.3.10',
        component,
        { uid, property: 'RRULE' },
      ),
    ]
  }
  return []
}

/**
 * RRULE INTERVAL must be a positive integer when present.
 *
 * @rfc RFC 5545, Section 3.3.10
 */
export function validateRRuleInterval(
  rrule: ICSRecurrenceRule,
  component: string,
  uid?: string,
): ValidationIssue[] {
  if (!isDefined(rrule.interval)) return []
  if (rrule.interval < 1 || !Number.isInteger(rrule.interval)) {
    return [
      error(
        `RRULE INTERVAL must be a positive integer but got ${rrule.interval}`,
        'RFC 5545, Section 3.3.10',
        component,
        { uid, property: 'RRULE' },
      ),
    ]
  }
  return []
}

/**
 * RRULE COUNT must be a positive integer when present.
 *
 * @rfc RFC 5545, Section 3.3.10
 */
export function validateRRuleCount(
  rrule: ICSRecurrenceRule,
  component: string,
  uid?: string,
): ValidationIssue[] {
  if (!isDefined(rrule.count)) return []
  if (rrule.count < 1 || !Number.isInteger(rrule.count)) {
    return [
      error(
        `RRULE COUNT must be a positive integer but got ${rrule.count}`,
        'RFC 5545, Section 3.3.10',
        component,
        { uid, property: 'RRULE' },
      ),
    ]
  }
  return []
}


/**
 * VALARM MUST have an ACTION property.
 *
 * @rfc RFC 5545, Section 3.6.6
 */
export function requireAlarmAction(alarm: ICSAlarm): ValidationIssue[] {
  if (!alarm.action) {
    return [
      error(
        'VALARM is missing the required ACTION property',
        'RFC 5545, Section 3.6.6',
        'VALARM',
        { property: 'ACTION' },
      ),
    ]
  }
  return []
}

/**
 * VALARM MUST have a TRIGGER property.
 *
 * @rfc RFC 5545, Section 3.6.6
 */
export function requireAlarmTrigger(alarm: ICSAlarm): ValidationIssue[] {
  if (!isDefined(alarm.trigger)) {
    return [
      error(
        'VALARM is missing the required TRIGGER property',
        'RFC 5545, Section 3.6.6',
        'VALARM',
        { property: 'TRIGGER' },
      ),
    ]
  }
  return []
}

/**
 * VALARM with ACTION:DISPLAY MUST have a DESCRIPTION.
 *
 * @rfc RFC 5545, Section 3.6.6
 */
export function requireDisplayAlarmDescription(alarm: ICSAlarm): ValidationIssue[] {
  if (alarm.action === 'DISPLAY' && !alarm.description) {
    return [
      error(
        'VALARM with ACTION:DISPLAY must have a DESCRIPTION property',
        'RFC 5545, Section 3.6.6',
        'VALARM',
        { property: 'DESCRIPTION' },
      ),
    ]
  }
  return []
}

/**
 * VALARM with ACTION:EMAIL MUST have DESCRIPTION and SUMMARY.
 *
 * @rfc RFC 5545, Section 3.6.6
 */
export function requireEmailAlarmFields(alarm: ICSAlarm): ValidationIssue[] {
  if (alarm.action !== 'EMAIL') return []

  const issues: ValidationIssue[] = []

  if (!alarm.description) {
    issues.push(
      error(
        'VALARM with ACTION:EMAIL must have a DESCRIPTION property',
        'RFC 5545, Section 3.6.6',
        'VALARM',
        { property: 'DESCRIPTION' },
      ),
    )
  }

  if (!alarm.summary) {
    issues.push(
      error(
        'VALARM with ACTION:EMAIL must have a SUMMARY property',
        'RFC 5545, Section 3.6.6',
        'VALARM',
        { property: 'SUMMARY' },
      ),
    )
  }

  return issues
}

/**
 * VALARM REPEAT and DURATION must both be present or both be absent.
 *
 * @rfc RFC 5545, Section 3.6.6
 */
export function requireRepeatAndDurationTogether(alarm: ICSAlarm): ValidationIssue[] {
  const hasRepeat = isDefined(alarm.repeat)
  const hasDuration = isDefined(alarm.duration)

  if (hasRepeat !== hasDuration) {
    return [
      error(
        'VALARM REPEAT and DURATION must both be present or both be absent',
        'RFC 5545, Section 3.6.6',
        'VALARM',
        { property: hasRepeat ? 'REPEAT' : 'DURATION' },
      ),
    ]
  }
  return []
}
