'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search, Filter } from 'lucide-react'
import { KeywordOpportunityChart } from './KeywordOpportunityChart'

export interface Keyword {
  id: string
  seed_keyword: string
  search_volume: number
  cpc?: number
  competition_level?: string
  detected_language?: string
  is_foreign_language?: boolean
  main_intent?: string
  is_navigational?: boolean
  foreign_intent?: string[]
  ai_suggested?: boolean
  decision_confidence?: number
  selection_source?: string
  source?: string // competitor URL
}

interface Props {
  keywords: Keyword[]
  onContinue: (selectedIds: string[]) => Promise<void>
  onToggleKeyword: (keywordId: string, selected: boolean) => Promise<void>
  onBulkAction: (action: string, keywordIds?: string[]) => Promise<void>
  loading?: boolean
}

export default function KeywordReviewPage({ 
  keywords, 
  onContinue, 
  onToggleKeyword, 
  onBulkAction,
  loading = false 
}: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>(
    keywords.map(k => k.id) // Default all selected - abundance mindset
  )
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [minVolume, setMinVolume] = useState(0)

  const filtered = useMemo(() => {
    return keywords.filter(keyword => {
      // Search filter
      if (search && !keyword.seed_keyword.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      // Intent filter
      if (intentFilter !== 'all' && keyword.main_intent !== intentFilter) {
        return false
      }

      // Language filter
      if (languageFilter === 'english' && keyword.is_foreign_language) {
        return false
      }
      if (languageFilter === 'foreign' && !keyword.is_foreign_language) {
        return false
      }

      // Volume filter
      if (keyword.search_volume < minVolume) {
        return false
      }

      return true
    })
  }, [keywords, search, intentFilter, languageFilter, minVolume])

  const toggleKeyword = async (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter(i => i !== id)
      : [...selected, id]
    
    setSelected(newSelected)
    await onToggleKeyword(id, newSelected.includes(id))
  }

  const handleBulkAction = async (action: string) => {
    let targetIds: string[] = []

    switch (action) {
      case 'select-all':
        targetIds = filtered.map(k => k.id)
        setSelected([...selected, ...targetIds.filter(id => !selected.includes(id))])
        break
      case 'deselect-all':
        targetIds = filtered.map(k => k.id)
        setSelected(selected.filter(id => !targetIds.includes(id)))
        break
      case 'exclude-navigational':
        targetIds = filtered.filter(k => k.is_navigational).map(k => k.id)
        setSelected(selected.filter(id => !targetIds.includes(id)))
        break
      case 'exclude-foreign':
        targetIds = filtered.filter(k => k.is_foreign_language).map(k => k.id)
        setSelected(selected.filter(id => !targetIds.includes(id)))
        break
      case 'select-by-volume':
        targetIds = filtered
          .filter(k => k.search_volume >= 50)
          .sort((a, b) => b.search_volume - a.search_volume)
          .slice(0, 100)
          .map(k => k.id)
        setSelected([...selected, ...targetIds.filter(id => !selected.includes(id))])
        break
    }

    if (targetIds.length > 0) {
      await onBulkAction(action, targetIds)
    }
  }

  const handleContinue = async () => {
    if (selected.length < 2) return
    await onContinue(selected)
  }

  const IntentBadge = ({ intent }: { intent?: string }) => {
    if (!intent) return null

    const styles: Record<string, string> = {
      commercial: 'bg-green-100 text-green-700',
      informational: 'bg-blue-100 text-blue-700',
      navigational: 'bg-yellow-100 text-yellow-800',
      transactional: 'bg-purple-100 text-purple-700',
    }

    return (
      <Badge className={styles[intent.toLowerCase()] || 'bg-gray-100'}>
        {intent}
      </Badge>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Review Extracted Keywords</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {keywords.length} keywords extracted from competitors. Select the ones to use for clustering.
        </p>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span>{selected.length} selected</span>
          <span>{filtered.length} filtered</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-64">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={intentFilter} 
            onChange={e => setIntentFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Intents</option>
            <option value="commercial">Commercial</option>
            <option value="informational">Informational</option>
            <option value="navigational">Navigational</option>
            <option value="transactional">Transactional</option>
          </select>

          <select 
            value={languageFilter} 
            onChange={e => setLanguageFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Languages</option>
            <option value="english">English Only</option>
            <option value="foreign">Foreign Only</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm">Min Volume:</label>
            <input 
              type="range" 
              min="0" 
              max="2000" 
              step="10"
              value={minVolume}
              onChange={e => setMinVolume(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm w-12">{minVolume}</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleBulkAction('select-all')}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleBulkAction('deselect-all')}>
          Deselect All
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleBulkAction('exclude-navigational')}>
          Exclude Navigational
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleBulkAction('exclude-foreign')}>
          Exclude Foreign
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleBulkAction('select-by-volume')}>
          Top by Volume
        </Button>
      </div>

      {/* Keywords Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 w-10">
                <Checkbox
                  checked={filtered.length > 0 && filtered.every(k => selected.includes(k.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIds = filtered.map(k => k.id)
                      setSelected([...selected, ...allIds.filter(id => !selected.includes(id))])
                    } else {
                      const filteredIds = filtered.map(k => k.id)
                      setSelected(selected.filter(id => !filteredIds.includes(id)))
                    }
                  }}
                />
              </th>
              <th className="p-3">Keyword</th>
              <th className="p-3">Volume</th>
              <th className="p-3">CPC</th>
              <th className="p-3">Intent</th>
              <th className="p-3">Language</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(keyword => (
              <tr key={keyword.id} className="border-t hover:bg-muted/30">
                <td className="p-3">
                  <Checkbox
                    checked={selected.includes(keyword.id)}
                    onCheckedChange={() => toggleKeyword(keyword.id)}
                  />
                </td>
                <td className="p-3 font-medium">
                  {keyword.seed_keyword}
                </td>
                <td className="p-3">
                  {keyword.search_volume.toLocaleString()}
                </td>
                <td className="p-3">
                  {keyword.cpc ? `$${keyword.cpc}` : '-'}
                </td>
                <td className="p-3">
                  <IntentBadge intent={keyword.main_intent} />
                </td>
                <td className="p-3">
                  <Badge variant={keyword.is_foreign_language ? "destructive" : "secondary"}>
                    {keyword.detected_language?.toUpperCase() || 'EN'}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(keyword.decision_confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((keyword.decision_confidence || 0) * 100)}%
                    </span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {keyword.source ? new URL(keyword.source).hostname : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Opportunity Chart */}
      <KeywordOpportunityChart keywords={keywords} />

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {selected.length < 2 
            ? `At least 2 keywords required (${selected.length} selected)`
            : `${selected.length} keywords selected for clustering`
          }
        </div>
        <Button
          disabled={selected.length < 2 || loading}
          onClick={handleContinue}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Clustering ({selected.length})
        </Button>
      </div>
    </div>
  )
}
