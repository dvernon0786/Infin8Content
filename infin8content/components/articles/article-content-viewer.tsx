'use client'

import ReactMarkdown from 'react-markdown'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, FileText } from 'lucide-react'

interface Section {
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  section_index: number
  h2_index?: number
  h3_index?: number
  title: string
  content: string
  word_count: number
  generated_at: string
  research_sources?: Array<{
    title: string
    url: string
    excerpt?: string
    published_date?: string | null
    author?: string | null
    relevance_score?: number
  }>
  citations_included?: number
  research_query?: string
  tokens_used?: number
  model_used?: string
  quality_metrics?: {
    word_count: number
    citations_included: number
    readability_score?: number
    keyword_density?: number
    quality_passed: boolean
    quality_retry_count: number
  }
}

interface ArticleContentViewerProps {
  sections: Section[]
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
        const isIntroduction = section.section_type === 'introduction'
        const isConclusion = section.section_type === 'conclusion'
        const isFAQ = section.section_type === 'faq'

        return (
          <div key={section.section_index} className="flex flex-col gap-4">
            {/* Section Header */}
            {!isH3 && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {isIntroduction && (
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      {section.title}
                    </h2>
                  )}
                  {section.section_type === 'h2' && (
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      {section.title}
                    </h2>
                  )}
                  {isConclusion && (
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      {section.title}
                    </h2>
                  )}
                  {isFAQ && (
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      {section.title}
                    </h2>
                  )}
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
                  <ReactMarkdown
                    components={{
                      // Custom link component to open external links in new tab
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {props.children}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ),
                      // Custom heading components
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-bold mt-8 mb-4 first:mt-0" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />
                      ),
                      // Custom paragraph
                      p: ({ node, ...props }) => (
                        <p className="mb-4 leading-relaxed" {...props} />
                      ),
                      // Custom list
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
                      ),
                      // Custom list item
                      li: ({ node, ...props }) => (
                        <li className="ml-4" {...props} />
                      ),
                      // Custom code blocks
                      code: ({ className, ...props }: { className?: string; children?: React.ReactNode }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                        ) : (
                          <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono" {...props} />
                        )
                      },
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
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
                        {section.research_sources.slice(0, 5).map((source, idx) => (
                          <li key={idx}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {source.title}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                        ))}
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

