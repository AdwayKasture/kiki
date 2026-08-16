import type { Entry, ToolEntry } from '../types'

export interface MatchedPair {
  leftId: string
  rightId: string
  leftIndex: number
  rightIndex: number
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, i) => deepEqual(val, b[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj).sort()
    const bKeys = Object.keys(bObj).sort()
    if (aKeys.length !== bKeys.length) return false
    if (!aKeys.every((k, i) => k === bKeys[i])) return false
    return aKeys.every((k) => deepEqual(aObj[k], bObj[k]))
  }

  return false
}

export function toolInputEqual(a: string, b: string): boolean {
  let aObj: unknown
  let bObj: unknown
  try {
    aObj = JSON.parse(a)
  } catch {
    return a === b
  }
  try {
    bObj = JSON.parse(b)
  } catch {
    return false
  }
  return deepEqual(aObj, bObj)
}

export function computeToolMatches(
  leftEntries: Entry[],
  rightEntries: Entry[],
  ignoredIds: Set<string> = new Set(),
): MatchedPair[] {
  const leftTools = leftEntries
    .map((e, i) => ({ e, i }))
    .filter(
      (item): item is { e: ToolEntry; i: number } =>
        item.e.type === 'tool' && !ignoredIds.has(item.e.id),
    )
  const rightTools = rightEntries
    .map((e, i) => ({ e, i }))
    .filter(
      (item): item is { e: ToolEntry; i: number } =>
        item.e.type === 'tool' && !ignoredIds.has(item.e.id),
    )

  const matches: MatchedPair[] = []
  const count = Math.min(leftTools.length, rightTools.length)

  for (let i = 0; i < count; i++) {
    const left = leftTools[i]
    const right = rightTools[i]
    if (toolInputEqual(left.e.input, right.e.input)) {
      matches.push({
        leftId: left.e.id,
        rightId: right.e.id,
        leftIndex: left.i,
        rightIndex: right.i,
      })
    }
  }

  return matches
}
