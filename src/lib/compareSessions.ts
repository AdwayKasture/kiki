import type { Entry, ToolEntry } from '../types'

export interface MatchedPair {
  leftId: string
  rightId: string
  leftIndex: number
  rightIndex: number
}

export interface ToolMatchResult {
  matches: MatchedPair[]
  leftUnmatched: Set<string>
  rightUnmatched: Set<string>
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

function toolsEqual(a: ToolEntry, b: ToolEntry): boolean {
  return a.tool === b.tool && toolInputEqual(a.input, b.input)
}

export function computeToolMatches(
  leftEntries: Entry[],
  rightEntries: Entry[],
  ignoredIds: Set<string> = new Set(),
): ToolMatchResult {
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
  const matchedRightIndices = new Set<number>()

  for (const left of leftTools) {
    const rightIndex = rightTools.findIndex(
      (right, index) => !matchedRightIndices.has(index) && toolsEqual(left.e, right.e),
    )
    if (rightIndex === -1) continue

    matchedRightIndices.add(rightIndex)
    matches.push({
      leftId: left.e.id,
      rightId: rightTools[rightIndex].e.id,
      leftIndex: left.i,
      rightIndex: rightTools[rightIndex].i,
    })
  }

  const leftUnmatched = new Set<string>(
    leftTools
      .filter((left) => !matches.some((m) => m.leftId === left.e.id))
      .map((left) => left.e.id),
  )
  const rightUnmatched = new Set<string>(
    rightTools
      .filter((_, index) => !matchedRightIndices.has(index))
      .map((right) => right.e.id),
  )

  return { matches, leftUnmatched, rightUnmatched }
}
