import { describe, expect, it} from "vitest";

import {tokenizeLine} from "../../src/parser/tokenizer/tokenize"


describe('tokenize', () => {
    it('produces a BeginToken for a BEGIN line', () => {
        expect(tokenizeLine('BEGIN:VCALENDAR')).toEqual({
            type: 'BEGIN',
            component: 'VCALENDAR',
        })
    })

    it('produces a EndToken for a END line', () => {
        expect(tokenizeLine('END:VEVENT')).toEqual({
            type: 'END',
            component: 'VEVENT',
        })
    })

    it('produces a PropertyToken for a simple property', () => {
        expect(tokenizeLine('SUMMARY:Team standup')).toEqual({
            type: 'PROPERTY',
            name: 'SUMMARY',
            params: {},
            value: 'Team standup',
        })
    })

    it('produces a PropertyToken with empty string value when property has no value', () => {
        expect(tokenizeLine('CATEGORIES:')).toEqual({
            type: 'PROPERTY',
            name: 'CATEGORIES',
            params: {},
            value: '',
        })
    })

    it('preserves colons in the property value', () => {
        expect(tokenizeLine('URL:https://example.com/event')).toEqual({
            type: 'PROPERTY',
            name: 'URL',
            params: {},
            value: 'https://example.com/event',
        })
    })

    it('preserves multiple colons in the property value', () => {
        expect(tokenizeLine('ATTENDEE:mailto:alice@example.com')).toEqual({
            type: 'PROPERTY',
            name: 'ATTENDEE',
            params: {},
            value: 'mailto:alice@example.com',
        })
    })

    it('parse a property with one parameter', () => {
        expect(tokenizeLine('DTSTART;TZID=Americ/New_York:20240101T090000')).toEqual({
            type: 'PROPERTY',
            name: 'DTSTART',
            params: { TZID: 'Americ/New_York' },
            value: '20240101T090000',
        })
    })

    it('parse a property with multiple parameters', () => {
        expect(tokenizeLine('ATTENDEE;CN=Alice;ROLE=CHAIR:mailto:alice@example.com')).toEqual({
            type: 'PROPERTY',
            name: 'ATTENDEE',
            params: { CN: 'Alice', ROLE: 'CHAIR' },
            value: 'mailto:alice@example.com',
        })
    })

    it('handles a quoted parameter value containing a colon', () => {
        expect(tokenizeLine('ATTENDEE;CN="Smith John":mailto:alice@example.com')).toEqual({
            type: 'PROPERTY',
            name: 'ATTENDEE',
            params: { CN: 'Smith John' },
            value: 'mailto:alice@example.com',
        })
    })

    it('handles a quoted parameter value containing a semicolon', () => {
        expect(tokenizeLine('ATTENDEE;CN="Smith; John":mailto:alice@example.com')).toEqual({
            type: 'PROPERTY',
            name: 'ATTENDEE',
            params: { CN: 'Smith; John' },
            value: 'mailto:alice@example.com',
        })
    })

    it('strips quotes from quoted parameter values', () => {
        expect(tokenizeLine('ATTENDEE;CN="Alice Doe":mailto:alice@example.com')).toEqual({
            type: 'PROPERTY',
            name: 'ATTENDEE',
            params: { CN: 'Alice Doe' },
            value: 'mailto:alice@example.com',
        })
    })

    it('handle multiple parameters where one is quoted', () => {
        expect(tokenizeLine('ATTENDEE;CN="Alice: Doe";ROLE=REQ-PARTICIPANT:mailto:alice@example.com')).toEqual({
            type: 'PROPERTY',
            name: 'ATTENDEE',
            params: { CN: 'Alice: Doe', ROLE: 'REQ-PARTICIPANT' },
            value: 'mailto:alice@example.com',
        })
    })

    it('tokenizes an X- prefixed property like any other property', () => {
        expect(tokenizeLine('X-GOOGLE-CONFERENCE:https://meet.google.com/abs-def')).toEqual({
            type: 'PROPERTY',
            name: 'X-GOOGLE-CONFERENCE',
            params: {},
            value: 'https://meet.google.com/abs-def'
        })
    })

    it('tokenizes an X- property with parameters', () => {
        expect(tokenizeLine('X-APPLE-TRAVEL-DURATION;VALUE=DURATION:PT30M')).toEqual({
            type: 'PROPERTY',
            name: 'X-APPLE-TRAVEL-DURATION',
            params: { VALUE: 'DURATION' },
            value: 'PT30M'
        })
    })
})