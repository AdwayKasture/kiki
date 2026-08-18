import { create } from 'zustand'
import type { Entry, Session } from '../types'

interface ComparatorState {
  leftSession: Session | null
  rightSession: Session | null
  ignoredIds: Set<string>

  setSession: (side: 'left' | 'right', session: Session | null) => void
  clearSession: (side: 'left' | 'right') => void
  setIgnored: (id: string, ignored: boolean) => void
  swapSides: () => void
  reset: () => void
}

export const useComparatorStore = create<ComparatorState>((set) => ({
  leftSession: null,
  rightSession: null,
  ignoredIds: new Set(),

  setSession(side, session) {
    if (side === 'left') {
      set({ leftSession: session })
    } else {
      set({ rightSession: session })
    }
  },

  clearSession(side) {
    set((state) => {
      const session = side === 'left' ? state.leftSession : state.rightSession
      const sessionIds = new Set(session?.entries.map((e) => e.id) ?? [])
      const nextIgnored = new Set(state.ignoredIds)
      for (const id of sessionIds) {
        nextIgnored.delete(id)
      }
      return {
        [side === 'left' ? 'leftSession' : 'rightSession']: null,
        ignoredIds: nextIgnored,
      } as Pick<ComparatorState, 'leftSession' | 'rightSession' | 'ignoredIds'>
    })
  },

  setIgnored(id, ignored) {
    set((state) => {
      const next = new Set(state.ignoredIds)
      if (ignored) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return { ignoredIds: next }
    })
  },

  swapSides() {
    set((state) => ({
      leftSession: state.rightSession,
      rightSession: state.leftSession,
      ignoredIds: new Set(),
    }))
  },

  reset() {
    set({
      leftSession: null,
      rightSession: null,
      ignoredIds: new Set(),
    })
  },
}))

export function useComparatorSession(side: 'left' | 'right'): Session | null {
  return useComparatorStore((s) => (side === 'left' ? s.leftSession : s.rightSession))
}

export function useComparatorEntries(side: 'left' | 'right'): Entry[] {
  const session = useComparatorSession(side)
  return session?.entries ?? []
}
