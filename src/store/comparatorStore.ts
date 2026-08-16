import { create } from 'zustand'
import type { Entry, Session } from '../types'

interface ComparatorState {
  leftSession: Session | null
  rightSession: Session | null
  ignoredIds: Set<string>

  setSession: (side: 'left' | 'right', session: Session | null) => void
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
