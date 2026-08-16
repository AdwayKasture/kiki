export interface Session {
  id: string
  title: string
  sessionId?: string
  created?: string
  updated?: string
  source: string
  entries: Entry[]
}

export interface BaseEntry {
  id: string
  turnIndex: number
  entryIndex: number
}

export interface UserEntry extends BaseEntry {
  type: 'user'
  text: string
}

export interface ThinkingEntry extends BaseEntry {
  type: 'thinking'
  text: string
}

export interface ToolEntry extends BaseEntry {
  type: 'tool'
  tool: string
  input: string
  output: string
}

export interface TextEntry extends BaseEntry {
  type: 'text'
  text: string
}

export type Entry = UserEntry | ThinkingEntry | ToolEntry | TextEntry
