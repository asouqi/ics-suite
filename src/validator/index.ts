import { ICSAlarm, ICSCalendar, ICSEvent, ICSRecurrenceRule, ICSTodo } from '../types'

import {
  prohibitCountAndUntil,
  prohibitEventDtEndAndDuration,
  prohibitTodoDueAndDuration,
  recommendEventSummary,
  requireAlarmAction,
  requireAlarmTrigger,
  requireDisplayAlarmDescription,
  requireDtEndAfterDtStart,
  requireDtStartWithDuration,
  requireEmailAlarmFields,
  requireEventDtStamp,
  requireEventUid,
  requireProdId,
  requireRepeatAndDurationTogether,
  requireTodoDtStamp,
  requireTodoUid,
  requireVersion,
  validateEventPriority,
  validateEventStatus,
  validateRRuleCount,
  validateRRuleInterval,
  validateTodoPercentComplete,
  validateTodoStatus,
} from './rules'
import type { ValidationIssue, ValidationResult } from './types'

export type { ValidationIssue, ValidationResult }


/**
 * Validates a parsed ICSCalendar against RFC 5545 rules.
 *
 * Returns a ValidationResult containing all errors and warnings found.
 * A calendar is considered valid when the errors array is empty.
 * Warnings do not affect the valid flag.
 *
 * @param calendar - A parsed ICSCalendar object
 * @returns A ValidationResult with errors, warnings, and a valid flag
 */
export function validate(calendar: ICSCalendar): ValidationResult {
  const issues: ValidationIssue[] = [
    ...validateCalendar(calendar),
    ...(calendar.events?.flatMap(validateEvent) || []),
    ...(calendar.todos?.flatMap(validateTodo) || []),
  ]

  const errors = issues.filter(i => i.severity === 'ERROR')
  const warnings = issues.filter(i => i.severity === 'WARNING')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function validateCalendar(calendar: ICSCalendar) {
  return [
    ...requireProdId(calendar),
    ...requireVersion(calendar),
  ]
}

function validateEvent(event: ICSEvent) {
  const issues:ValidationIssue[] = [
    ...requireEventUid(event),
    ...requireEventDtStamp(event),
    ...recommendEventSummary(event),
    ...prohibitEventDtEndAndDuration(event),
    ...requireDtStartWithDuration(event),
    ...requireDtEndAfterDtStart(event),
    ...validateEventPriority(event),
    ...validateEventStatus(event),
  ]

  if (event.rrule) {
    issues.push(...validateRRule(event.rrule, 'VEVENT', event.uid))
  }

  if (event.alarms) {
    issues.push(...event.alarms.flatMap(validateAlarm))
  }

  if (event.overrides) {
    issues.push(...event.overrides.flatMap(validateEvent))
  }

  return issues
}

function validateTodo(todo: ICSTodo) {
  const issues: ValidationIssue[] = [
    ...requireTodoUid(todo),
    ...requireTodoDtStamp(todo),
    ...prohibitTodoDueAndDuration(todo),
    ...validateTodoPercentComplete(todo),
    ...validateTodoStatus(todo),
  ]

  if (todo.rrule) {
    issues.push(...validateRRule(todo.rrule, 'VTODO', todo.uid))
  }

  if (todo.alarms) {
    issues.push(...todo.alarms.flatMap(validateAlarm))
  }

  return issues
}

function validateRRule(
  rrule: ICSRecurrenceRule,
  component: string,
  uid?: string,
): ValidationIssue[] {
  return [
    ...prohibitCountAndUntil(rrule, component, uid),
    ...validateRRuleInterval(rrule, component, uid),
    ...validateRRuleCount(rrule, component, uid),
  ]
}

function validateAlarm(alarm: ICSAlarm): ValidationIssue[] {
  return [
    ...requireAlarmAction(alarm),
    ...requireAlarmTrigger(alarm),
    ...requireDisplayAlarmDescription(alarm),
    ...requireEmailAlarmFields(alarm),
    ...requireRepeatAndDurationTogether(alarm),
  ]
}
