'use client'

import ReactMarkdown from 'react-markdown'
import type { SnapshotSection } from '@/lib/types/article'
import { MarkdownErrorBoundary } from './markdown-error-boundary'

interface ArticleContentViewerProps {
  sections: SnapshotSection[]
}

// ─── Section type config ──────────────────────────────────────────────────────
// Controls visual treatment per FSM section_type value.

const SECTION_TYPE_CONFIG: Record<string, {
  containerClass: string
  headerTag: 'h1' | 'h2' | 'h3'
  headerClass: string
  showDivider: boolean
}> = {
  introduction: {
    containerClass: 'pb-10 mb-10 border-b border-neutral-200',
    headerTag: 'h1',
    headerClass: 'font-poppins text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight mb-6',
    showDivider: false,
  },
  h2: {
    containerClass: 'py-8',
    headerTag: 'h2',
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug mb-5',
    showDivider: true,
  },
  h3: {
    containerClass: 'py-6',
    headerTag: 'h3',
    headerClass: 'font-poppins text-xl sm:text-2xl font-semibold text-neutral-800 leading-snug mb-4',
    showDivider: false,
  },
  section: {
    containerClass: 'py-8',
    headerTag: 'h2',
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug mb-5',
    showDivider: true,
  },
  conclusion: {
    containerClass: 'pt-10 mt-10 border-t border-neutral-200',
    headerTag: 'h2',
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug mb-5',
    showDivider: false,
  },
  faq: {
    containerClass: 'py-8',
    headerTag: 'h2',
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug mb-5',
    showDivider: true,
  },
}

const DEFAULT_CONFIG = SECTION_TYPE_CONFIG.h2

// ─── Main component ───────────────────────────────────────────────────────────

export function ArticleContentViewer({ sections }: ArticleContentViewerProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500 font-lato">
        No content available yet. Article is still being generated.
      </div>
    )
  }

  // Normalise section shape — handle both assembler output shapes
  const normalizedSections = sections
    .map((s: any, index: number) => {
      const title = s.title ?? s.header ?? ''

      // Prefer markdown over HTML — ReactMarkdown renders markdown correctly;
      // if only HTML is available fall back to it (will render as raw HTML via
      // dangerouslySetInnerHTML path below)
      const markdownContent = typeof s.markdown === 'string' ? s.markdown : null
      const htmlContent = typeof s.html === 'string' ? s.html : null
      const rawContent = typeof s.content === 'string' ? s.content : null

      const content = markdownContent ?? rawContent ?? htmlContent ?? ''
      const isHtmlOnly = !markdownContent && !rawContent && !!htmlContent

      // Strip leading heading if it duplicates the section title
      let cleanedContent = content
      if (title && typeof title === 'string' && !isHtmlOnly) {
        const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        cleanedContent = content.replace(
          new RegExp(`^#{1,3}\\s+${escaped}\\s*\\n*`, 'i'),
          ''
        )
      }

      return {
        section_index: Number(s.section_index ?? s.order ?? index),
        section_type: (s.section_type ?? 'h2') as string,
        title,
        content: cleanedContent,
        isHtmlOnly,
      }
    })
    .sort((a, b) => a.section_index - b.section_index)

  return (
    // Constrain prose width for readability: ~70ch max regardless of parent width
    <article className="mx-auto w-full max-w-prose px-0">
      {normalizedSections.map((section, index) => {
        const config = SECTION_TYPE_CONFIG[section.section_type] ?? DEFAULT_CONFIG
        const HeaderTag = config.headerTag

        return (
          <div
            key={`${section.section_index}-${index}`}
            className={config.containerClass}
          >
            {/* Section heading — only render if there's a non-empty title */}
            {section.title && (
              <HeaderTag className={config.headerClass}>
                {section.title}
              </HeaderTag>
            )}

            {/* Section body */}
            <div className="font-lato text-neutral-700 leading-relaxed">
              {section.isHtmlOnly ? (
                // HTML-only fallback — assembler stored pre-rendered HTML
                <div
                  className="prose prose-neutral prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              ) : (
                <MarkdownErrorBoundary>
                  <ArticleMarkdown content={section.content} />
                </MarkdownErrorBoundary>
              )}
            </div>
          </div>
        )
      })}
    </article>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
// Renders markdown with article-appropriate typography.
// Links are rendered as plain text — citations use (Author, Year) format,
// not hyperlinks. Any markdown link that slips through is stripped to text only.

function ArticleMarkdown({ content }: { content: string }) {
  if (typeof content !== 'string') return null

  return (
    <ReactMarkdown
      components={{
        // ── Headings ────────────────────────────────────────────────────────
        h2: ({ children }) => (
          <h2 className="font-poppins text-xl font-semibold text-neutral-900 mt-8 mb-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="font-poppins text-lg font-semibold text-neutral-800 mt-6 mb-2">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="font-poppins text-base font-semibold text-neutral-800 mt-4 mb-1">
            {children}
          </h4>
        ),

        // ── Body text ────────────────────────────────────────────────────────
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed text-[1.0625rem]">
            {children}
          </p>
        ),

        // ── Links — strip to plain text (citations are plain text, not URLs) ──
        a: ({ children }) => (
          <span className="text-neutral-700">{children}</span>
        ),

        // ── Lists ────────────────────────────────────────────────────────────
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-1.5 text-[1.0625rem]">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-[1.0625rem]">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">
            {children}
          </li>
        ),

        // ── Tables ────────────────────────────────────────────────────────────
        table: ({ children }) => (
          <div className="overflow-x-auto my-6 rounded-lg border border-neutral-200 shadow-sm">
            <table className="min-w-full text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-neutral-50 border-b border-neutral-200">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="px-4 py-3 text-left font-semibold text-neutral-900 text-xs uppercase tracking-wide">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-neutral-700 border-t border-neutral-100">
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-neutral-50 transition-colors">
            {children}
          </tr>
        ),

        // ── Inline formatting ─────────────────────────────────────────────────
        strong: ({ children }) => (
          <strong className="font-semibold text-neutral-900">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-neutral-700">{children}</em>
        ),

        // ── Code ──────────────────────────────────────────────────────────────
        code: ({ className, children }) => {
          const isBlock = !!className
          return isBlock ? (
            <code className="block bg-neutral-950 text-neutral-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
              {children}
            </code>
          ) : (
            <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          )
        },

        // ── Blockquote ────────────────────────────────────────────────────────
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-neutral-300 pl-4 py-1 my-4 text-neutral-600 italic">
            {children}
          </blockquote>
        ),

        // ── Horizontal rule ───────────────────────────────────────────────────
        hr: () => <hr className="border-neutral-200 my-8" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
