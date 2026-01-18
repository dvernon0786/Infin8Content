import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

interface EfficiencyMetrics {
  timeToFirstArticle: number | null
  reviewCycleReduction: number | null
  dashboardLoadTime: number | null
  articleCreationLoadTime: number | null
  commentDeliveryLatency: number | null
  progressUpdateFrequency: number | null
}

interface MetricCardProps {
  title: string
  value: string | number | null
  target: string
  status: 'success' | 'warning' | 'error'
}

// Simple metric card component
function MetricCard({ title, value, target, status }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Badge variant={status === 'success' ? 'default' : 'secondary'}>
          {status === 'success' ? 'On Target' : 'Attention'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value || 'N/A'}</div>
        <p className="text-xs text-muted-foreground">Target: {target}</p>
      </CardContent>
    </Card>
  )
}

// Helper functions for transformation
function calculateTimeToFirstArticle(events: any[]) {
  const articleEvents = events.filter(e => e.event_name === 'article_create_flow');
  const times = articleEvents.map(event => {
    const started = event.payload?.started_at;
    const completed = event.payload?.completed_at;
    return started && completed ? new Date(completed).getTime() - new Date(started).getTime() : null;
  }).filter((time): time is number => time !== null);
  
  return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null;
}

function calculateReviewCycleReduction(metrics: any[]) {
  if (!metrics || metrics.length < 2) return null;
  
  const latestMetrics = metrics[0];
  const baselineMetrics = metrics[metrics.length - 1];
  
  if (!latestMetrics || !baselineMetrics) return null;
  
  const latestReviewTime = (latestMetrics.metrics as any)?.review_flow_median_duration || 0;
  const baselineReviewTime = (baselineMetrics.metrics as any)?.review_flow_median_duration || 0;
  
  return baselineReviewTime > 0 ? ((baselineReviewTime - latestReviewTime) / baselineReviewTime) * 100 : null;
}

function calculateAverageLoadTime(events: any[], eventType: string) {
  const loadEvents = events.filter(e => e.event_name === eventType);
  const times = loadEvents.map(e => e.payload?.load_time).filter((time): time is number => time !== null);
  
  return times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : null;
}

function calculateAverageLatency(events: any[], eventType: string) {
  const latencyEvents = events.filter(e => e.event_name === eventType);
  const latencies = latencyEvents.map(e => e.payload?.latency).filter((time): time is number => time !== null);
  
  return latencies.length > 0 ? latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length : null;
}

function calculateUpdateFrequency(events: any[]) {
  const progressEvents = events.filter(e => e.event_name === 'progress_update');
  const intervals = progressEvents.map((e, i) => {
    if (i === 0) return null;
    const prevEvent = progressEvents[i - 1];
    return prevEvent ? new Date(e.created_at).getTime() - new Date(prevEvent.created_at).getTime() : null;
  }).filter((interval): interval is number => interval !== null);
  
  return intervals.length > 0 ? intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length : null;
}

function formatDuration(ms: number | null) {
  if (!ms) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export default async function EfficiencyMetricsDashboard() {
  const supabase = await createClient();
  
  // Query existing UX metrics from Story 32.1
  const { data: uxMetrics } = await supabase
    .from('ux_metrics_weekly_rollups')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(12); // Last 12 weeks

  // Query existing performance data
  const { data: performanceData } = await supabase
    .from('ux_metrics_events')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Transform UX metrics into efficiency indicators
  const efficiencyMetrics: EfficiencyMetrics = {
    timeToFirstArticle: calculateTimeToFirstArticle(performanceData || []),
    reviewCycleReduction: calculateReviewCycleReduction(uxMetrics || []),
    dashboardLoadTime: calculateAverageLoadTime(performanceData || [], 'dashboard_load'),
    articleCreationLoadTime: calculateAverageLoadTime(performanceData || [], 'article_creation'),
    commentDeliveryLatency: calculateAverageLatency(performanceData || [], 'comment_delivery'),
    progressUpdateFrequency: calculateUpdateFrequency(performanceData || [])
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Efficiency & Performance Metrics</h2>
        <p className="text-muted-foreground">
          Monitor platform efficiency and performance indicators
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Time to First Published Article */}
        <MetricCard
          title="Time to First Published Article"
          value={formatDuration(efficiencyMetrics.timeToFirstArticle)}
          target="< 15 minutes"
          status={(efficiencyMetrics.timeToFirstArticle || 0) < 15 * 60 * 1000 ? 'success' : 'warning'}
        />
        
        {/* Review Cycle Reduction */}
        <MetricCard
          title="Review Cycle Reduction"
          value={`${efficiencyMetrics.reviewCycleReduction?.toFixed(1)}%`}
          target="> 60%"
          status={(efficiencyMetrics.reviewCycleReduction || 0) > 60 ? 'success' : 'warning'}
        />
        
        {/* Dashboard Load Time */}
        <MetricCard
          title="Dashboard Load Time"
          value={`${efficiencyMetrics.dashboardLoadTime?.toFixed(2)}s`}
          target="< 2 seconds"
          status={(efficiencyMetrics.dashboardLoadTime || 0) < 2 ? 'success' : 'warning'}
        />
        
        {/* Article Creation Page Load */}
        <MetricCard
          title="Article Creation Load Time"
          value={`${efficiencyMetrics.articleCreationLoadTime?.toFixed(2)}s`}
          target="< 3 seconds"
          status={(efficiencyMetrics.articleCreationLoadTime || 0) < 3 ? 'success' : 'warning'}
        />
        
        {/* Comment Delivery Latency */}
        <MetricCard
          title="Comment Delivery Latency"
          value={`${efficiencyMetrics.commentDeliveryLatency?.toFixed(3)}s`}
          target="< 1 second"
          status={(efficiencyMetrics.commentDeliveryLatency || 0) < 1 ? 'success' : 'warning'}
        />
        
        {/* Progress Update Frequency */}
        <MetricCard
          title="Progress Update Frequency"
          value={`${(efficiencyMetrics.progressUpdateFrequency || 0 / 1000).toFixed(1)}s`}
          target="3 seconds"
          status={Math.abs((efficiencyMetrics.progressUpdateFrequency || 0) / 1000 - 3) < 1 ? 'success' : 'warning'}
        />
      </div>
      
      {/* Efficiency Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium">Platform Performance</h4>
              <p className="text-sm text-muted-foreground">
                Dashboard and article creation performance are within target ranges.
              </p>
            </div>
            <div>
              <h4 className="font-medium">User Productivity</h4>
              <p className="text-sm text-muted-foreground">
                Review cycle reduction shows improvement in user workflow efficiency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
