import {Alarm, Calendar, Event, Journal, Timezone, TimezoneObservance, Todo} from "../schema";

import {IComponentPropertyAssigner, IPropertyAssignerRegistry} from "./types";

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

    registry.register('VCALENDAR', new Calendar())
    registry.register('VEVENT', new Event())
    registry.register('VTODO', new Todo())
    registry.register('VJOURNAL', new Journal())
    registry.register('VALARM', new Alarm())
    registry.register('VTIMEZONE', new Timezone())
    registry.register('STANDARD', new TimezoneObservance())
    registry.register('DAYLIGHT', new TimezoneObservance())

    return registry
  }
}