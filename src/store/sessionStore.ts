import { create } from 'zustand'
import type { Entry, Session } from '../types'

interface SessionState {
  sessions: Session[]
  selectedEntryId: string | null
  selectedSessionId: string | null
  addSession: (session: Session) => void
  removeSession: (id: string) => void
  selectEntry: (id: string | null) => void
  selectSession: (id: string | null) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  selectedEntryId: null,
  selectedSessionId: null,

  addSession(session) {
    set((state) => ({
      sessions: [...state.sessions, session],
      selectedSessionId: session.id,
      selectedEntryId: null,
    }))
  },

  removeSession(id) {
    const nextSessions = get().sessions.filter((s) => s.id !== id)
    const nextSelected = nextSessions[0]?.id ?? null
    set({
      sessions: nextSessions,
      selectedSessionId: nextSelected,
      selectedEntryId: null,
    })
  },

  selectEntry(id) {
    set({ selectedEntryId: id })
  },

  selectSession(id) {
    set({ selectedSessionId: id, selectedEntryId: null })
  },
}))

export function useSelectedSession(): Session | undefined {
  const sessions = useSessionStore((s) => s.sessions)
  const selectedId = useSessionStore((s) => s.selectedSessionId)
  return sessions.find((s) => s.id === selectedId)
}

export function useSelectedEntry(): Entry | undefined {
  const selectedEntryId = useSessionStore((s) => s.selectedEntryId)
  const session = useSelectedSession()
  return session?.entries.find((e) => e.id === selectedEntryId)
}
