import {parseDuration} from "../../parser/assembler";
import {serializeDuration} from "../../serializer/util";
import {ICSAlarm} from "../../types";
import {PropertyHandlers as P } from "../property";

import {BasedComponent} from "./base";

export class Alarm extends BasedComponent<ICSAlarm> {
    readonly componentType = 'VALARM'

    protected readonly propertyMap = {
        ACTION: P.string('action'),
        TRIGGER: P.custom<ICSAlarm>({
            parse: (data, value, params) => {
                data.trigger = value.startsWith('P') || value.startsWith('-P') ? parseDuration(value) : value
                if (params.RELATED) data.triggerRelation = params.RELATED as ICSAlarm['triggerRelation']
            },
            toICS: (data) => {
                if (!data.trigger) return null

                const params: Record<string, string> = {}
                if (data.triggerRelation && data.triggerRelation !== 'START') {
                    params.RELATED = data.triggerRelation
                }

                const value = typeof data.trigger === 'string'
                    ? data.trigger
                    : serializeDuration(data.trigger)

                return [{ value, params: Object.keys(params).length > 0 ? params : undefined }]
            }
        }),
        DESCRIPTION: P.string('description'),
        SUMMARY: P.string('summary'),
        REPEAT: P.int('repeat'),
        DURATION: P.duration('duration'),
        ATTACH: P.string('attach'),
    }
}