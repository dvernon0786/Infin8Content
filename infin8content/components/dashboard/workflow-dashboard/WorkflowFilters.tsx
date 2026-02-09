'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ChevronDown } from 'lucide-react'

interface WorkflowFiltersProps {
  statuses: string[]
  selectedStatus: string | null
  onStatusChange: (status: string | null) => void
  creators?: string[]
  selectedCreator?: string | null
  onCreatorChange?: (creator: string | null) => void
  selectedDateRange?: string | null
  onDateRangeChange?: (range: string | null) => void
}

/**
 * Workflow Filters Component
 * Provides filtering controls for workflow status, date range, and creator
 */
export function WorkflowFilters({
  statuses,
  selectedStatus,
  onStatusChange,
  creators = [],
  selectedCreator,
  onCreatorChange,
  selectedDateRange,
  onDateRangeChange,
}: WorkflowFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('status')

  const formatStatus = (status: string) => {
    return status.replace('step_', 'Step ').replace(/_/g, ' ')
  }

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'all_time', label: 'All Time' },
  ]

  const hasActiveFilters = selectedStatus || selectedCreator || selectedDateRange

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onStatusChange(null)
              onCreatorChange?.(null)
              onDateRangeChange?.(null)
            }}
            className="h-auto p-0 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'status' ? null : 'status')
          }
          className="flex items-center justify-between w-full text-sm font-medium hover:text-primary"
        >
          <span>Status</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSection === 'status' ? 'rotate-180' : ''
            }`}
          />
        </button>
        {expandedSection === 'status' && (
          <div className="flex flex-wrap gap-2 pl-2">
            {statuses.map(status => (
              <Badge
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() =>
                  onStatusChange(selectedStatus === status ? null : status)
                }
              >
                {formatStatus(status)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      {onDateRangeChange && (
        <div className="space-y-2">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'date' ? null : 'date')
            }
            className="flex items-center justify-between w-full text-sm font-medium hover:text-primary"
          >
            <span>Date Range</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'date' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'date' && (
            <div className="flex flex-wrap gap-2 pl-2">
              {dateRanges.map(range => (
                <Badge
                  key={range.value}
                  variant={selectedDateRange === range.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    onDateRangeChange(
                      selectedDateRange === range.value ? null : range.value
                    )
                  }
                >
                  {range.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Creator Filter */}
      {onCreatorChange && creators.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'creator' ? null : 'creator')
            }
            className="flex items-center justify-between w-full text-sm font-medium hover:text-primary"
          >
            <span>Created By</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSection === 'creator' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'creator' && (
            <div className="flex flex-wrap gap-2 pl-2">
              {creators.map(creator => (
                <Badge
                  key={creator}
                  variant={selectedCreator === creator ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    onCreatorChange(selectedCreator === creator ? null : creator)
                  }
                >
                  {creator}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
