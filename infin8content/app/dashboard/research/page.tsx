import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, TrendingUp, BarChart3 } from "lucide-react"

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research</h1>
        <p className="text-muted-foreground">
          Keyword research, competitor analysis, and SERP insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Keyword Research - Available */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle>Keyword Research</CardTitle>
            </div>
            <CardDescription>
              Research keywords with search volume, difficulty, and trend data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/research/keywords">
                Start Research
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Competitor Analysis - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Competitor Analysis</CardTitle>
            </div>
            <CardDescription>
              Analyze competitor content and keyword strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* SERP Analysis - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>SERP Analysis</CardTitle>
            </div>
            <CardDescription>
              Analyze search engine results pages for insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

