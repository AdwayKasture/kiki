import { useState } from 'react'
import { PanelLeft, PanelRight, Brain, GitCompare } from 'lucide-react'
import { Overview } from './components/Overview'
import { SessionList } from './components/SessionList'
import { Timeline } from './components/Timeline'
import { DetailPanel } from './components/DetailPanel'
import { useSelectedEntry, useSelectedSession, useSessionStore } from './store/sessionStore'
import { cn } from './lib/utils'

type View = 'session' | 'comparator'

export default function App() {
  const selectedSession = useSelectedSession()
  const selectedEntry = useSelectedEntry()
  const selectEntry = useSessionStore((s) => s.selectEntry)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState<View>('session')

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-md p-1.5 text-[var(--text)] hover:bg-[var(--surface)]"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--accent)]">kiki</h1>
        </div>
        <span className="text-xs opacity-60">Session skill builder</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'flex shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-200',
            sidebarOpen ? 'w-72' : 'w-14',
          )}
        >
          <nav className="flex flex-col gap-1 border-b border-[var(--border)] p-2">
            <button
              type="button"
              onClick={() => setActiveView('session')}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors',
                activeView === 'session'
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                  : 'text-[var(--text)] hover:bg-[var(--surface)]',
                !sidebarOpen && 'justify-center',
              )}
              title="Understand session"
            >
              <Brain className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Understand session</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('comparator')}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors',
                activeView === 'comparator'
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                  : 'text-[var(--text)] hover:bg-[var(--surface)]',
                !sidebarOpen && 'justify-center',
              )}
              title="Session comparator"
            >
              <GitCompare className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Session comparator</span>}
            </button>
          </nav>

          {sidebarOpen && activeView === 'session' && (
            <div className="flex-1 overflow-y-auto">
              <SessionList />
            </div>
          )}
        </aside>

        <main className="flex min-w-0 flex-1">
          {activeView === 'comparator' ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <h2 className="text-2xl font-semibold">hello world</h2>
            </div>
          ) : selectedSession ? (
            <>
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-[var(--border)] px-6 py-3">
                  <h2 className="truncate text-base">{selectedSession.title}</h2>
                  <p className="text-xs opacity-60">
                    {selectedSession.entries.length} entries
                    {selectedSession.sessionId ? ` · ${selectedSession.sessionId}` : ''}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Timeline
                    entries={selectedSession.entries}
                    selectedId={selectedEntry?.id ?? null}
                    onSelect={selectEntry}
                  />
                </div>
              </div>

              <div className="w-[420px] shrink-0 overflow-hidden border-l border-[var(--border)]">
                <DetailPanel entry={selectedEntry} />
              </div>
            </>
          ) : (
            <Overview />
          )}
        </main>
      </div>
    </div>
  )
}
