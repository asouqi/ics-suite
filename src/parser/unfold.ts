/**
 * Unfolds a raw .ics string into an array of logical lines.
 *
 * - Normalizes CRLF and LF line endings
 * - Joins continuation lines (lines starting with a space or tab)
 * - Strips the leading whitespace character from continuations
 * - Skips empty and whitespace-only lines
 *
 * @param input - The raw .ics file content as a string
 * @returns An array of unfolded logical lines, empty lines excluded
 */
export function unfold(input: string): string[] {
    if (input.length === 0) return []

    // normalize all line endings to LF so we only deal with one case
    const normalized = input.replace(/\r\n/g, '\n')

    const physicalLines = normalized.split('\n')
    const logicalLines: string[] = []

    for (const line of physicalLines) {
        // skip empty lines
        if (line.trim().length === 0) continue

        const isContinuation = line[0] === ' ' || line[0] === '\t'

        if (isContinuation) {
            if (logicalLines.length === 0) {
                // a continuation at the very start of input is malformed and treat it as a new line wit the leading whitespace stripped
                logicalLines.push(line.slice(1))
            } else {
                // append to the previous logical line, stripping the leading whitespace
                logicalLines[logicalLines.length - 1] += line.slice(1)
            }
        } else {
            logicalLines.push(line)
        }
    }

    return logicalLines
}