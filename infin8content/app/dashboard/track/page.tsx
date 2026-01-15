import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TrackPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track</h1>
          <p className="text-muted-foreground">
            Analytics, revenue attribution, and performance tracking
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Analytics and tracking functionality is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This section will include analytics dashboard, revenue attribution, and ranking performance tracking.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key metrics at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Views</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg. Position</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue</span>
                <span className="text-sm font-medium">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Conversion</span>
                <span className="text-sm font-medium">0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

