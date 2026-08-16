import { useCallback, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { parseSessionMarkdown } from '../lib/parseSession'
import { useSessionStore } from '../store/sessionStore'

function makeSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const sessions = useSessionStore((s) => s.sessions)
  const addSession = useSessionStore((s) => s.addSession)
  const removeSession = useSessionStore((s) => s.removeSession)
  const selectSession = useSessionStore((s) => s.selectSession)

  const loadMarkdown = useCallback(
    async (file: File) => {
      const text = await file.text()
      const session = parseSessionMarkdown(text, makeSessionId())
      addSession(session)
    },
    [addSession],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.md'))
      for (const file of files) {
        loadMarkdown(file)
      }
    },
    [loadMarkdown],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) => f.name.endsWith('.md'))
      for (const file of files) {
        loadMarkdown(file)
      }
      e.target.value = ''
    },
    [loadMarkdown],
  )

  const loadFixture = useCallback(
    async (path: string) => {
      const response = await fetch(path)
      const text = await response.text()
      const session = parseSessionMarkdown(text, makeSessionId())
      addSession(session)
    },
    [addSession],
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]',
        )}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-[var(--accent)]" />
        <p className="text-sm font-medium text-[var(--text-h)]">Drop session .md files here</p>
        <p className="text-xs opacity-70">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".md"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {sessions.length === 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadFixture('/fixtures/session-ses_0510.md')}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface)]"
          >
            Load sample 1
          </button>
          <button
            type="button"
            onClick={() => loadFixture('/fixtures/session-ses_0c33.md')}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface)]"
          >
            Load sample 2
          </button>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="flex flex-col gap-2">
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
        </div>
      )}
    </div>
  )
}
