import { assemble } from '../../../src/parser/assembler/assemble'
import { tokenize, unfold } from '../../../src/parser'
import { describe, expect, it } from 'vitest'

function parse(ics: string) {
  return assemble(tokenize(unfold(ics)))
}

describe('assemble - VCALENDAR', () => {
  it('assembles a minimal calendar', () => {
    const { calendar, errors } = parse('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Example//EN\r\nEND:VCALENDAR')
    expect(errors.length).toBe(0)
    expect(calendar.version).toBe('2.0')
    expect(calendar.prodId).toBe('-//Example//EN')
    expect(calendar.events).toEqual([])
  })

  it('captures X-WR-CALNAME as calendar name', () => {
    const { calendar } = parse('BEGIN:VCALENDAR\r\nX-WR-CALNAME:My Calendar\r\nEND:VCALENDAR')
    expect(calendar.name).toBe('My Calendar')
  })
})