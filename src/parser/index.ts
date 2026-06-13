import {ICSCalendar} from "../types";

import {assemble} from "./assembler/assemble";
import {tokenize} from "./tokenizer/tokenize";
import type { ParseIssue, ParseOptions, ParseResult } from './types.ts'
import {unfold} from "./unfold"


export type { ParseIssue, ParseOptions, ParseResult }

/**
 * Thrown by `parseStrict` when the input contains errors.
 * Extends the built-in Error with the full list of issues for programmatic
 * inspection.
 */
export class ParseError extends Error {
    readonly issues: ParseIssue[]

    constructor(issues: ParseIssue[]) {
        super(issues[0]?.message ?? 'Failed to parse iCalendar input')
        this.name = 'ParseError'
        this.issues = issues
    }
}


/**
 * Parses a raw .ics string into a typed ICSCalendar.
 *
 * Always returns a result — errors encountered during parsing are collected
 * into the `errors` array rather than thrown. The calendar object is always
 * present even when errors exist, though its contents may be incomplete.
 *
 * Consumers should check `errors.length` before trusting the calendar.
 *
 * @param input   - The raw .ics file content as a string
 * @param options - Parsing options
 * @returns A ParseResult containing the calendar and any issues
 *
 * @example
 * const { calendar, errors, warnings } = parse(icsString)
 * if (errors.length > 0) {
 *   console.warn('Calendar has issues:', errors)
 * }
 */
export function parse(input: string, options: ParseOptions = {}): ParseResult {
    const lines = unfold(input)
    const tokens = tokenize(lines)
    const result = assemble(tokens)

    if (options.strict && result.errors.length > 0) {
        throw new ParseError(result.errors)
    }

    return result
}

/**
 * Parses a raw .ics string and throws if any errors are encountered.
 *
 * Use this when you are confident the input is well-formed — for example
 * when parsing files your own application generated — and you want errors
 * to surface immediately rather than be silently collected.
 *
 * @param input   - The raw .ics file content as a string
 * @param options - Parsing options (strict is always true)
 * @returns The parsed ICSCalendar
 * @throws ParseError if the input contains any errors
 *
 * @example
 * try {
 *   const calendar = parseStrict(icsString)
 * } catch (e) {
 *   if (e instanceof ParseError) {
 *     console.error(e.issues)
 *   }
 * }
 */
export function parseStrict(
    input: string,
    options: Omit<ParseOptions, 'strict'> = {},
): ICSCalendar {
    const { calendar, errors } = parse(input, { ...options, strict: false })

    if (errors.length > 0) {
        throw new ParseError(errors)
    }

    return calendar
}
