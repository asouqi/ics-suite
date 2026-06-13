import {parseDateOrDateTime, parseDuration} from "../parser/assembler"
import {escapeText, serializeDateTime, serializeDuration} from "../serializer/util"
import {ICSDateOrDateTime, ICSDuration} from "../types"

import {IPropertyHandler} from "./types";

export class PropertyHandlers {
  static string(key: string): IPropertyHandler<Record<string, string>> {
    return {
      parse: (data, value, _) => {
        data[key] = value
      },
      toICS: (data) => {
        const val = data[key]
        return val !== undefined ? [{ value: escapeText(val) }] : null
      },
    }
  }

  static int(key: string): IPropertyHandler<Record<string, number>> {
    return {
      parse: (data, value) => {
        data[key] = parseInt(value, 10)
      },
      toICS: (data) => {
        const val = data[key]
        return val !== undefined ? [{ value: String(val) }] : null
      },
    }
  }

  static dateTime(key: string): IPropertyHandler<Record<string, ICSDateOrDateTime>> {
    return {
      parse: (data, value, params) => {
        data[key] = parseDateOrDateTime(value, params)
      },
      toICS: (data) => {
        const val = data[key]
        if (!val) return null

        const isDateTime = 'hour' in val
        const dateStr = serializeDateTime(val)
        const params: Record<string, string> = {}

        if (!isDateTime) {
          params.VALUE = 'DATE'
        } else if (val.tzid) {
          params.TZID = val.tzid
        }

        return [{ value: dateStr, params: Object.keys(params).length > 0 ? params : undefined }]
      },
    }
  }

  static duration(key: string): IPropertyHandler<Record<string, ICSDuration>> {
    return {
      parse: (data, value) => {
        data[key] = parseDuration(value)
      },
      toICS: (data) => {
        const val = data[key]
        return val ? [{ value: serializeDuration(val) }] : null
      },
    }
  }

  static addDateTime(key: string): IPropertyHandler<Record<string, ICSDateOrDateTime[]>> {
    return {
      parse: (data, value, params) => {
        data[key] = data[key] ?? []
        data[key].push(parseDateOrDateTime(value, params))
      },
      toICS: (data) => {
        const values = data[key]
        if (!values || values.length === 0) return null

        return values.map(val => {
          const isDateTime = 'hour' in val
          const dateStr = serializeDateTime(val)
          const params: Record<string, string> = {}

          if (!isDateTime) {
            params.VALUE = 'DATE'
          } else if (val.tzid) {
            params.TZID = val.tzid
          }

          return { value: dateStr, params: Object.keys(params).length > 0 ? params : undefined }
        })
      },
    }
  }

  static addValue(key: string): IPropertyHandler<Record<string, string[]>> {
    return {
      parse: (data, value) => {
        data[key] = data[key] ?? []
        data[key].push(value)
      },
      toICS: (data) => {
        const values = data[key]
        if (!values || values.length === 0) return null
        return values.map((val) => ({value: escapeText(val)}))
      }
    }
  }

  static custom<T>(handler: IPropertyHandler<T>): IPropertyHandler<T> {
    return {
      parse: handler.parse,
      toICS: handler.toICS,
    }
  }
}