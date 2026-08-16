import type { Entry, Session, TextEntry, ThinkingEntry, ToolEntry, UserEntry } from '../types'

function splitBySections(lines: string[]): string[][] {
  const sections: string[][] = []
  let current: string[] = []
  let inFence = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inFence = !inFence
    }
    if (!inFence && trimmed === '---') {
      if (current.length > 0) {
        sections.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }

  if (current.length > 0) {
    sections.push(current)
  }

  return sections
}

function parseHeader(lines: string[]) {
  let title = 'Untitled session'
  let sessionId: string | undefined
  let created: string | undefined
  let updated: string | undefined

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim()
      continue
    }
    const sessionMatch = trimmed.match(/^\*\*Session ID:\*\*\s*(.+)$/)
    if (sessionMatch) {
      sessionId = sessionMatch[1].trim()
      continue
    }
    const createdMatch = trimmed.match(/^\*\*Created:\*\*\s*(.+)$/)
    if (createdMatch) {
      created = createdMatch[1].trim()
      continue
    }
    const updatedMatch = trimmed.match(/^\*\*Updated:\*\*\s*(.+)$/)
    if (updatedMatch) {
      updated = updatedMatch[1].trim()
    }
  }

  return { title, sessionId, created, updated }
}

function isAssistantMarker(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed === '_Thinking:_') return true
  if (/^\*\*Tool:\s*(.+?)\*\*$/.test(trimmed)) return true
  if (/^##\s+/.test(trimmed)) return true
  return false
}

function readCodeBlock(lines: string[], startIndex: number): { block: string[]; nextIndex: number } {
  const block: string[] = []
  let i = startIndex
  const opener = lines[i]?.trim() ?? ''
  if (!opener.startsWith('```')) {
    return { block, nextIndex: i }
  }
  i++
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '```') {
      i++
      break
    }
    block.push(line)
    i++
  }
  return { block, nextIndex: i }
}

function parseAssistantBody(bodyLines: string[]): Entry[] {
  const entries: Entry[] = []
  const textBuffer: string[] = []
  let i = 0

  const flushText = () => {
    const text = textBuffer.join('\n').trim()
    textBuffer.length = 0
    if (text) {
      entries.push({ type: 'text', text } as TextEntry)
    }
  }

  while (i < bodyLines.length) {
    const line = bodyLines[i]
    const trimmed = line.trim()

    if (trimmed === '_Thinking:_') {
      flushText()
      i++
      const thinkingLines: string[] = []
      while (i < bodyLines.length && !isAssistantMarker(bodyLines[i])) {
        thinkingLines.push(bodyLines[i])
        i++
      }
      const text = thinkingLines.join('\n').trim()
      if (text) {
        entries.push({ type: 'thinking', text } as ThinkingEntry)
      }
      continue
    }

    const toolMatch = trimmed.match(/^\*\*Tool:\s*(.+?)\*\*$/)
    if (toolMatch) {
      flushText()
      const toolName = toolMatch[1].trim()
      i++

      while (i < bodyLines.length && bodyLines[i].trim() !== '**Input:**') {
        i++
      }
      if (i < bodyLines.length) i++
      const inputResult = i < bodyLines.length ? readCodeBlock(bodyLines, i) : { block: [], nextIndex: i }
      i = inputResult.nextIndex
      const input = inputResult.block.join('\n').trim()

      while (i < bodyLines.length && bodyLines[i].trim() !== '**Output:**') {
        i++
      }
      if (i < bodyLines.length) i++
      const outputResult = i < bodyLines.length ? readCodeBlock(bodyLines, i) : { block: [], nextIndex: i }
      i = outputResult.nextIndex
      const output = outputResult.block.join('\n').trim()

      entries.push({ type: 'tool', tool: toolName, input, output } as ToolEntry)
      continue
    }

    textBuffer.push(line)
    i++
  }

  flushText()
  return entries
}

function parseSection(sectionLines: string[]): Entry[] {
  let i = 0
  while (i < sectionLines.length && sectionLines[i].trim() === '') {
    i++
  }
  if (i >= sectionLines.length) return []
  const bodyLines = sectionLines.slice(i)
  const firstLine = bodyLines[0].trim()

  if (firstLine.startsWith('## User')) {
    const body = bodyLines
      .slice(1)
      .join('\n')
      .trim()
    if (body) {
      return [{ type: 'user', text: body } as UserEntry]
    }
    return []
  }

  const assistantMatch = firstLine.match(/^## Assistant \((.+?)\)\s*$/)
  if (assistantMatch) {
    const assistantBody = bodyLines.slice(1)
    while (assistantBody.length > 0 && assistantBody[0].trim() === '') {
      assistantBody.shift()
    }
    return parseAssistantBody(assistantBody)
  }

  return []
}

export function parseSessionMarkdown(source: string, id: string): Session {
  const lines = source.split('\n')
  const sections = splitBySections(lines)

  const header = sections[0] ?? []
  const { title, sessionId, created, updated } = parseHeader(header)

  const entries: Entry[] = []
  let turnIndex = 0
  let entryIndex = 0

  for (let s = 1; s < sections.length; s++) {
    const sectionEntries = parseSection(sections[s])
    for (const entry of sectionEntries) {
      entry.turnIndex = turnIndex
      entry.entryIndex = entryIndex
      entry.id = `${id}-t${turnIndex}-e${entryIndex}`
      entries.push(entry)
      entryIndex++
    }
    turnIndex++
  }

  return {
    id,
    title,
    sessionId,
    created,
    updated,
    source,
    entries,
  }
}
