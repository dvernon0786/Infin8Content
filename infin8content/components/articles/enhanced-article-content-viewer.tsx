// Enhanced Article Content Viewer with Epic 14 SEO Integration
// Story 14.7: Epic 14 Dashboard Integration
// Dashboard Integration Component

'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ExternalLink, 
  FileText, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { SEOReports } from '@/components/seo/seo-reports'
import { SEOScoreDisplay } from '@/components/seo/seo-score-display'
import type { ArticleSection } from '@/lib/types/article'
import { MarkdownErrorBoundary } from './markdown-error-boundary'

interface EnhancedArticleContentViewerProps {
  sections: ArticleSection[]
  articleId: string
  articleTitle: string
  primaryKeyword: string
  secondaryKeywords?: string[]
  targetWordCount?: number
}

interface SEOData {
  score: any
  validation: any
  recommendations: any[]
  report: any
  isLoading: boolean
}

export function EnhancedArticleContentViewer({ 
  sections, 
  articleId, 
  articleTitle,
  primaryKeyword,
  secondaryKeywords = [],
  targetWordCount = 300
}: EnhancedArticleContentViewerProps) {
  const [seoData, setSeoData] = useState<SEOData>({
    score: null,
    validation: null,
    recommendations: [],
    report: null,
    isLoading: false
  })
  const [showSEOAnalysis, setShowSEOAnalysis] = useState(false)
  const [showReports, setShowReports] = useState(false)

  // Load SEO data when component mounts
  useEffect(() => {
    if (sections && sections.length > 0) {
      loadSEOData()
    }
  }, [sections, articleId])

  const loadSEOData = async () => {
    setSeoData(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Combine all section content for SEO analysis
      const fullContent = sections.map(section => section.content).join('\n\n')
      
      if (!fullContent || fullContent.trim().length === 0) {
        console.warn('No content available for SEO analysis')
        setSeoData(prev => ({ ...prev, isLoading: false }))
        return
      }
      
      // Fetch all SEO data in parallel
      const [scoreResponse, validationResponse, recommendationsResponse, reportResponse] = await Promise.all([
        fetch('/api/seo/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: fullContent,
            primaryKeyword,
            secondaryKeywords,
            targetWordCount,
            contentType: 'general'
          })
        }),
        fetch('/api/seo/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: fullContent,
            primaryKeyword,
            secondaryKeywords,
            targetWordCount,
            strictMode: false
          })
        }),
        fetch(`/api/seo/recommendations/${articleId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: fullContent,
            primaryKeyword,
            secondaryKeywords,
            targetWordCount,
            contentType: 'general'
          })
        }),
        fetch(`/api/seo/reports/${articleId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: fullContent,
            primaryKeyword,
            secondaryKeywords,
            targetWordCount,
            contentType: 'general',
            historicalData: []
          })
        })
      ])
      
      // Check if all requests were successful
      if (!scoreResponse.ok) {
        throw new Error(`SEO score API failed: ${scoreResponse.status}`)
      }
      
      // Parse responses
      const [scoreData, validationData, recommendationsData, reportData] = await Promise.all([
        scoreResponse.json(),
        validationResponse.json(),
        recommendationsResponse.json(),
        reportResponse.json()
      ])
      
      // Extract actual data from wrapped responses
      const actualScoreData = scoreData.data || scoreData
      const actualValidationData = validationData.data || validationData
      const actualRecommendationsData = recommendationsData.data || recommendationsData
      const actualReportData = reportData.data || reportData
      
      // Validate score data
      if (!actualScoreData || typeof actualScoreData.overallScore !== 'number' || isNaN(actualScoreData.overallScore)) {
        console.warn('Invalid SEO score data received:', actualScoreData)
        setSeoData(prev => ({ ...prev, isLoading: false }))
        return
      }
      
      setSeoData({
        score: actualScoreData,
        validation: actualValidationData,
        recommendations: actualRecommendationsData.recommendations || actualRecommendationsData || [],
        report: actualReportData,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to load SEO data:', error)
      setSeoData(prev => ({ ...prev, isLoading: false }))
    }
  }

  if (!sections || sections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="font-lato text-neutral-600 text-body text-center py-8">
            No content available yet. Article is still being generated.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort sections by section_index to ensure correct order
  const sortedSections = [...sections].sort((a, b) => a.section_index - b.section_index)

  return (
    <div className="flex flex-col gap-6">
      {/* SEO Summary Header */}
      {seoData.score && seoData.score.overallScore && !isNaN(seoData.score.overallScore) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-poppins text-neutral-900 text-h3-desktop">
              <BarChart3 className="h-5 w-5 text-neutral-600" />
              SEO Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-100 rounded-lg border border-neutral-200">
                <div className={`text-2xl font-bold font-lato ${
                  seoData.score.overallScore >= 80 ? 'text-neutral-700' :
                  seoData.score.overallScore >= 60 ? 'text-neutral-700' : 'text-neutral-700'
                }`}>
                  {Math.round(seoData.score.overallScore)}
                </div>
                <div className="text-sm font-lato text-neutral-600">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-neutral-100 rounded-lg border border-neutral-200">
                <div className="text-2xl font-bold font-lato text-neutral-700">
                  {seoData.validation?.passed ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-sm font-lato text-neutral-600">Validation Status</div>
              </div>
              <div className="text-center p-4 bg-neutral-100 rounded-lg border border-neutral-200">
                <div className="text-2xl font-bold font-lato text-neutral-700">
                  {seoData.recommendations.length}
                </div>
                <div className="text-sm font-lato text-neutral-600">Recommendations</div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSEOAnalysis(!showSEOAnalysis)}
                className="flex items-center gap-2 font-lato text-neutral-600 hover:text-[--color-primary-blue]"
              >
                <Target className="h-4 w-4" />
                {showSEOAnalysis ? 'Hide' : 'Show'} SEO Analysis
                {showSEOAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReports(!showReports)}
                className="flex items-center gap-2 font-lato text-neutral-600 hover:text-[--color-primary-blue]"
              >
                <BarChart3 className="h-4 w-4" />
                {showReports ? 'Hide' : 'Show'} Reports
                {showReports ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Analysis Section */}
      {showSEOAnalysis && seoData.score && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-poppins text-neutral-900 text-h3-desktop">
              <Target className="h-5 w-5 text-neutral-600" />
              Detailed SEO Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SEO Score Display */}
            <SEOScoreDisplay 
              scoreResult={seoData.score}
              showDetails={true}
              compact={false}
            />

            {/* Validation Results */}
            {seoData.validation && (
              <div>
                <h4 className="font-poppins text-neutral-900 text-h3-mobile mb-4 flex items-center gap-2">
                  {seoData.validation.passed ? (
                    <CheckCircle className="h-5 w-5 text-neutral-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-neutral-600" />
                  )}
                  Validation Results
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold font-lato text-neutral-700">
                      {seoData.validation.metrics.passedRules}
                    </div>
                    <div className="text-sm font-lato text-neutral-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-lato text-neutral-700">
                      {seoData.validation.metrics.failedRules}
                    </div>
                    <div className="text-sm font-lato text-neutral-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-lato text-neutral-700">
                      {seoData.validation.metrics.warningCount}
                    </div>
                    <div className="text-sm font-lato text-neutral-600">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-lato text-neutral-700">
                      {seoData.validation.metrics.errorCount}
                    </div>
                    <div className="text-sm font-lato text-neutral-600">Errors</div>
                  </div>
                </div>
                
                {/* Issues Summary */}
                {seoData.validation.issues.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-poppins text-neutral-900 text-h3-mobile">Issues Found:</h5>
                    {seoData.validation.issues.slice(0, 5).map((issue: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded">
                        <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {issue.type}
                        </Badge>
                        <span className="text-sm font-lato text-neutral-600">{issue.message}</span>
                      </div>
                    ))}
                    {seoData.validation.issues.length > 5 && (
                      <div className="text-sm font-lato text-neutral-500 text-center">
                        ... and {seoData.validation.issues.length - 5} more issues
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {seoData.recommendations.length > 0 && (
              <div>
                <h4 className="font-poppins text-neutral-900 text-h3-mobile mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-neutral-600" />
                  Recommendations ({seoData.recommendations.length})
                </h4>
                <div className="space-y-3">
                  {seoData.recommendations.slice(0, 10).map((rec: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-neutral-50 rounded">
                      <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {rec.priority}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-lato text-small font-medium text-neutral-900">{rec.title}</div>
                        <div className="text-xs font-lato text-neutral-600">{rec.description}</div>
                      </div>
                      <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs">
                        {rec.type}
                      </Badge>
                    </div>
                  ))}
                  {seoData.recommendations.length > 10 && (
                    <div className="text-sm font-lato text-neutral-500 text-center">
                      ... and {seoData.recommendations.length - 10} more recommendations
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports Section */}
      {showReports && seoData.report && (
        <SEOReports 
          report={seoData.report}
          onExport={(format) => {
            // Handle export functionality
            console.log(`Exporting report as ${format}`)
          }}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col gap-8">
        {sortedSections.map((section, index) => {
          const isH3 = section.section_type === 'h3'

          return (
            <div key={`${section.section_index}-${index}`} className="flex flex-col gap-4">
              {/* Section Header */}
              {!isH3 && (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-poppins text-neutral-900 text-h2-desktop mb-2">
                      {section.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.quality_metrics?.quality_passed && (
                      <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs">
                        Quality Passed
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {isH3 && (
                <h3 className="font-poppins text-neutral-900 text-h3-mobile mt-4 mb-2">
                  {section.title}
                </h3>
              )}

              {/* Section Content */}
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert font-lato text-neutral-700 text-body prose-neutral">
                    <MarkdownErrorBoundary>
                      <MarkdownRenderer content={section.content} />
                    </MarkdownErrorBoundary>
                  </div>
                </CardContent>
              </Card>

              {/* Section SEO Insights */}
              {seoData.score && (
                <Card className="bg-neutral-50 border-neutral-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-neutral-600" />
                      <span className="text-sm font-lato text-neutral-900">SEO Insights</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="font-lato text-small font-medium text-neutral-900">Words: </span>
                        <span className="font-lato text-small text-neutral-600">{section.word_count || 0}</span>
                      </div>
                      <div>
                        <span className="font-lato text-small font-medium text-neutral-900">Readability: </span>
                        <span className="font-lato text-small text-neutral-600">
                          {section.quality_metrics?.readability_score?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-lato text-small font-medium text-neutral-900">Citations: </span>
                        <span className="font-lato text-small text-neutral-600">{section.citations_included || 0}</span>
                      </div>
                      <div>
                        <span className="font-lato text-small font-medium text-neutral-900">Model: </span>
                        <span className="font-lato text-small text-neutral-600 text-xs">
                          {section.model_used || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Research Sources */}
              {section.research_sources && section.research_sources.length > 0 && (
                <Card className="bg-neutral-50 border-neutral-200">
                  <CardContent className="pt-4">
                    <p className="font-lato text-small font-medium text-neutral-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-neutral-600" />
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
                                className="text-neutral-600 hover:text-[--color-primary-blue] underline inline-flex items-center gap-1"
                              >
                                {source.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="font-lato text-small text-neutral-600 inline-flex items-center gap-1">
                                {source.title}
                                <span className="text-xs text-neutral-500">(Invalid URL)</span>
                              </span>
                            )}
                          </li>
                        )
                      })}
                      {section.research_sources.length > 5 && (
                        <li className="font-lato text-small text-neutral-500">
                          +{section.research_sources.length - 5} more sources
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Separator between sections (except last) */}
              {index < sortedSections.length - 1 && <Separator className="my-4" />}
            </div>
          )
        })}
      </div>
      
      {seoData.isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600 mx-auto mb-4"></div>
              <p className="font-lato text-neutral-600 text-body">Analyzing SEO...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
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
            return <span className="font-lato text-small text-neutral-600">{children}</span>
          }
          
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-[--color-primary-blue] underline inline-flex items-center gap-1"
              {...props}
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          )
        },
        // Custom heading components
        h2: ({ children, ...props }: { children?: React.ReactNode }) => (
          <h2 className="font-poppins text-neutral-900 text-h2-desktop mt-8 mb-4 first:mt-0" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }: { children?: React.ReactNode }) => (
          <h3 className="font-poppins text-neutral-900 text-h3-mobile mt-6 mb-3" {...props}>
            {children}
          </h3>
        ),
        // Custom paragraph
        p: ({ children, ...props }: { children?: React.ReactNode }) => (
          <p className="mb-4 leading-relaxed font-lato text-neutral-700 text-body" {...props}>
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
            <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono text-neutral-700" {...props}>
              {children}
            </code>
          ) : (
            <code className="block bg-neutral-100 p-4 rounded-lg overflow-x-auto text-sm font-mono text-neutral-700" {...props}>
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
