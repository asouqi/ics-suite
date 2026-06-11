import type { IComponentPropertyAssigner, IPropertyAssignerRegistry } from './types'
import {
  AlarmAssigner,
  CalendarAssigner,
  EventAssigner,
  JournalAssigner,
  TimezoneObservance,
  TodoAssigner,
} from './component'

export class PropertyAssignerRegistry implements IPropertyAssignerRegistry {
  private assigner = new Map<string, IComponentPropertyAssigner>()

  register(componentType: string, assigner: IComponentPropertyAssigner) {
    this.assigner.set(componentType, assigner)
  }

  getAssigner(componentType: string): IComponentPropertyAssigner | undefined {
    return this.assigner.get(componentType)
  }

  static create(): PropertyAssignerRegistry {
    const registry = new PropertyAssignerRegistry()

    registry.register('VCALENDAR', new CalendarAssigner())
    registry.register('VEVENT', new EventAssigner())
    registry.register('VTODO', new TodoAssigner())
    registry.register('VJOURNAL', new JournalAssigner())
    registry.register('VALARM', new AlarmAssigner())
    registry.register('STANDARD', new TimezoneObservance())
    registry.register('DAYLIGHT', new AlarmAssigner())

    return registry
  }
}