import { Temporal } from 'temporal-polyfill'
import { expandEvent } from 'ics-suite'
import type { ICSEvent, ExpandedEvent } from 'ics-suite'

type RecurringEventsProps = {
  event: ICSEvent
  month: Temporal.PlainDate
}

export default function RecurringEvents({ event, month }: RecurringEventsProps) {
  const start = month.with({ day: 1 })
  const end = month.with({ day: month.daysInMonth })

  const instances: ExpandedEvent[] = expandEvent(event, {
    start,
    end,
    inclusive: true,
  })

  return (
    <div className="section-card space-y-2">
      <h3 className="text-sm font-semibold">
        {event.summary} — {instances.length} occurrences this month
      </h3>
      <ul className="space-y-1">
        {instances.map((instance, i) => (
          <li
            key={i}
            className={instance.isOverride ? 'text-amber-600 font-medium' : ''}
          >
            {instance.start.toString()} → {instance.end.toString()}
            {instance.isOverride && ' (rescheduled)'}
          </li>
        ))}
      </ul>
    </div>
  )
}