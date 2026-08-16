import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Upload, ArrowRightLeft, Sparkles, X, Link2, Unlink, Wrench } from 'lucide-react'
import { cn } from '../lib/utils'
import { parseSessionMarkdown } from '../lib/parseSession'
import { computeToolMatches } from '../lib/compareSessions'
import { useComparatorEntries, useComparatorSession, useComparatorStore } from '../store/comparatorStore'
import { ComparatorTimeline } from './ComparatorTimeline'
import type { Session } from '../types'

function makeSessionId() {
  return `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function UploadZone({
  side,
  onSession,
}: {
  side: 'left' | 'right'
  onSession: (session: Session) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const loadMarkdown = useCallback(
    async (file: File) => {
      const text = await file.text()
      const session = parseSessionMarkdown(text, makeSessionId())
      onSession(session)
    },
    [onSession],
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
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]',
      )}
    >
      <Upload className="mb-3 h-10 w-10 text-[var(--accent)]" />
      <p className="text-base font-medium text-[var(--text-h)]">Drop session {side} .md here</p>
      <p className="mt-1 text-sm opacity-70">or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept=".md"
        multiple={false}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

function LineOverlay({
  matches,
  rowElements,
  containerRef,
}: {
  matches: { leftId: string; rightId: string }[]
  rowElements: React.MutableRefObject<Record<string, HTMLElement | null>>
  containerRef: React.RefObject<HTMLElement | null>
}) {
  const [paths, setPaths] = useState<string[]>([])

  const draw = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()

    const newPaths: string[] = []
    for (const match of matches) {
      const leftEl = rowElements.current[match.leftId]
      const rightEl = rowElements.current[match.rightId]
      if (!leftEl || !rightEl) continue

      const leftRect = leftEl.getBoundingClientRect()
      const rightRect = rightEl.getBoundingClientRect()

      const x1 = leftRect.right - containerRect.left
      const y1 = leftRect.top + leftRect.height / 2 - containerRect.top
      const x2 = rightRect.left - containerRect.left
      const y2 = rightRect.top + rightRect.height / 2 - containerRect.top

      const cx1 = x1 + (x2 - x1) * 0.5
      const cx2 = x2 - (x2 - x1) * 0.5

      newPaths.push(`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`)
    }
    setPaths(newPaths)
  }, [matches, rowElements, containerRef])

  useEffect(() => {
    draw()
    const container = containerRef.current
    if (!container) return

    const handle = () => draw()
    container.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      container.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [draw, containerRef])

  if (paths.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      style={{ overflow: 'visible' }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={0.6}
        />
      ))}
    </svg>
  )
}

type ScrollMode = 'sync' | 'independent'

function useSynchronizedScroll(mode: ScrollMode) {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncing = useRef(false)

  useEffect(() => {
    if (mode !== 'sync') return
    const left = leftRef.current
    const right = rightRef.current
    if (!left || !right) return

    const sync = (source: HTMLDivElement, target: HTMLDivElement) => {
      if (syncing.current) return
      syncing.current = true
      target.scrollTop = source.scrollTop
      requestAnimationFrame(() => {
        syncing.current = false
      })
    }

    const handleLeft = () => sync(left, right)
    const handleRight = () => sync(right, left)

    left.addEventListener('scroll', handleLeft)
    right.addEventListener('scroll', handleRight)
    return () => {
      left.removeEventListener('scroll', handleLeft)
      right.removeEventListener('scroll', handleRight)
    }
  }, [mode])

  return { leftRef, rightRef }
}

export function Comparator() {
  const leftSession = useComparatorSession('left')
  const rightSession = useComparatorSession('right')
  const leftEntries = useComparatorEntries('left')
  const rightEntries = useComparatorEntries('right')

  const setSession = useComparatorStore((s) => s.setSession)
  const clearSession = useComparatorStore((s) => s.clearSession)
  const ignoredIds = useComparatorStore((s) => s.ignoredIds)
  const setIgnored = useComparatorStore((s) => s.setIgnored)
  const swapSides = useComparatorStore((s) => s.swapSides)

  const hasBothSessions = Boolean(leftSession && rightSession)

  const [scrollMode, setScrollMode] = useState<ScrollMode>('sync')
  const [toolsOnly, setToolsOnly] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const rowElements = useRef<Record<string, HTMLElement | null>>({})
  const { leftRef, rightRef } = useSynchronizedScroll(scrollMode)

  const filteredLeftEntries = useMemo(
    () => (toolsOnly ? leftEntries.filter((e) => e.type === 'tool') : leftEntries),
    [leftEntries, toolsOnly],
  )
  const filteredRightEntries = useMemo(
    () => (toolsOnly ? rightEntries.filter((e) => e.type === 'tool') : rightEntries),
    [rightEntries, toolsOnly],
  )

  const matches = useMemo(
    () => computeToolMatches(filteredLeftEntries, filteredRightEntries, ignoredIds),
    [filteredLeftEntries, filteredRightEntries, ignoredIds],
  )

  const highlightedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const m of matches) {
      ids.add(m.leftId)
      ids.add(m.rightId)
    }
    return ids
  }, [matches])

  const handleRowRef = useCallback((id: string, el: HTMLElement | null) => {
    rowElements.current[id] = el
  }, [])

  const handleToggleIgnore = useCallback(
    (id: string) => {
      setIgnored(id, !ignoredIds.has(id))
    },
    [ignoredIds, setIgnored],
  )

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <h2 className="text-base font-semibold">Session comparator</h2>
        <div className="flex items-center gap-2">
          {hasBothSessions && (
            <>
              <div className="flex items-center rounded-md border border-[var(--border)] p-0.5">
                <button
                  type="button"
                  onClick={() => setScrollMode('sync')}
                  className={cn(
                    'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                    scrollMode === 'sync'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                      : 'text-[var(--text)] hover:bg-[var(--surface)]',
                  )}
                  title="Scroll both timelines together"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Common
                </button>
                <button
                  type="button"
                  onClick={() => setScrollMode('independent')}
                  className={cn(
                    'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                    scrollMode === 'independent'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                      : 'text-[var(--text)] hover:bg-[var(--surface)]',
                  )}
                  title="Scroll timelines independently"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Independent
                </button>
              </div>

              <button
                type="button"
                onClick={() => setToolsOnly((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                  toolsOnly
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]',
                )}
                title="Show only tool calls"
              >
                <Wrench className="h-3.5 w-3.5" />
                Tools only
              </button>

              <button
                type="button"
                onClick={swapSides}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[var(--surface)]"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Swap sides
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div
          ref={leftRef}
          className="flex flex-1 flex-col overflow-y-auto border-r border-[var(--border)] px-4"
        >
            {leftSession ? (
            <>
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-2 py-2">
                <span className="truncate text-sm font-medium text-[var(--text-h)]">{leftSession.title}</span>
                <button
                  type="button"
                  onClick={() => clearSession('left')}
                  className="ml-2 rounded p-1 text-[var(--text)] opacity-60 hover:bg-[var(--surface)] hover:opacity-100"
                  title="Remove session"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ComparatorTimeline
                entries={filteredLeftEntries}
                highlightedIds={highlightedIds}
                ignoredIds={ignoredIds}
                rowRef={handleRowRef}
                onToggleIgnore={handleToggleIgnore}
              />
            </>
          ) : (
            <div className="flex flex-1 p-8">
              <UploadZone side="left" onSession={(s) => setSession('left', s)} />
            </div>
          )}
        </div>

        <div
          ref={rightRef}
          className="flex flex-1 flex-col overflow-y-auto px-4"
        >
            {rightSession ? (
            <>
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-2 py-2">
                <span className="truncate text-sm font-medium text-[var(--text-h)]">{rightSession.title}</span>
                <button
                  type="button"
                  onClick={() => clearSession('right')}
                  className="ml-2 rounded p-1 text-[var(--text)] opacity-60 hover:bg-[var(--surface)] hover:opacity-100"
                  title="Remove session"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ComparatorTimeline
                entries={filteredRightEntries}
                highlightedIds={highlightedIds}
                ignoredIds={ignoredIds}
                rowRef={handleRowRef}
                onToggleIgnore={handleToggleIgnore}
              />
            </>
          ) : (
            <div className="flex flex-1 p-8">
              <UploadZone side="right" onSession={(s) => setSession('right', s)} />
            </div>
          )}
        </div>

        {hasBothSessions && (
          <LineOverlay matches={matches} rowElements={rowElements} containerRef={containerRef} />
        )}
      </div>

      {!leftSession && !rightSession && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-60">
          <Sparkles className="h-10 w-10 text-[var(--accent)]" />
          <p className="text-sm">Upload two session files to compare their tool calls.</p>
        </div>
      )}
    </div>
  )
}
