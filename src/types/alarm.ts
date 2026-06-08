/**
 * ## Alarm Component
 *
 * Represents a VALARM component, which defines a reminder or notification
 * attached to a VEVENT or VTODO. A single event may have multiple alarms.
 *
 * The alarm fires at a time calculated relative to the start or end of
 * the parent component, or at an absolute datetime.
 *
 * @rfc RFC 5545, Section 3.6.6
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.6
 */

import type { ICSDuration } from "./common"

/**
 * ## Alarm Action
 *
 * Defines how the alarm is delivered when it fires.
 *
 * - AUDIO: plays a sound
 * - DISPLAY: shows a text notification to the user
 * - EMAIL: sends an email message
 *
 * @rfc RFC 5545, Section 3.8.6.1
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.6.1
 *
 * @example
 * ACTION:DISPLAY
 */
export type ICSAlarmAction = 'AUDIO' | 'DISPLAY' | 'EMAIL'

/**
 * ## Trigger Relationship
 *
 * When the trigger is a duration, this parameter defines whether the
 * duration is relative to the start or end of the parent component.
 * Defaults to START when absent.
 *
 * @rfc RFC 5545, Section 3.2.14 — RELATED parameter
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.14
 *
 * @example
 * TRIGGER;RELATED=END:-PT15M
 */
export type ICSAlarmTriggerRelation = 'START' | 'END'

/**
 * ## Alarm
 *
 * Defines a notification associated with a VEVENT or VTODO.
 * The trigger determines when the alarm fires — either as a duration
 * relative to the event start or end, or as an absolute datetime.
 *
 * Required properties by action type:
 * - All actions: ACTION, TRIGGER
 * - DISPLAY: DESCRIPTION
 * - EMAIL: DESCRIPTION, SUMMARY, at least one ATTENDEE
 * - AUDIO: optionally ATTACH for a custom sound
 *
 * @rfc RFC 5545, Section 3.6.6
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.6
 *
 * @example
 * BEGIN:VALARM
 * ACTION:DISPLAY
 * TRIGGER:-PT15M
 * DESCRIPTION:Reminder
 * END:VALARM
 */
export type ICSAlarm = {
    /**
     * How the alarm is delivered when it fires.
     * Required on every alarm.
     *
     * @rfc RFC 5545, Section 3.8.6.1
     */
    action: ICSAlarmAction

    /**
     * When the alarm fires. Either a duration relative to the parent
     * component's start or end, or an absolute datetime string.
     *
     * A negative duration fires before the related time.
     * A positive duration fires after the related time.
     *
     * @rfc RFC 5545, Section 3.8.6.3
     * @example -PT15M — 15 minutes before the event starts
     */
    trigger: ICSDuration | string

    /**
     * Whether the duration trigger is relative to the start or end
     * of the parent component. Defaults to START when absent.
     *
     * @rfc RFC 5545, Section 3.2.14
     */
    triggerRelation: ICSAlarmTriggerRelation

    /**
     * The text shown to the user for DISPLAY alarms, or the body
     * of the email for EMAIL alarms. Required for both action types.
     *
     * @rfc RFC 5545, Section 3.8.1.5
     */
    description?: string

    /**
     * The subject line of the email for EMAIL alarms.
     * Required when action is EMAIL.
     *
     * @rfc RFC 5545, Section 3.8.1.12
     */
    summary?: string

    /**
     * The number of times the alarm repeats after its initial trigger.
     * Must be paired with `duration` when present.
     *
     * @rfc RFC 5545, Section 3.8.6.2
     */
    repeat?: number

    /**
     * The delay between repeated alarms.
     * Must be paired with `repeat` when present.
     *
     * @rfc RFC 5545, Section 3.8.2.5
     */
    duration?: ICSDuration

    /**
     * For AUDIO alarms: a URI pointing to a sound file to play.
     * For EMAIL alarms: a URI or binary attachment to include.
     *
     * @rfc RFC 5545, Section 3.8.1.1
     */
    attach?: string
}