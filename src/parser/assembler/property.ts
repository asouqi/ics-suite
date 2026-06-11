import { IPropertyHandler } from './types'
import { parseDateOrDateTime, parseDuration } from './util'
import { ICSDateOrDateTime, ICSDuration } from '../../types'


export class PropertyHandlers {
  static string(key: string): IPropertyHandler<Record<string, string>> {
    return {
      handle: (data, value, _) => {
        data[key] = value
      },
    }
  }

  static dateTime(key: string): IPropertyHandler<Record<string, ICSDateOrDateTime>> {
    return {
      handle: (data, value, params) => {
        data[key] = parseDateOrDateTime(value, params)
      },
    }
  }

  static int(key: string): IPropertyHandler<Record<string, number>> {
    return {
      handle: (data, value, _) => {
        data[key] = parseInt(value, 10)
      },
    }
  }

  static duration(key: string): IPropertyHandler<Record<string, ICSDuration>> {
    return {
      handle: (data, value, _) => {
        data[key] = parseDuration(value)
      },
    }
  }

  static addDateTime(key: string): IPropertyHandler<Record<string, ICSDateOrDateTime[]>> {
    return {
      handle: (data, value, params) => {
        data[key] = data[key] ?? []
        data[key].push(parseDateOrDateTime(value, params))
      },
    }
  }

  static addValue(key: string): IPropertyHandler<Record<string, string[]>> {
    return {
      handle: (data, value, params) => {
        data[key] = data[key] ?? []
        data[key].push(value)
      },
    }
  }

  static custom<T>(fn: IPropertyHandler<T>['handle']): IPropertyHandler<T> {
    return {
      handle: fn,
    }
  }
}