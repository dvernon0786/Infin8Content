/**
 * Integration Test for Generation Progress Components
 * Story 22.1: Generation Progress Visualization
 * 
 * Tests that all components work together and can handle real data
 */

'use client';

import React from 'react';
import { GenerationProgress } from './generation-progress';

// Mock data for testing
const mockProps = {
  articleId: 'test-article-123',
  orgId: 'test-org-456',
  status: 'generating' as const,
  overallProgress: 65,
  parallelSections: [
    {
      sectionId: 'intro',
      sectionType: 'introduction' as const,
      status: 'completed' as const,
      progress: 100,
      startTime: new Date(Date.now() - 60000).toISOString(),
      wordCount: 150
    },
    {
      sectionId: 'h2-1',
      sectionType: 'h2' as const,
      status: 'processing' as const,
      progress: 75,
      startTime: new Date(Date.now() - 30000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 15000).toISOString()
    },
    {
      sectionId: 'h2-2',
      sectionType: 'h2' as const,
      status: 'processing' as const,
      progress: 45,
      startTime: new Date(Date.now() - 20000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 25000).toISOString()
    },
    {
      sectionId: 'h3-1',
      sectionType: 'h3' as const,
      status: 'pending' as const,
      progress: 0,
      startTime: new Date().toISOString()
    }
  ],
  performanceMetrics: {
    researchApiCalls: 2,
    cacheHitRate: 85,
    retryAttempts: 1,
    totalApiCalls: 3,
    estimatedTimeRemaining: 120,
    costSavings: 85,
    timeSavings: 65
  },
  researchPhase: {
    status: 'completed' as const,
    apiCallsMade: 2,
    estimatedTotalCalls: 2,
    cacheHitRate: 85,
    keywords: ['test', 'content', 'generation'],
    sourcesFound: 12
  },
  contextManagement: {
    tokensUsed: 1800,
    tokenLimit: 2000,
    cacheHits: 15,
    sectionsSummarized: 2,
    optimizationRate: 85
  },
  estimatedCompletion: new Date(Date.now() + 120000).toISOString()
};

export function TestGenerationProgress() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Generation Progress Test</h1>
      
      {/* Desktop Version */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Desktop Version</h2>
        <GenerationProgress {...mockProps} />
      </div>
      
      {/* Mobile Version */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mobile Version</h2>
        <GenerationProgress {...mockProps} mobileOptimized={true} />
      </div>
      
      {/* Completed State */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Completed State</h2>
        <GenerationProgress 
          {...mockProps} 
          status="completed" 
          overallProgress={100}
        />
      </div>
    </div>
  );
}

export default TestGenerationProgress;
