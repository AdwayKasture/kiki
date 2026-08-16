import { FileUpload } from './components/FileUpload'
import { Timeline } from './components/Timeline'
import { DetailPanel } from './components/DetailPanel'
import { useSelectedEntry, useSelectedSession, useSessionStore } from './store/sessionStore'

export default function App() {
  const selectedSession = useSelectedSession()
  const selectedEntry = useSelectedEntry()
  const selectEntry = useSessionStore((s) => s.selectEntry)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--accent)]">kiki</h1>
        <span className="text-xs opacity-60">Session skill builder</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-[var(--border)]">
          <FileUpload />
        </aside>

        <main className="flex min-w-0 flex-1">
          {selectedSession ? (
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
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center opacity-60">
              <p className="text-sm">Upload a session .md file or load a sample to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
