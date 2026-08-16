import { User, Wrench, MessageSquare, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Entry } from '../types'

const icons = {
  user: User,
  text: MessageSquare,
  thinking: Sparkles,
  tool: Wrench,
}

function getLabel(entry: Entry): string {
  if (entry.type === 'tool') return entry.tool
  if (entry.type === 'thinking') return 'Thinking'
  if (entry.type === 'text') return 'Assistant'
  return 'User'
}

const colors = {
  user: 'bg-blue-500',
  text: 'bg-purple-500',
  thinking: 'bg-amber-500',
  tool: 'bg-emerald-500',
}

interface TimelineProps {
  entries: Entry[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function truncateValue(value: unknown, limit = 80): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}...`
}

function ToolParamPreview({ input }: { input: string }) {
  let params: { key: string; value: string }[] = []
  try {
    const obj = JSON.parse(input) as Record<string, unknown>
    params = Object.entries(obj).map(([key, value]) => ({ key, value: truncateValue(value) }))
  } catch {
    return <p className="mt-1 text-sm italic opacity-50">Invalid input</p>
  }

  if (params.length === 0) {
    return <p className="mt-1 text-sm italic opacity-50">No parameters</p>
  }

  return (
    <div className="mt-1.5 flex flex-col items-start gap-1">
      {params.map(({ key, value }) => (
        <div
          key={key}
          className="flex items-baseline gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs leading-none shadow-sm"
        >
          <span className="opacity-60">{key}</span>
          <span className="font-mono text-[var(--text-h)]">{value}</span>
        </div>
      ))}
    </div>
  )
}

function previewText(entry: Entry): string {
  if (entry.type === 'user') return entry.text.slice(0, 120).replace(/\n/g, ' ')
  if (entry.type === 'text') return entry.text.slice(0, 120).replace(/\n/g, ' ')
  if (entry.type === 'thinking') return entry.text.slice(0, 120).replace(/\n/g, ' ')
  return ''
}

export function Timeline({ entries, selectedId, onSelect }: TimelineProps) {
  return (
    <div className="relative flex flex-col py-4">
      <div
        className="absolute left-8 top-3 bottom-3 w-px bg-[var(--border)]"
        aria-hidden="true"
      />
      {entries.map((entry, index) => {
        const Icon = icons[entry.type]
        const isSelected = selectedId === entry.id
        const isFirst = index === 0

        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.id)}
            className={cn(
              'group relative flex w-full items-start gap-4 rounded-lg px-4 py-3 text-left transition-colors',
              isSelected ? 'bg-[var(--accent-bg)]' : 'hover:bg-[var(--surface)]',
            )}
          >
            <div className="relative z-10 flex shrink-0 items-center justify-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-sm',
                  colors[entry.type],
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide opacity-60">
                <span>{getLabel(entry)}</span>
                {!isFirst && <span className="text-[var(--border)]">·</span>}
                <span className="text-[var(--border)]">turn {entry.turnIndex + 1}</span>
              </div>
              {entry.type === 'tool' ? (
                <ToolParamPreview input={entry.input} />
              ) : (
                <p
                  className={cn(
                    'mt-1 truncate text-sm',
                    isSelected ? 'text-[var(--text-h)]' : 'text-[var(--text)]',
                    entry.type === 'thinking' && 'italic opacity-70',
                  )}
                >
                  {previewText(entry)}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
