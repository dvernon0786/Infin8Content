'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Download, Eye } from 'lucide-react'
import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'

interface WorkflowCompletedPageProps {
  params: { id: string }
}

export default function WorkflowCompletedPage({ params }: WorkflowCompletedPageProps) {
  const router = useRouter()
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const id = params.id
        const response = await fetch(`/api/intent/workflows/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch workflow')
        }

        const data = await response.json()
        setWorkflow(data.workflow)
      } catch (err: any) {
        console.error('Error loading workflow:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-3 text-sm text-muted-foreground flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </button>

          <span className="font-medium text-foreground">
            {workflow?.name || 'Workflow'}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Workflow Complete!
          </h1>
          <p className="text-muted-foreground">
            Your intent workflow has been successfully processed and articles have been generated.
          </p>
        </div>

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Results Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">25</div>
                <div className="text-sm text-muted-foreground">Keywords</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">1</div>
                <div className="text-sm text-muted-foreground">Clusters</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Subtopics</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Articles</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View Articles
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>ICP Analysis completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Competitor analysis completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Seed keywords extracted</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Longtail expansion completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Keyword filtering completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Topic clustering completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cluster validation completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Subtopic generation completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Article generation completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
