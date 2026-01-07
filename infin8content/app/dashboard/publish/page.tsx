import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PublishPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publish</h1>
        <p className="text-muted-foreground">
          Manage CMS connections and publishing queue
        </p>
      </div>

      <Card>
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
    </div>
  )
}

