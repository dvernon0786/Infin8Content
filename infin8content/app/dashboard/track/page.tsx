import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TrackPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Track</h1>
        <p className="text-muted-foreground">
          Analytics, revenue attribution, and performance tracking
        </p>
      </div>

      <Card>
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
    </div>
  )
}

