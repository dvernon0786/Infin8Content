import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileCard } from "@/components/mobile/mobile-card"

export default function PublishPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publish</h1>
          <p className="text-muted-foreground">
            Manage CMS connections and publishing queue
          </p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 hidden md:grid">
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Publishing functionality is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This section will include CMS connections, publishing queue, and publishing history.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Publishing overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Published</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In Queue</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Drafts</span>
                <span className="text-sm font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="grid gap-4 md:hidden">
        <MobileCard
          title="Coming Soon"
          subtitle="Publishing functionality"
          description="This section will include CMS connections, publishing queue, and publishing history."
          badge="Soon"
          testId="mobile-coming-soon-card"
        >
          <p className="text-sm text-muted-foreground">
            Publishing functionality is currently under development
          </p>
        </MobileCard>
        
        <MobileCard
          title="Quick Stats"
          subtitle="Publishing overview"
          badge="0"
          testId="mobile-stats-card"
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Published</span>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">In Queue</span>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Drafts</span>
              <span className="text-sm font-medium">0</span>
            </div>
          </div>
        </MobileCard>
      </div>
    </div>
  )
}

