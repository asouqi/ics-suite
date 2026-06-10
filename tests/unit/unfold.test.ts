import {describe, expect, it} from "vitest";
import {unfold} from "../../src/parser"

describe('unfold', () => {
    it('returns a single line unchanged', () => {
        const input = 'SUMMARY:Team standup'
        expect(unfold(input)).toEqual(['SUMMARY:Team standup'])
    })

    it('returns multiple normal line unchanged', () => {
        const input = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR'
        expect(unfold(input)).toEqual([
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'END:VCALENDAR',
        ])
    })

    it('join a line folded with a space continuation', ()=> {
        const input = 'DESCRIPTION:This is a long\n  description that was folded'
        expect(unfold(input)).toEqual(['DESCRIPTION:This is a long description that was folded'])
    })

    it('join multiple space continuations into one logical line', ()=> {
        const input = 'DESCRIPTION:This is\n  a very\n  long line'
        expect(unfold(input)).toEqual(['DESCRIPTION:This is a very long line'])
    })

    it('join a line folded with a tab continuation', ()=> {
        const input = 'DESCRIPTION:This is a long\n\t description that was folded'
        expect(unfold(input)).toEqual([
            'DESCRIPTION:This is a long description that was folded'
        ])
    })

    it('handles mixed space and tab continuations on the same line', ()=> {
        const input = 'DESCRIPTION:This is\n  a very\n\t long line'
        expect(unfold(input)).toEqual(['DESCRIPTION:This is a very long line'])
    })

    it('unfolds multiple independently folded lines', () => {
        const input = [
            'SUMMARY:Short title',
            'DESCRIPTION:This is a long\n  description value',
            'LOCATION:This is a long\n  location value',
        ].join('\n')

        expect(unfold(input)).toEqual([
            'SUMMARY:Short title',
            'DESCRIPTION:This is a long description value',
            'LOCATION:This is a long location value',
        ])
    })

    it('handles Windows CRLF line endings', () => {
        const input = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR'
        expect(unfold(input)).toEqual([
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'END:VCALENDAR',
        ])
    })

    it('unfolds folded lines with CRLF endings', () => {
        const input = 'DESCRIPTION:This is a long\r\n  description that was folded'
        expect(unfold(input)).toEqual([
            'DESCRIPTION:This is a long description that was folded'
        ])
    })

    it('skips lines that are only whitespace', () => {
        const input = 'BEGIN:VCALENDAR\n   \nVERSION:2.0'
        expect(unfold(input)).toEqual([
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
        ])
    })

    it('handles a continuation line with no content after the whitespace', () => {
        const input = 'DESCRIPTION:Something\n '
        expect(unfold(input)).toEqual(['DESCRIPTION:Something'])
    })

    it('does not treat a line starting with a space as a continuation of nothing', () => {
        const input = ' orphaned continuation'
        expect(unfold(input)).toEqual(['orphaned continuation'])
    })
})