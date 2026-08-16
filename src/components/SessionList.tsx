import { FileText, X, Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

export function SessionList() {
  const sessions = useSessionStore((s) => s.sessions)
  const selectSession = useSessionStore((s) => s.selectSession)
  const removeSession = useSessionStore((s) => s.removeSession)

  if (sessions.length === 0) return null

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">Loaded sessions</p>
      {sessions.map((session) => (
        <div
          key={session.id}
          role="button"
          tabIndex={0}
          onClick={() => selectSession(session.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              selectSession(session.id)
            }
          }}
          className={cn(
            'group flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
            'border-[var(--border)] hover:bg-[var(--surface)]',
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <span className="truncate text-[var(--text-h)]">{session.title}</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeSession(session.id)
            }}
            className="ml-2 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => selectSession(null)}
        className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span>Add another session</span>
      </button>
    </div>
  )
}
