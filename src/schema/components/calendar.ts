import {ICSCalendar} from "../../types"
import {PropertyHandlers as P } from "../property";

import { BasedComponent } from "./base"

export class Calendar extends BasedComponent<ICSCalendar> {
    readonly componentType: string = 'VCALENDAR'

    readonly propertyMap = {
        PRODID: P.string('prodId'),
        VERSION: P.string('version'),
        CALSCALE: P.string('calScale'),
        METHOD: P.string('method'),
        COLOR: P.string('color'),
        'X-WR-CALNAME': P.string('name'),
        'X-WR-CALDESC': P.string('description'),
        'X-WR-TIMEZONE': P.string('timezone'),
    }
}