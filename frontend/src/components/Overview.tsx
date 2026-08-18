import { useCallback, useEffect, useRef } from 'react'
import { Upload, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

export function Overview() {
  const inputRef = useRef<HTMLInputElement>(null)
  const addSession = useSessionStore((s) => s.addSession)
  const loadSessions = useSessionStore((s) => s.loadSessions)

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const loadMarkdown = useCallback(
    async (file: File) => {
      const text = await file.text()
      await addSession(text)
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-8">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-bg)] text-[var(--accent)]">
          <Sparkles className="h-8 w-8" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-h)]">Welcome to kiki</h2>
          <p className="mt-2 text-sm opacity-70">
            Upload an agent session markdown file to inspect, compare, and turn common patterns into reusable skills.
          </p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors',
            'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]',
          )}
        >
          <Upload className="mx-auto mb-3 h-10 w-10 text-[var(--accent)]" />
          <p className="text-base font-medium text-[var(--text-h)]">Drop session .md files here</p>
          <p className="mt-1 text-sm opacity-70">or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            accept=".md"
            multiple
            className="hidden"
            onChange={handleChange}
          />
        </div>

      </div>
    </div>
  )
}
