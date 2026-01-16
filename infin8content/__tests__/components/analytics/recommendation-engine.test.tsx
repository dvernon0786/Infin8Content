/**
 * Recommendation Engine Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 3.2: Create recommendation engine based on metrics
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RecommendationEngine } from '@/components/analytics/recommendation-engine'

// Mock the recommendation engine API
global.fetch = vi.fn()

describe('RecommendationEngine', () => {
  const mockRecommendations = {
    recommendations: [
      {
        id: '1',
        priority: 'high',
        category: 'performance',
        title: 'Optimize dashboard loading time',
        description: 'Dashboard load time is 45% above target, impacting user experience',
        action: 'Implement lazy loading and optimize database queries',
        impact: 'high',
        effort: 'medium',
        expectedImprovement: '30% reduction in load time',
        metrics: ['dashboard_load_time'],
        confidence: 0.92
      },
      {
        id: '2',
        priority: 'medium',
        category: 'ux',
        title: 'Improve collaboration adoption',
        description: 'Collaboration features are underutilized at 65% adoption rate',
        action: 'Increase visibility of collaboration features and add onboarding tutorials',
        impact: 'medium',
        effort: 'low',
        expectedImprovement: '15% increase in adoption',
        metrics: ['collaboration_adoption'],
        confidence: 0.78
      },
      {
        id: '3',
        priority: 'low',
        category: 'maintenance',
        title: 'Monitor trust score trends',
        description: 'Trust score is stable but could be improved with user feedback',
        action: 'Implement user satisfaction surveys and feedback loops',
        impact: 'low',
        effort: 'low',
        expectedImprovement: '5% increase in trust score',
        metrics: ['trust_score'],
        confidence: 0.65
      }
    ],
    insights: [
      {
        type: 'opportunity',
        message: 'Performance improvements could increase user satisfaction by 25%',
        relatedRecommendations: ['1']
      },
      {
        type: 'warning',
        message: 'Collaboration adoption is trending downward',
        relatedRecommendations: ['2']
      }
    ],
    summary: {
      totalRecommendations: 3,
      highPriority: 1,
      mediumPriority: 1,
      lowPriority: 1,
      categories: {
        performance: 1,
        ux: 1,
        maintenance: 1
      },
      avgConfidence: 0.78
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockRecommendations
    } as Response)
  })

  it('renders recommendation engine component', () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    expect(screen.getByText('Recommendation Engine')).toBeInTheDocument()
    expect(screen.getByText('AI-powered insights and actionable recommendations')).toBeInTheDocument()
  })

  it('displays generated recommendations', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Optimize dashboard loading time')).toBeInTheDocument()
    expect(screen.getByText('Improve collaboration adoption')).toBeInTheDocument()
    expect(screen.getByText('Monitor trust score trends')).toBeInTheDocument()
  })

  it('shows recommendation priorities and categories', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
    expect(screen.getByText('PERFORMANCE')).toBeInTheDocument()
    expect(screen.getByText('UX')).toBeInTheDocument()
    expect(screen.getByText('MAINTENANCE')).toBeInTheDocument()
  })

  it('displays recommendation details with confidence scores', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('92% confidence')).toBeInTheDocument()
    expect(screen.getByText('78% confidence')).toBeInTheDocument()
    expect(screen.getByText('65% confidence')).toBeInTheDocument()
  })

  it('shows expected improvements and impact levels', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('30% reduction in load time')).toBeInTheDocument()
    expect(screen.getByText('15% increase in adoption')).toBeInTheDocument()
    expect(screen.getByText('5% increase in trust score')).toBeInTheDocument()
    expect(screen.getByText('HIGH IMPACT')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM IMPACT')).toBeInTheDocument()
  })

  it('displays effort estimates', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('MEDIUM EFFORT')).toBeInTheDocument()
    expect(screen.getByText('LOW EFFORT')).toBeInTheDocument()
  })

  it('shows actionable recommendations with specific steps', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Implement lazy loading and optimize database queries')).toBeInTheDocument()
    expect(screen.getByText('Increase visibility of collaboration features')).toBeInTheDocument()
    expect(screen.getByText('Implement user satisfaction surveys')).toBeInTheDocument()
  })

  it('displays recommendation insights and opportunities', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Key Insights')).toBeInTheDocument()
    expect(screen.getByText('Performance improvements could increase user satisfaction by 25%')).toBeInTheDocument()
    expect(screen.getByText('Collaboration adoption is trending downward')).toBeInTheDocument()
  })

  it('allows filtering recommendations by priority', () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    expect(screen.getByLabelText('Filter by priority')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /filter by priority/i })).toBeInTheDocument()
  })

  it('allows filtering recommendations by category', () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /filter by category/i })).toBeInTheDocument()
  })

  it('shows recommendation summary statistics', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Recommendation Summary')).toBeInTheDocument()
    expect(screen.getByText('3 total recommendations')).toBeInTheDocument()
    expect(screen.getByText('1 high priority')).toBeInTheDocument()
    expect(screen.getByText('1 medium priority')).toBeInTheDocument()
    expect(screen.getByText('1 low priority')).toBeInTheDocument()
  })

  it('displays recommendation tracking and progress', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Implementation Tracking')).toBeInTheDocument()
    expect(screen.getByText('0 implemented')).toBeInTheDocument()
    expect(screen.getByText('3 pending')).toBeInTheDocument()
  })

  it('shows loading state during analysis', () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))
    
    render(<RecommendationEngine orgId="test-org" />)
    
    expect(screen.getByText('Generating recommendations...')).toBeInTheDocument()
    expect(screen.getByTestId('recommendation-loading-skeleton')).toBeInTheDocument()
  })

  it('handles analysis errors gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Analysis failed' })
    } as Response)
    
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Failed to generate recommendations')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('allows manual refresh of recommendations', () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    expect(screen.getByRole('button', { name: /refresh recommendations/i })).toBeInTheDocument()
  })

  it('supports recommendation export', () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    expect(screen.getByRole('button', { name: /export recommendations/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
  })

  it('displays recommendation tracking and progress', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Implementation Tracking')).toBeInTheDocument()
    expect(screen.getByText('0 implemented')).toBeInTheDocument()
    expect(screen.getByText('3 pending')).toBeInTheDocument()
  })

  it('allows marking recommendations as implemented', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByRole('button', { name: /mark as implemented/i })).toBeInTheDocument()
  })

  it('shows recommendation effectiveness tracking', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Effectiveness Tracking')).toBeInTheDocument()
    expect(screen.getByText('No implemented recommendations yet')).toBeInTheDocument()
  })

  it('displays AI confidence and reasoning', async () => {
    render(<RecommendationEngine orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('AI Confidence')).toBeInTheDocument()
    expect(screen.getByText('78%')).toBeInTheDocument()
  })

})
