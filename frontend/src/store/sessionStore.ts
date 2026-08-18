import { create } from 'zustand'
import type { Entry, Session } from '../types'
import { createSession as apiCreateSession, deleteSession as apiDeleteSession, fetchSessions } from '../lib/api'

interface SessionState {
  sessions: Session[]
  selectedEntryId: string | null
  selectedSessionId: string | null
  loading: boolean
  error: string | null
  loadSessions: () => Promise<void>
  addSession: (source: string) => Promise<void>
  removeSession: (id: string) => Promise<void>
  selectEntry: (id: string | null) => void
  selectSession: (id: string | null) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  selectedEntryId: null,
  selectedSessionId: null,
  loading: false,
  error: null,

  async loadSessions() {
    set({ loading: true, error: null })
    try {
      const sessions = await fetchSessions()
      set({ sessions, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load sessions', loading: false })
    }
  },

  async addSession(source) {
    const session = await apiCreateSession(source)
    set((state) => ({
      sessions: [...state.sessions, session],
      selectedSessionId: session.id,
      selectedEntryId: null,
    }))
  },

  async removeSession(id) {
    await apiDeleteSession(id)
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
