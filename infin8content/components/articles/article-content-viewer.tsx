'use client'

import ReactMarkdown from 'react-markdown'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, FileText } from 'lucide-react'
import type { ArticleSection } from '@/lib/types/article'
import { MarkdownErrorBoundary } from './markdown-error-boundary'

interface ArticleContentViewerProps {
  sections: ArticleSection[]
}

/**
 * Validates if a URL is safe to render
 * Only allows http:// and https:// protocols
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function ArticleContentViewer({ sections }: ArticleContentViewerProps) {
  if (!sections || sections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            No content available yet. Article is still being generated.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort sections by section_index to ensure correct order
  const sortedSections = [...sections].sort((a, b) => a.section_index - b.section_index)

  return (
    <div className="flex flex-col gap-8">
      {sortedSections.map((section, index) => {
        const isH3 = section.section_type === 'h3'

        return (
          <div key={section.section_index} className="flex flex-col gap-4">
            {/* Section Header */}
            {!isH3 && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    {section.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {section.quality_metrics?.quality_passed && (
                    <Badge variant="default" className="text-xs">
                      Quality Passed
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {isH3 && (
              <h3 className="text-xl font-semibold tracking-tight mt-4 mb-2">
                {section.title}
              </h3>
            )}

            {/* Section Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownErrorBoundary>
                    <MarkdownRenderer content={section.content} />
                  </MarkdownErrorBoundary>
                </div>
              </CardContent>
            </Card>

            {/* Section Metadata (collapsible or always visible) */}
            {(section.research_sources && section.research_sources.length > 0) ||
            section.quality_metrics ? (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {section.word_count && (
                      <div>
                        <span className="font-medium">Word Count: </span>
                        <span className="text-muted-foreground">{section.word_count}</span>
                      </div>
                    )}
                    {section.citations_included !== undefined && (
                      <div>
                        <span className="font-medium">Citations: </span>
                        <span className="text-muted-foreground">{section.citations_included}</span>
                      </div>
                    )}
                    {section.quality_metrics?.readability_score !== undefined && (
                      <div>
                        <span className="font-medium">Readability Score: </span>
                        <span className="text-muted-foreground">
                          {section.quality_metrics.readability_score.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {section.model_used && (
                      <div>
                        <span className="font-medium">Model: </span>
                        <span className="text-muted-foreground text-xs">
                          {section.model_used}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Research Sources */}
                  {section.research_sources && section.research_sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Research Sources ({section.research_sources.length})
                      </p>
                      <ul className="space-y-1 text-sm">
                        {section.research_sources.slice(0, 5).map((source, idx) => {
                          const urlValid = isValidUrl(source.url)
                          return (
                            <li key={idx}>
                              {urlValid ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  {source.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground inline-flex items-center gap-1">
                                  {source.title}
                                  <span className="text-xs">(Invalid URL)</span>
                                </span>
                              )}
                            </li>
                          )
                        })}
                        {section.research_sources.length > 5 && (
                          <li className="text-muted-foreground text-xs">
                            +{section.research_sources.length - 5} more sources
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Separator between sections (except last) */}
            {index < sortedSections.length - 1 && <Separator className="my-4" />}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Markdown renderer component with error handling
 * Wraps ReactMarkdown to handle rendering errors gracefully
 */
function MarkdownRenderer({ content }: { content: string }) {
  // ReactMarkdown handles errors internally, but we validate content first
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-destructive text-sm py-4">
        <p className="font-medium">Invalid content: Content must be a string</p>
      </div>
    )
  }

  return (
    <ReactMarkdown
      components={{
        // Custom link component to open external links in new tab
        a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode }) => {
          // Validate URL before rendering
          const url = href || ''
          const urlValid = isValidUrl(url)
          
          if (!urlValid) {
            return <span className="text-muted-foreground">{children}</span>
          }
          
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
              {...props}
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          )
        },
        // Custom heading components
        h2: ({ children, ...props }: { children?: React.ReactNode }) => (
          <h2 className="text-2xl font-bold mt-8 mb-4 first:mt-0" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }: { children?: React.ReactNode }) => (
          <h3 className="text-xl font-semibold mt-6 mb-3" {...props}>
            {children}
          </h3>
        ),
        // Custom paragraph
        p: ({ children, ...props }: { children?: React.ReactNode }) => (
          <p className="mb-4 leading-relaxed" {...props}>
            {children}
          </p>
        ),
        // Custom list
        ul: ({ children, ...props }: { children?: React.ReactNode }) => (
          <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }: { children?: React.ReactNode }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
            {children}
          </ol>
        ),
        // Custom list item
        li: ({ children, ...props }: { children?: React.ReactNode }) => (
          <li className="ml-4" {...props}>
            {children}
          </li>
        ),
        // Custom code blocks
        code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
          const isInline = !className
          return isInline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          ) : (
            <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono" {...props}>
              {children}
            </code>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

