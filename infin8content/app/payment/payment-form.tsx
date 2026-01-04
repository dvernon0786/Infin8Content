'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type PlanType = 'starter' | 'pro' | 'agency'
type BillingFrequency = 'monthly' | 'annual'

interface PlanFeatures {
  articles: string
  keywordResearches: string
  cmsConnections: string
  projects: string
  stores: string
  productsTracked: string
  teamMembers: string
  imageStorage: string
  apiCalls: string
  revenueAttribution: boolean
  whiteLabel: boolean
  customDomain: boolean
  clientPortal: boolean
  supportSLA: string
  uptimeSLA: string
}

const planFeatures: Record<PlanType, PlanFeatures> = {
  starter: {
    articles: '10/month',
    keywordResearches: '50/month',
    cmsConnections: '1',
    projects: '1',
    stores: '1',
    productsTracked: '50',
    teamMembers: '1',
    imageStorage: '5 GB',
    apiCalls: '100/month',
    revenueAttribution: false,
    whiteLabel: false,
    customDomain: false,
    clientPortal: false,
    supportSLA: '48h',
    uptimeSLA: '99%',
  },
  pro: {
    articles: '50/month',
    keywordResearches: '500/month',
    cmsConnections: '3',
    projects: '5',
    stores: '3',
    productsTracked: '150',
    teamMembers: '3',
    imageStorage: '25 GB',
    apiCalls: '1,000/month',
    revenueAttribution: true,
    whiteLabel: false,
    customDomain: false,
    clientPortal: false,
    supportSLA: '24h',
    uptimeSLA: '99.5%',
  },
  agency: {
    articles: '150/month',
    keywordResearches: 'Unlimited',
    cmsConnections: 'Unlimited',
    projects: 'Unlimited',
    stores: 'Unlimited',
    productsTracked: 'Unlimited',
    teamMembers: 'Unlimited',
    imageStorage: '100 GB',
    apiCalls: 'Unlimited',
    revenueAttribution: true,
    whiteLabel: true,
    customDomain: true,
    clientPortal: true,
    supportSLA: '4h',
    uptimeSLA: '99.9%',
  },
}

const planPrices: Record<PlanType, { monthly: number; annual: number }> = {
  starter: { monthly: 89, annual: 59 },
  pro: { monthly: 220, annual: 175 },
  agency: { monthly: 399, annual: 299 },
}

export default function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('starter')
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('annual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check for error from canceled payment or payment failure
  const canceled = searchParams.get('canceled') === 'true'
  const paymentError = searchParams.get('error')
  const suspended = searchParams.get('suspended') === 'true'
  
  // Get error message based on error type
  const getErrorMessage = () => {
    if (suspended) {
      return {
        title: 'Account Suspended',
        message: 'Your account has been suspended. Please contact support to resolve this issue.',
        type: 'warning' as const,
      }
    }
    if (paymentError) {
      const errorMessages: Record<string, { title: string; message: string; type: 'error' | 'warning' }> = {
        card_declined: {
          title: 'Card Declined',
          message: 'Your card was declined. Please try a different payment method or contact your bank.',
          type: 'error',
        },
        insufficient_funds: {
          title: 'Insufficient Funds',
          message: 'Your account does not have sufficient funds. Please use a different payment method.',
          type: 'error',
        },
        expired_card: {
          title: 'Expired Card',
          message: 'Your card has expired. Please use a different payment method.',
          type: 'error',
        },
        processing_error: {
          title: 'Processing Error',
          message: 'An error occurred while processing your payment. Please try again.',
          type: 'error',
        },
      }
      return errorMessages[paymentError] || {
        title: 'Payment Error',
        message: 'An error occurred during payment. Please try again or contact support if the issue persists.',
        type: 'error',
      }
    }
    if (canceled) {
      return {
        title: 'Payment Canceled',
        message: 'Your payment was canceled. You can try again when you\'re ready.',
        type: 'warning' as const,
      }
    }
    return null
  }
  
  const errorInfo = getErrorMessage()
  
  const handleSubscribe = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingFrequency,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session')
        return
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Invalid response from server')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const currentPrice = planPrices[selectedPlan][billingFrequency]
  const monthlyPrice = planPrices[selectedPlan].monthly
  const annualPrice = planPrices[selectedPlan].annual
  const annualSavings = monthlyPrice - annualPrice
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">Select a subscription plan to get started</p>
        </div>
        
        {/* Billing Frequency Toggle */}
        <div className="max-w-3xl mx-auto mb-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setBillingFrequency('monthly')}
              className={`px-6 py-3 text-sm font-medium rounded-l-lg border ${
                billingFrequency === 'monthly'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingFrequency('annual')}
              className={`px-6 py-3 text-sm font-medium rounded-r-lg border ${
                billingFrequency === 'annual'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Annual
            </button>
          </div>
        </div>
        
        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {(['starter', 'pro', 'agency'] as PlanType[]).map((plan) => {
            const price = planPrices[plan][billingFrequency]
            const isSelected = selectedPlan === plan
            const features = planFeatures[plan]
            
            return (
              <div
                key={plan}
                className={`relative rounded-lg border-2 p-6 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } cursor-pointer transition-colors`}
                onClick={() => setSelectedPlan(plan)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedPlan(plan)
                  }
                }}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                      Selected
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{plan}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-600">/month</span>
                  {billingFrequency === 'annual' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Billed annually (save ${annualSavings}/month)
                    </p>
                  )}
                </div>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li>{features.articles} articles</li>
                  <li>{features.keywordResearches} keyword researches</li>
                  <li>{features.cmsConnections} CMS connections</li>
                  <li>{features.projects} projects</li>
                  <li>{features.stores} stores</li>
                  <li>{features.productsTracked} products tracked</li>
                  <li>{features.teamMembers} team members</li>
                  <li>{features.imageStorage} image storage</li>
                  <li>{features.apiCalls} API calls</li>
                  {features.revenueAttribution && <li>Revenue attribution</li>}
                  {features.whiteLabel && <li>White-label & custom domain</li>}
                  {features.clientPortal && <li>Client portal</li>}
                  <li>{features.supportSLA} support SLA</li>
                  <li>{features.uptimeSLA} uptime SLA</li>
                </ul>
              </div>
            )
          })}
        </div>
        
        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto mb-12 overflow-x-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Feature Comparison</h2>
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Starter
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pro
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { label: 'Articles/month', key: 'articles' },
                { label: 'Keyword researches/month', key: 'keywordResearches' },
                { label: 'CMS connections', key: 'cmsConnections' },
                { label: 'Projects', key: 'projects' },
                { label: 'Stores (e-commerce)', key: 'stores' },
                { label: 'Products tracked', key: 'productsTracked' },
                { label: 'Team members', key: 'teamMembers' },
                { label: 'Image storage', key: 'imageStorage' },
                { label: 'API calls/month', key: 'apiCalls' },
                { label: 'Revenue attribution', key: 'revenueAttribution', boolean: true },
                { label: 'White-label & custom domain', key: 'whiteLabel', boolean: true },
                { label: 'Client portal', key: 'clientPortal', boolean: true },
                { label: 'Support SLA', key: 'supportSLA' },
                { label: 'Uptime SLA', key: 'uptimeSLA' },
              ].map((row) => (
                <tr key={row.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.label}
                  </td>
                  {(['starter', 'pro', 'agency'] as PlanType[]).map((plan) => {
                    const value = planFeatures[plan][row.key as keyof PlanFeatures]
                    return (
                      <td key={plan} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {row.boolean ? (value ? '✓' : '—') : String(value)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Error Display */}
        {(errorInfo || error) && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className={`rounded-lg p-4 ${
              errorInfo?.type === 'warning' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {errorInfo?.type === 'warning' ? (
                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className={`text-sm font-medium ${
                    errorInfo?.type === 'warning' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {errorInfo?.title || 'Error'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    errorInfo?.type === 'warning' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    <p>{errorInfo?.message || error}</p>
                  </div>
                  {errorInfo && (
                    <div className="mt-4">
                      <button
                        onClick={handleSubscribe}
                        disabled={isSubmitting}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                          errorInfo.type === 'warning'
                            ? 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200'
                            : 'text-red-800 bg-red-100 hover:bg-red-200'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          errorInfo.type === 'warning'
                            ? 'focus:ring-yellow-500'
                            : 'focus:ring-red-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                      >
                        {isSubmitting ? 'Processing...' : 'Retry Payment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscribe Button */}
        <div className="max-w-3xl mx-auto text-center">
          <button
            onClick={handleSubscribe}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Processing...' : `Subscribe to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`}
          </button>
        </div>
      </div>
    </div>
  )
}

