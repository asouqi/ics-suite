import {ICSTimezoneObservance} from "../../types";
import {PropertyHandlers as P } from "../property";

import {BasedComponent} from "./base";

export class Timezone extends BasedComponent<ICSTimezoneObservance> {
    readonly componentType = 'VTIMEZONE'

    protected readonly propertyMap = {
        TZID: P.string('tzid'),
    }
}

export class TimezoneObservance extends BasedComponent<ICSTimezoneObservance> {
    readonly componentType = 'STANDARD/DAYLIGHT'

    protected readonly propertyMap = {
        TZOFFSETFROM: P.string('tzOffsetFrom'),
        TZOFFSETTO: P.string('tzOffsetTo'),
        TZNAME: P.string('tzName'),
        DTSTART: P.string('dtStart'),
        RRULE: P.string('rrule'), // stored raw
    }
}