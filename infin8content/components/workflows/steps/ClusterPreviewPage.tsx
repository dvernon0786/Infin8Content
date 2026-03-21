'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Loader2, RotateCcw } from 'lucide-react'

export interface Cluster {
  id: string
  hub_keyword_id: string
  hub_keyword: string
  spoke_keywords: string[]
  spoke_count: number
  confidence_score?: number
}

interface Props {
  clusters: Cluster[]
  onApprove: () => Promise<void>
  onRegenerate?: () => Promise<void>
  loading?: boolean
  regenerating?: boolean
}

export default function ClusterPreviewPage({ 
  clusters, 
  onApprove, 
  onRegenerate,
  loading = false,
  regenerating = false
}: Props) {
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (id: string) => {
    setExpanded(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const expandAll = () => {
    setExpanded(clusters.map(c => c.id))
  }

  const collapseAll = () => {
    setExpanded([])
  }

  const totalKeywords = clusters.reduce((sum, cluster) => sum + cluster.spoke_count + 1, 0) // +1 for hub
  const avgClusterSize = clusters.length > 0 ? Math.round(totalKeywords / clusters.length) : 0

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Cluster Preview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clusters.length} topic clusters generated from {totalKeywords} keywords (avg {avgClusterSize} per cluster)
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
        
        {onRegenerate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RotateCcw className="mr-2 h-4 w-4" />
            Regenerate Clusters
          </Button>
        )}
      </div>

      {/* Clusters */}
      <div className="space-y-4">
        {clusters.map((cluster, index) => (
          <div key={cluster.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
            
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-semibold text-lg text-blue-600">
                    {cluster.hub_keyword}
                  </h2>
                  <Badge variant="secondary">Hub</Badge>
                  {cluster.confidence_score && (
                    <Badge variant="outline">
                      {Math.round(cluster.confidence_score * 100)}% confidence
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground mb-3">
                  {cluster.spoke_count} supporting keywords • Cluster #{index + 1}
                </div>
              </div>

              <button
                onClick={() => toggle(cluster.id)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
              >
                {expanded.includes(cluster.id) ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>

            {expanded.includes(cluster.id) && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Supporting Keywords ({cluster.spoke_count}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.spoke_keywords.map((spoke, spokeIndex) => (
                    <Badge 
                      key={spokeIndex} 
                      variant="outline"
                      className="text-xs"
                    >
                      {spoke}
                    </Badge>
                  ))}
                </div>
                
                {cluster.spoke_count === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    No supporting keywords found for this hub
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {clusters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            No clusters were generated from the selected keywords.
          </div>
          {onRegenerate && (
            <Button variant="outline" onClick={onRegenerate} disabled={regenerating}>
              {regenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Try Regenerating
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {clusters.length === 0 
            ? "No clusters to approve"
            : `${clusters.length} clusters ready for article generation`
          }
        </div>
        <Button 
          onClick={onApprove}
          disabled={clusters.length === 0 || loading}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Approve & Generate Articles
        </Button>
      </div>

    </div>
  )
}
