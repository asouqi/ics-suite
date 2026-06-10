/**
 * ## Tokenizer
 *
 * Converts an array of unfolded logical lines into a flat array of tokens.
 * Each line produces exactly one token — a BEGIN, END, or PROPERTY token.
 *
 * It only identifies the shape of each line and extracts the name, parameters,
 * and raw value as strings. Interpretation of values happens in the
 * assembler step.
 *
 * @rfc RFC 5545, Section 3.1
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.1
 */

import type { BeginToken, EndToken, PropertyToken, Token } from "./types"

/**
 * Tokenizes an array of unfolded logical lines into a flat token array
 */
export function tokenize(lines: string[]): Token[] {
    return lines.map(tokenizeLine)
}

/**
 * Tokenize a single unfolded logical line into one token.
 */
export function tokenizeLine(line: string): Token {
    if (line.startsWith('BEGIN:')) {
        return { type: "BEGIN", component: line.slice(6) } satisfies BeginToken
    }

    if (line.startsWith('END:')) {
        return { type: "END", component: line.slice(4) } satisfies EndToken
    }

    return propertyLine(line)
}

/**
 * parses a property line into a PropertyToken by scanning character by character.
 * This approach correctly handles colons semicolons that appear inside quoted parameter values.
 *
 * The scan has three phases:
 * 1. Read the property name - stops at `;` or `:`
 * 2. Read parameters stops at `:`(outside of quotes)
 * 3. Read the value everything after the first unquoted :
 */
function propertyLine(line: string): PropertyToken {
    let i = 0
    const len = line.length

    /** Phase 1: read property name */
    const nameStart = i
    while (i < len && line[i] !== ';' && line[i] !== ':') {
        i++
    }
    const name = line.slice(nameStart, i)

    /** Phase 2: read parameters */
    const params: Record<string, string> = {}
    while (i < len && line[i] === ';') {
        i++ // skip

        const paramNameStart = i
        while (i < len && line[i] !== '=' && line[i] !== ';' && line[i] !== ':') {
            i++
        }
        const paramName = line.slice(paramNameStart, i)

        let paramValue = ''
        if (i < len && line[i] === '=') {
            i++ // skip `=`
            // parameter may be quoted so we need to track whether we are inside quotes
            // Quoted value can contain `;` `:` which must not be treated as delimiters
            const isQuoted = line[i] === '"'
            if (isQuoted) i++ // skip opening quote

            const valueStart = i
            while (i < len) {
                if (isQuoted && line[i] === '"') {
                    paramValue = line.slice(valueStart, i)
                    i++ // skip closing quote
                    break
                }
                // Outside of quote, semicolon and colon end this parameter value
                if (!isQuoted && (line[i] === ';' || line[i] === ':')) {
                    paramValue = line.slice(valueStart, i)
                    break
                }
                i++
            }
        }

        if (paramName.length > 0) {
            params[paramName] = paramValue
        }
    }

    /** Phases 3: read value */
    let value = ''
    if(i < len && line[i] === ':') {
        i++ // skip
        value += line.slice(i)
    }

    return { type: 'PROPERTY', name, params, value } satisfies PropertyToken
}