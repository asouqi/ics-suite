import {AssemblyIssue} from "../../parser/assembler/types";
import {formatProperty} from "../../serializer/util"
import {IComponentPropertyAssigner, IPropertyHandler} from "../types";

export abstract class BasedComponent<T> implements IComponentPropertyAssigner {
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
            handler.parse(data, value, params)
        } else {
            this.handleUnknown(name, warnings)
        }
    }

    serializeProperties(data: T): string[] {
        const lines: string[] = []

        for (const [propName, handler] of Object.entries(this.propertyMap)) {
            if (!handler.toICS) continue

            const result = handler.toICS(data)
            if (!result) continue

            for (const { value, params } of result) {
                lines.push(formatProperty(propName, value, params))
            }
        }

        return lines
    }

    protected handleUnknown(name: string, warnings: AssemblyIssue[]): void {
        // Don't warn about X- properties or special cases
        if (name.startsWith('X-') || name === 'TZID') {
            return
        }

        warnings.push({
            message: `Unknown ${this.componentType} property: ${name}`,
            property: name,
        })
    }
}