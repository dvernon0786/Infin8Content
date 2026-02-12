'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface Keyword {
  id: string
  seed_keyword: string
  search_volume: number
  cpc?: number
  competition_index?: number
  ai_suggested?: boolean
  user_selected?: boolean
}

interface Props {
  keywords: Keyword[]
}

export function KeywordOpportunityChart({ keywords }: Props) {
  if (!keywords || keywords.length === 0) return null

  const maxVolume = Math.max(...keywords.map(k => k.search_volume || 0))
  const maxCpc = Math.max(...keywords.map(k => k.cpc || 0))

  const normalize = (value: number, max: number) =>
    max === 0 ? 0 : value / max

  const scored = keywords.map(k => {
    const score =
      normalize(k.search_volume, maxVolume) * 0.5 +
      normalize(k.cpc || 0, maxCpc) * 0.3 -
      (k.competition_index || 0) * 0.2

    return {
      ...k,
      opportunity_score: Number(score.toFixed(3))
    }
  })

  const top10 = scored
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, 10)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-sm mb-2">{data.seed_keyword}</p>
          <div className="space-y-1 text-xs">
            <p>Opportunity Score: <span className="text-green-400">{(data.opportunity_score * 100).toFixed(1)}%</span></p>
            <p>Volume: {data.search_volume.toLocaleString()}</p>
            {data.cpc && <p>CPC: ${data.cpc}</p>}
            {data.competition_index && <p>Competition: {data.competition_index}</p>}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Keyword Opportunity Score
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          AI-computed opportunity based on volume, CPC, and competition.
          Higher score = better potential.
        </p>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top10} layout="horizontal" margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
            <XAxis 
              type="number" 
              domain={[0, 1]} 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="seed_keyword"
              width={180}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="opportunity_score"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing top 10 keywords by opportunity score. Score ranges from 0-1, calculated using normalized volume (50%), CPC (30%), and competition penalty (20%).
      </div>
    </div>
  )
}
