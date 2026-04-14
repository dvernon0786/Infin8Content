'use client'

import ReactMarkdown from 'react-markdown'
import type { SnapshotSection } from '@/lib/types/article'
import { MarkdownErrorBoundary } from './markdown-error-boundary'

interface ArticleContentViewerProps {
  sections: SnapshotSection[]
}

// ─── Section type config ──────────────────────────────────────────────────────

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

  const normalizedSections = sections
    .map((s: any, index: number) => {
      const title = s.title ?? s.header ?? ''
      const markdownContent = typeof s.markdown === 'string' ? s.markdown : null
      const htmlContent = typeof s.html === 'string' ? s.html : null
      const rawContent = typeof s.content === 'string' ? s.content : null
      const content = markdownContent ?? rawContent ?? htmlContent ?? ''
      const isHtmlOnly = !markdownContent && !rawContent && !!htmlContent

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
    <article className="mx-auto w-full max-w-prose px-0">
      {normalizedSections.map((section, index) => {
        const config = SECTION_TYPE_CONFIG[section.section_type] ?? DEFAULT_CONFIG
        const HeaderTag = config.headerTag

        return (
          <div
            key={`${section.section_index}-${index}`}
            className={config.containerClass}
          >
            {section.title && (
              <HeaderTag className={config.headerClass}>
                {section.title}
              </HeaderTag>
            )}

            <div className="font-lato text-neutral-700 leading-relaxed">
              {section.isHtmlOnly ? (
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

// ─── Shared markdown component map ───────────────────────────────────────────
// Used by both ArticleMarkdown (section viewer) and ArticleMarkdownViewer (full article).
// Keeps styling consistent across both render paths.
// No @tailwindcss/typography required — all styling via explicit component overrides.

function sharedComponents(extraLinkClass = '') {
  return {
    // ── Headings ──────────────────────────────────────────────────────────────
    h1: ({ children }: any) => (
      <h1 className="font-poppins text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight mt-0 mb-6">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug mt-10 mb-4 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="font-poppins text-xl font-semibold text-neutral-800 mt-7 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="font-poppins text-base font-semibold text-neutral-800 mt-5 mb-2">
        {children}
      </h4>
    ),

    // ── Body text ─────────────────────────────────────────────────────────────
    p: ({ children }: any) => (
      <p className="mb-4 leading-relaxed text-[1.0625rem] text-neutral-700">
        {children}
      </p>
    ),

    // ── Links ─────────────────────────────────────────────────────────────────
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-blue-600 underline hover:text-blue-800 transition-colors ${extraLinkClass}`}
      >
        {children}
      </a>
    ),

    // ── Inline formatting ─────────────────────────────────────────────────────
    strong: ({ children }: any) => (
      <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-neutral-700">{children}</em>
    ),

    // ── Lists ─────────────────────────────────────────────────────────────────
    ul: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-4 space-y-1.5 text-[1.0625rem] text-neutral-700">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-[1.0625rem] text-neutral-700">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed">{children}</li>
    ),

    // ── Tables ────────────────────────────────────────────────────────────────
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-neutral-200 shadow-sm">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-neutral-50 border-b border-neutral-200">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left font-semibold text-neutral-900 text-xs uppercase tracking-wide">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-neutral-700 border-t border-neutral-100">{children}</td>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-neutral-50 transition-colors">{children}</tr>
    ),

    // ── Code ──────────────────────────────────────────────────────────────────
    code: ({ className, children }: any) => {
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

    // ── Blockquote ────────────────────────────────────────────────────────────
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-neutral-300 pl-4 py-1 my-4 text-neutral-600 italic">
        {children}
      </blockquote>
    ),

    // ── Horizontal rule ───────────────────────────────────────────────────────
    hr: () => <hr className="border-neutral-200 my-8" />,

    // ── Images ────────────────────────────────────────────────────────────────
    img: ({ src, alt }: any) => (
      <img
        src={src}
        alt={alt || ''}
        className="w-full rounded-lg my-6 object-cover shadow-sm"
        loading="lazy"
      />
    ),
  }
}

// ─── Section-level markdown renderer ─────────────────────────────────────────

function ArticleMarkdown({ content }: { content: string }) {
  if (typeof content !== 'string') return null

  return (
    <ReactMarkdown components={sharedComponents()}>
      {content}
    </ReactMarkdown>
  )
}

// ─── Full-article markdown renderer ──────────────────────────────────────────
// Renders final_markdown produced by ArticleAssembler.
// final_markdown is pure markdown (## headers, *, bold, links, images).
// No @tailwindcss/typography required — all styling via explicit component overrides.

export function ArticleMarkdownViewer({ markdown }: { markdown: string }) {
  if (typeof markdown !== 'string' || !markdown.trim()) return null

  return (
    <article className="mx-auto w-full max-w-prose font-lato text-neutral-700">
      <ReactMarkdown components={sharedComponents()}>
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
