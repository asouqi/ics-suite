import { ICSAlarm, ICSCalendar, ICSEvent, ICSJournal, ICSTimezoneObservance, ICSTodo } from '../../types'

import { PropertyHandlers as P } from './property'
import { AssemblyIssue, IComponentPropertyAssigner, IPropertyHandler } from './types'
import { parseAttendee, parseDuration, parseOrganizer, parseRRule } from './util'


abstract class BaseComponentAssigner<T> implements IComponentPropertyAssigner {
  abstract readonly componentType: string
  protected abstract readonly propertyMap: Record<string, IPropertyHandler<unknown>>

  assignProperty(
    data: T,
    name: string,
    value: string,
    params: Record<string, string>,
    warnings: AssemblyIssue[],
  ): void {
    const handler = this.propertyMap[name]

    if (handler) {
      handler.handle(data, value, params)
    } else {
      this.handleUnknow(name, warnings)
    }
  }

  protected handleUnknow(name: string, warnings: AssemblyIssue[]): void {
    warnings.push({
      message: `Unknow ${this.componentType} property: ${name}`,
      property: name
    })
  }
}

export class CalendarAssigner extends BaseComponentAssigner<ICSCalendar> {
  readonly componentType = 'VCALENDAR'

  protected readonly propertyMap = {
    PRODID: P.string('prodId'),
    VERSION: P.string('version'),
    CALSCALE: P.string('calScale'),
    METHOD: P.string('method'),
    'X-WR-CALNAME': P.string('name'),
    'X-WR-CALDESC': P.string('description'),
    'X-WR-TIMEZONE': P.string('timezone'),
  }
}

export class EventAssigner extends BaseComponentAssigner<ICSEvent> {
  readonly componentType = 'VEVENT'

  protected readonly propertyMap = {
    UID: P.string('uid'),
    DTSTAMP: P.dateTime('dtStamp'),
    DTSTART: P.dateTime('dtStart'),
    DTEND: P.dateTime('dtEnd'),
    DURATION: P.duration('duration'),
    SUMMARY: P.string('summary'),
    DESCRIPTION: P.string('description'),
    LOCATION: P.string('location'),
    URL: P.string('url'),
    STATUS: P.string('status'),
    CLASS: P.string('class'),
    PRIORITY: P.int('priority'),
    TRANSP: P.string('transp'),
    SEQUENCE: P.int('sequence'),
    CREATED: P.dateTime('created'),
    'LAST-MODIFIED': P.dateTime('lastModified'),
    RRULE: P.custom<ICSEvent>((data, value) => {
      data.rrule = parseRRule(value)
    }),
    EXDATE: P.addDateTime('exDate'),
    RDATE: P.addDateTime('rDate'),
    'RECURRENCE-ID': P.dateTime('recurrenceId'),
    ORGANIZER: P.custom<ICSEvent>((data, value, params) => {
      data.organizer = parseOrganizer(value, params)
    }),
    ATTENDEE: P.custom<ICSEvent>((data, value, params) => {
      data.attendees = data.attendees ?? []
      data.attendees.push(parseAttendee(value, params))
    }),
    CATEGORIES: P.custom<ICSEvent>((data, value) => {
      data.categories = value.split(',').map((c) => c.trim())
    }),
    COLOR: P.string('color'),
    GEO: P.custom<ICSEvent>((data, value) => {
      const [lat, lon] = value.split(';').map(Number)
      data.geo = { lat, lon }
    }),
    COMMENT: P.addValue('comment'),
  }
}

export class TodoAssigner extends BaseComponentAssigner<ICSTodo> {
  readonly componentType = 'VTODO'

  protected readonly propertyMap = {
    UID: P.string('uid'),
    DTSTAMP: P.dateTime('dtStamp'),
    DTSTART: P.dateTime('dtStart'),
    DUE: P.dateTime('due'),
    DURATION: P.duration('duration'),
    COMPLETED: P.dateTime('completed'),
    SUMMARY: P.string('summary'),
    DESCRIPTION: P.string('description'),
    LOCATION: P.string('location'),
    URL: P.string('url'),
    STATUS: P.string('status'),
    CLASS: P.string('class'),
    PRIORITY: P.int('priority'),
    SEQUENCE: P.int('sequence'),
    'PERCENT-COMPLETE': P.int('percentComplete'),
    CREATED: P.dateTime('created'),
    'LAST-MODIFIED': P.dateTime('lastModified'),
    RRULE: P.custom<ICSTodo>((data, value) => {
      data.rrule = parseRRule(value)
    }),
    EXDATE: P.addDateTime('exDate'),
    'RECURRENCE-ID': P.dateTime('recurrenceId'),
    ORGANIZER: P.custom<ICSTodo>((data, value, params) => {
      data.organizer = parseOrganizer(value, params)
    }),
    ATTENDEE: P.custom<ICSTodo>((data, value, params) => {
      data.attendees = data.attendees ?? []
      data.attendees.push(parseAttendee(value, params))
    }),
    CATEGORIES: P.custom<ICSTodo>((data, value) => {
      data.categories = value.split(',').map((c) => c.trim())
    }),
  }
}

export class JournalAssigner extends BaseComponentAssigner<ICSJournal> {
  readonly componentType = 'VJOURNAL'

  protected readonly propertyMap = {
    UID: P.string('uid'),
    DTSTAMP: P.dateTime('dtStamp'),
    DTSTART: P.dateTime('dtStart'),
    SUMMARY: P.string('summary'),
    DESCRIPTION: P.addValue('description'),
    STATUS: P.string('status'),
    CLASS: P.string('class'),
    CATEGORIES: P.custom<ICSJournal>((data, value) => {
      data.categories = value.split(',').map((c) => c.trim())
    }),
    CREATED: P.dateTime('created'),
    'LAST-MODIFIED': P.dateTime('lastModified'),
    SEQUENCE: P.int('sequence'),
    RRULE: P.custom<ICSJournal>((data, value) => {
      data.rrule = parseRRule(value)
    }),
    EXDATE: P.addDateTime('exDate'),
    'RECURRENCE-ID': P.dateTime('recurrenceId'),
    ORGANIZER: P.custom<ICSJournal>((data, value, params) => {
      data.organizer = parseOrganizer(value, params)
    }),
    ATTENDEE: P.custom<ICSJournal>((data, value, params) => {
      data.attendees = data.attendees ?? []
      data.attendees.push(parseAttendee(value, params))
    }),
    COMMENT: P.addValue('comment'),
  }
}

export class AlarmAssigner extends BaseComponentAssigner<ICSAlarm> {
  readonly componentType = 'VALARM'

  protected readonly propertyMap = {
    ACTION: P.string('action'),
    TRIGGER: P.custom<ICSAlarm>((data, value, params) => {
      data.trigger = value.startsWith('P') || value.startsWith('-P') ? parseDuration(value) : value
      if (params.RELATED) data.triggerRelation = params.RELATED as ICSAlarm['triggerRelation']
    }),
    DESCRIPTION: P.string('description'),
    SUMMARY: P.string('summary'),
    REPEAT: P.int('repeat'),
    DURATION: P.duration('duration'),
    ATTACH: P.string('attach'),
  }
}

export class TimezoneObservance extends BaseComponentAssigner<ICSTimezoneObservance> {
  readonly componentType = 'STANDARD/DAYLIGHT'

  protected readonly propertyMap = {
    TZOFFSETFROM: P.string('tzOffsetFrom'),
    TZOFFSETTO: P.string('tzOffsetTo'),
    TZNAME: P.string('tzName'),
    DTSTART: P.string('dtStart'),
    RRULE: P.string('rrule'), // stored raw
  }
}