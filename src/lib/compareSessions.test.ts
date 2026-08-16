import { describe, expect, it } from 'vitest'
import { computeToolMatches, toolInputEqual } from './compareSessions'
import type { Entry } from '../types'

function tool(id: string, toolName: string, input: unknown, index = 0): Entry {
  return {
    id,
    type: 'tool',
    tool: toolName,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    output: '',
    turnIndex: 0,
    entryIndex: index,
  }
}

describe('toolInputEqual', () => {
  it('returns true for identical JSON objects with different key order', () => {
    expect(toolInputEqual('{"a":1,"b":2}', '{"b":2,"a":1}')).toBe(true)
  })

  it('returns false for different values', () => {
    expect(toolInputEqual('{"a":1}', '{"a":2}')).toBe(false)
  })

  it('falls back to string equality when both inputs are invalid JSON', () => {
    expect(toolInputEqual('not json', 'not json')).toBe(true)
  })

  it('returns false when only one input is invalid JSON', () => {
    expect(toolInputEqual('{"a":1}', 'not json')).toBe(false)
  })
})

describe('computeToolMatches', () => {
  it('matches identical sequences one-to-one', () => {
    const left: Entry[] = [tool('l1', 'read', { path: 'a' }), tool('l2', 'write', { path: 'b' })]
    const right: Entry[] = [tool('r1', 'read', { path: 'a' }), tool('r2', 'write', { path: 'b' })]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(left, right)

    expect(matches).toHaveLength(2)
    expect(leftUnmatched.size).toBe(0)
    expect(rightUnmatched.size).toBe(0)
  })

  it('matches reordered tool calls', () => {
    const left: Entry[] = [tool('l1', 'read', { path: 'a' }), tool('l2', 'write', { path: 'b' })]
    const right: Entry[] = [tool('r1', 'write', { path: 'b' }), tool('r2', 'read', { path: 'a' })]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(left, right)

    expect(matches).toHaveLength(2)
    expect(leftUnmatched.size).toBe(0)
    expect(rightUnmatched.size).toBe(0)
  })

  it('marks extra tool calls on one side as unmatched', () => {
    const left: Entry[] = [tool('l1', 'read', { path: 'a' })]
    const right: Entry[] = [
      tool('r1', 'read', { path: 'a' }),
      tool('r2', 'write', { path: 'b' }),
    ]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(left, right)

    expect(matches).toHaveLength(1)
    expect(leftUnmatched.size).toBe(0)
    expect(rightUnmatched).toContain('r2')
  })

  it('matches duplicate tool calls one-to-one and leaves extras unmatched', () => {
    const left: Entry[] = [
      tool('l1', 'read', { path: 'a' }),
      tool('l2', 'read', { path: 'a' }),
      tool('l3', 'read', { path: 'a' }),
    ]
    const right: Entry[] = [
      tool('r1', 'read', { path: 'a' }),
      tool('r2', 'read', { path: 'a' }),
    ]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(left, right)

    expect(matches).toHaveLength(2)
    expect(leftUnmatched.size).toBe(1)
    expect(rightUnmatched.size).toBe(0)
  })

  it('does not match when tool names differ', () => {
    const left: Entry[] = [tool('l1', 'read', { path: 'a' })]
    const right: Entry[] = [tool('r1', 'write', { path: 'a' })]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(left, right)

    expect(matches).toHaveLength(0)
    expect(leftUnmatched).toContain('l1')
    expect(rightUnmatched).toContain('r1')
  })

  it('excludes ignored IDs from matching', () => {
    const left: Entry[] = [tool('l1', 'read', { path: 'a' })]
    const right: Entry[] = [tool('r1', 'read', { path: 'a' })]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(
      left,
      right,
      new Set(['l1']),
    )

    expect(matches).toHaveLength(0)
    expect(leftUnmatched.size).toBe(0)
    expect(rightUnmatched).toContain('r1')
  })

  it('ignores non-tool entries', () => {
    const left: Entry[] = [
      { id: 'u1', type: 'user', text: 'hello', turnIndex: 0, entryIndex: 0 },
      tool('l1', 'read', { path: 'a' }),
    ]
    const right: Entry[] = [tool('r1', 'read', { path: 'a' })]

    const { matches, leftUnmatched, rightUnmatched } = computeToolMatches(left, right)

    expect(matches).toHaveLength(1)
    expect(leftUnmatched.size).toBe(0)
    expect(rightUnmatched.size).toBe(0)
  })
})
