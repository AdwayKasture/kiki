import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, User, Bot, Wrench, MessageSquare, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Entry } from '../types'

const icons = {
  user: User,
  text: MessageSquare,
  thinking: Sparkles,
  tool: Wrench,
}

function getLabel(entry: Entry): string {
  if (entry.type === 'tool') return entry.tool
  if (entry.type === 'thinking') return 'Assistant'
  if (entry.type === 'text') return 'Assistant message'
  return 'User message'
}

interface DetailPanelProps {
  entry: Entry | undefined
}

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <Accordion.Item value={value} className="border-b border-[var(--border)]">
      <Accordion.Trigger className="group flex w-full items-center justify-between py-3 text-left text-sm font-medium text-[var(--text-h)] hover:opacity-80">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
      </Accordion.Trigger>
      <Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
        <div className="pb-4">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

function CodeBlock({ content }: { content: string }) {
  if (!content) return <p className="text-sm italic opacity-50">Empty</p>
  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--code-bg)] p-3 text-xs leading-relaxed text-[var(--text-h)]">
      <code className="whitespace-pre-wrap break-words">{content}</code>
    </pre>
  )
}

function JsonBlock({ content }: { content: string }) {
  if (!content) return <p className="text-sm italic opacity-50">Empty</p>
  let formatted = content
  try {
    formatted = JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    // leave as-is if not valid JSON
  }
  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--code-bg)] p-3 text-xs leading-relaxed text-[var(--text-h)]">
      <code className="whitespace-pre-wrap break-words">{formatted}</code>
    </pre>
  )
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="markdown-body max-h-[32rem] overflow-auto rounded-lg bg-[var(--code-bg)] p-4 text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

export function DetailPanel({ entry }: DetailPanelProps) {
  if (!entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-60">
        <Bot className="mb-3 h-10 w-10" />
        <p className="text-sm">Select a node on the timeline to inspect it.</p>
      </div>
    )
  }

  const Icon = icons[entry.type]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg leading-tight">{getLabel(entry)}</h2>
            <p className="text-xs opacity-60">Turn {entry.turnIndex + 1} · entry {entry.entryIndex + 1}</p>
          </div>
        </div>
      </div>

      <Accordion.Root
        type="multiple"
        defaultValue={['content']}
        className="flex-1 overflow-auto px-4"
      >
        {entry.type === 'tool' && (
          <>
            <Section value="tool" title="Tool">
              <p className="text-sm font-medium text-[var(--text-h)]">{entry.tool}</p>
            </Section>
            <Section value="input" title="Input">
              <JsonBlock content={entry.input} />
            </Section>
            <Section value="output" title="Output">
              <CodeBlock content={entry.output} />
            </Section>
          </>
        )}

        {entry.type === 'thinking' && (
          <Section value="content" title="Assistant">
            <MarkdownContent text={entry.text} />
          </Section>
        )}

        {(entry.type === 'user' || entry.type === 'text') && (
          <Section value="content" title={entry.type === 'user' ? 'User' : 'Assistant'}>
            <MarkdownContent text={entry.text} />
          </Section>
        )}
      </Accordion.Root>
    </div>
  )
}
