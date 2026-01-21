import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, TrendingUp, BarChart3 } from "lucide-react"

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-poppins text-neutral-900 text-h2-desktop">Research</h1>
        <p className="font-lato text-neutral-600 text-body">
          Keyword research, competitor analysis, and SERP insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Keyword Research - Available */}
        <Card className="border-2 border-[--brand-electric-blue]/20 hover:border-[--brand-electric-blue]/40 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-[--brand-electric-blue]" />
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">Keyword Research</CardTitle>
            </div>
            <CardDescription className="font-lato text-neutral-600 text-body">
              Research keywords with search volume, difficulty, and trend data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              asChild 
              className="w-full bg-primary-blue text-white font-lato hover:bg-primary-blue/90"
            >
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
              <TrendingUp className="h-5 w-5 text-neutral-500" />
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">Competitor Analysis</CardTitle>
            </div>
            <CardDescription className="font-lato text-neutral-600 text-body">
              Analyze competitor content and keyword strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              disabled 
              variant="outline" 
              className="w-full font-lato text-neutral-600 border-neutral-200"
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* SERP Analysis - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-neutral-500" />
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">SERP Analysis</CardTitle>
            </div>
            <CardDescription className="font-lato text-neutral-600 text-body">
              Analyze search engine results pages for insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              disabled 
              variant="outline" 
              className="w-full font-lato text-neutral-600 border-neutral-200"
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

