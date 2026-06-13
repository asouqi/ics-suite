import {AssemblyIssue} from "../parser/assembler/types"

/** Registry of property assigners by component type */
export interface IPropertyAssignerRegistry {
    register(componentType: string, assigner: IComponentPropertyAssigner): void
    getAssigner(componentType: string): IComponentPropertyAssigner | undefined
}

/** Manages property assignment for a specific component type. */
export interface IComponentPropertyAssigner {
    readonly componentType: string

    assignProperty(
        data: unknown,
        name: string,
        value: string,
        params: Record<string, string>,
        warnings: AssemblyIssue[]
    ): void

    serializeProperties(data: unknown): string[]
}

/** Handles parsing/serializing and assignment of a single property value. */
export interface IPropertyHandler<T> {
    parse(
        data: T,
        value: string,
        params: Record<string, string>
    ): void
    toICS(
        data: T
    ): { value: string; params?: Record<string, string> }[] | null
}