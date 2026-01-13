/**
 * Research Metrics Card Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 3: Research Optimization Metrics
 * 
 * Displays Tavily API call tracking, research cache effectiveness,
 * cost optimization metrics, and research performance trends.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  DollarSign, 
  Database, 
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResearchMetrics {
  tavilyApiCallsPerArticle: number;
  researchCacheHitRate: number;
  costSavingsPerArticle: number;
  researchTimeReduction: number;
}

interface ResearchMetricsCardProps {
  metrics: ResearchMetrics;
  className?: string;
}

export function ResearchMetricsCard({ metrics, className = '' }: ResearchMetricsCardProps) {
  const hasExcellentApiReduction = metrics.tavilyApiCallsPerArticle <= 2; // Epic 20 target: 1-2 calls
  const hasHighCacheHitRate = metrics.researchCacheHitRate >= 80;
  const hasExcellentCostSavings = metrics.costSavingsPerArticle >= 70; // Epic 20 target: 85%
  const hasExcellentTimeReduction = metrics.researchTimeReduction >= 50;

  return (
    <Card className={cn(
      'transition-all duration-300',
      hasExcellentApiReduction && hasExcellentCostSavings && 'border-green-200 bg-green-50/30',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Search className="h-4 w-4 text-purple-600" />
          Research Optimization
          <Badge variant="outline" className="text-xs">
            Tavily API
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Tavily API Calls Per Article */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">API Calls Per Article</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.tavilyApiCallsPerArticle.toFixed(1)}</span>
              {hasExcellentApiReduction && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Optimized
                </Badge>
              )}
              {metrics.tavilyApiCallsPerArticle > 5 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (metrics.tavilyApiCallsPerArticle * 10))} // Inverse: lower calls = better
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 1-2 calls (Epic 20 achieved 85% reduction)
          </div>
        </div>

        {/* Research Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cache Hit Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.researchCacheHitRate.toFixed(1)}%</span>
              {hasHighCacheHitRate && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Target className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.researchCacheHitRate} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Higher cache hit rate reduces API costs
          </div>
        </div>

        {/* Cost Savings Per Article */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cost Savings</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.costSavingsPerArticle.toFixed(1)}%</span>
              {hasExcellentCostSavings && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.costSavingsPerArticle} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 85% reduction (Epic 20 achieved)
          </div>
        </div>

        {/* Research Time Reduction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Research Time Reduction</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.researchTimeReduction.toFixed(1)}%</span>
              {hasExcellentTimeReduction && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.researchTimeReduction} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Estimated time savings from optimization
          </div>
        </div>

        {/* Research Efficiency Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
          <div className="space-y-1">
            <div className="text-gray-600">Research Efficiency</div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-600" />
              <span className="font-medium">
                {hasExcellentApiReduction && hasHighCacheHitRate ? 'Excellent' : 
                 hasExcellentApiReduction || hasHighCacheHitRate ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Optimization Status</div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {hasExcellentCostSavings ? 'Optimized' : 'Improving'}
              </span>
            </div>
          </div>
        </div>

        {/* Epic 20 Research Success Notice */}
        {hasExcellentApiReduction && hasExcellentCostSavings && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Epic 20 Research Optimization Achieved</div>
                <div className="text-xs text-green-700 mt-1">
                  ✓ {metrics.tavilyApiCallsPerArticle.toFixed(1)} API calls per article (target: 1-2)
                  <br />
                  ✓ {metrics.costSavingsPerArticle.toFixed(0)}% cost reduction (target: 85%)
                  <br />
                  ✓ {metrics.researchCacheHitRate.toFixed(0)}% cache hit rate
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Research Optimization Suggestions */}
        {!hasExcellentApiReduction && (
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <div className="font-medium">Research Optimization Available</div>
                <div className="text-xs text-orange-700 mt-1">
                  {metrics.tavilyApiCallsPerArticle > 2 && `• API calls could be reduced (${metrics.tavilyApiCallsPerArticle.toFixed(1)} vs 1-2 target)`}
                  {metrics.researchCacheHitRate < 80 && `• Cache hit rate could be improved (${metrics.researchCacheHitRate.toFixed(0)}% vs 80% target)`}
                  {metrics.costSavingsPerArticle < 70 && `• Cost savings could be increased (${metrics.costSavingsPerArticle.toFixed(0)}% vs 85% target)`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResearchMetricsCard;
