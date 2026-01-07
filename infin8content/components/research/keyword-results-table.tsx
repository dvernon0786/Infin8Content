'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface KeywordResult {
  keyword: string
  searchVolume: number
  keywordDifficulty: number
  trend: number[]
  cpc?: number
  competition: 'Low' | 'Medium' | 'High'
}

interface KeywordResultsTableProps {
  results: KeywordResult[]
  isLoading?: boolean
}

type SortField = 'keyword' | 'searchVolume' | 'keywordDifficulty' | 'cpc' | 'competition'
type SortDirection = 'asc' | 'desc'

export function KeywordResultsTable({ results, isLoading }: KeywordResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('searchVolume')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedResults = useMemo(() => {
    const sorted = [...results].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'keyword':
          comparison = a.keyword.localeCompare(b.keyword)
          break
        case 'searchVolume':
          comparison = a.searchVolume - b.searchVolume
          break
        case 'keywordDifficulty':
          comparison = a.keywordDifficulty - b.keywordDifficulty
          break
        case 'cpc':
          comparison = (a.cpc || 0) - (b.cpc || 0)
          break
        case 'competition':
          const competitionOrder = { Low: 1, Medium: 2, High: 3 }
          comparison = competitionOrder[a.competition] - competitionOrder[b.competition]
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [results, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        <span className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </span>
      </Button>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getCompetitionBadgeVariant = (competition: 'Low' | 'Medium' | 'High') => {
    switch (competition) {
      case 'Low':
        return 'secondary'
      case 'Medium':
        return 'default'
      case 'High':
        return 'destructive'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Research Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">
                  <SortButton field="keyword">Keyword</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="searchVolume">Search Volume</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="keywordDifficulty">Difficulty</SortButton>
                </th>
                <th className="text-left py-3 px-4">Trend</th>
                <th className="text-left py-3 px-4">
                  <SortButton field="cpc">CPC</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton field="competition">Competition</SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{result.keyword}</td>
                  <td className="py-3 px-4">{formatNumber(result.searchVolume)}</td>
                  <td className="py-3 px-4">{result.keywordDifficulty}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                        <svg
                          className="w-full h-full"
                          viewBox={`0 0 ${result.trend.length} 1`}
                          preserveAspectRatio="none"
                        >
                          <polyline
                            points={result.trend
                              .map((value, i) => {
                                const max = Math.max(...result.trend)
                                const min = Math.min(...result.trend)
                                const range = max - min || 1
                                const x = i / (result.trend.length - 1 || 1)
                                const y = 1 - (value - min) / range
                                return `${x},${y}`
                              })
                              .join(' ')}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.1"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.trend.length} months
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {result.cpc ? formatCurrency(result.cpc) : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getCompetitionBadgeVariant(result.competition)}>
                      {result.competition}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

