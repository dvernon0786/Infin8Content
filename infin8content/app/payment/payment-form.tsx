'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type PlanType = 'trial' | 'starter' | 'pro' | 'agency'
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
  trial: {
    articles: '1 (One-Time)',
    keywordResearches: '5 (One-Time)',
    cmsConnections: '0',
    projects: '1',
    stores: '0',
    productsTracked: '0',
    teamMembers: '1',
    imageStorage: 'None',
    apiCalls: 'None',
    revenueAttribution: false,
    whiteLabel: false,
    customDomain: false,
    clientPortal: false,
    supportSLA: 'Community',
    uptimeSLA: 'Standard',
  },
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
  trial: { monthly: 1, annual: 1 },
  starter: { monthly: 49, annual: 41.5 },
  pro: { monthly: 220, annual: 175 },
  agency: { monthly: 399, annual: 299 },
}

interface PaymentFormProps {
  isSuspended?: boolean
  suspendedAt?: string | null
  redirectTo?: string
  hasUsedTrial?: boolean
}

export default function PaymentForm({
  isSuspended: isSuspendedProp,
  suspendedAt,
  redirectTo = '/dashboard',
  hasUsedTrial = false
}: PaymentFormProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const availablePlans = hasUsedTrial
    ? (['starter', 'pro', 'agency'] as PlanType[])
    : (['trial', 'starter', 'pro', 'agency'] as PlanType[])
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(hasUsedTrial ? 'starter' : 'trial')
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('annual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan)
    // Clear URL error params when user starts fresh
    if (searchParams.toString()) {
      router.replace(pathname)
    }
  }

  // Check for error from canceled payment or payment failure
  const canceled = searchParams.get('canceled') === 'true'
  const paymentError = searchParams.get('error')
  const suspended = isSuspendedProp || searchParams.get('suspended') === 'true'

  // Format suspension date if available
  const formattedSuspensionDate = suspendedAt
    ? new Date(suspendedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null

  // Get error message based on error type
  const getErrorMessage = () => {
    if (suspended) {
      return {
        title: 'Account Suspended - Payment Required',
        message: formattedSuspensionDate
          ? `Your account has been suspended due to payment failure. Your account was suspended on ${formattedSuspensionDate}. Please update your payment method to reactivate your account and regain access to all features.`
          : 'Your account has been suspended due to payment failure. Please update your payment method to reactivate your account. You can retry payment using the form below.',
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

    const effectiveBillingFrequency = selectedPlan === 'trial' ? 'monthly' : billingFrequency

    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingFrequency: effectiveBillingFrequency,
          redirect: redirectTo,
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

  return (
    <div className="min-h-screen bg-mkt-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-mkt-white mb-2">Choose Your Plan</h1>
          <p className="text-lg text-mkt-muted">Select a subscription plan to get started</p>
        </div>

        {/* Billing Frequency Toggle */}
        <div className="max-w-3xl mx-auto mb-8 flex justify-center">
          <div className="inline-flex rounded-lg p-1 gap-1" role="group" style={{ background: 'var(--mkt-surface2)', border: '1px solid var(--mkt-border)' }}>
            <button
              type="button"
              onClick={() => setBillingFrequency('monthly')}
              style={billingFrequency === 'monthly' ? {
                background: 'var(--mkt-accent)',
                color: 'white',
                boxShadow: '0 0 20px rgba(79, 110, 247, 0.3)'
              } : {
                background: 'transparent',
                color: 'var(--mkt-muted)'
              }}
              className="px-6 py-2 text-sm font-medium rounded-md transition-all hover:text-mkt-white"
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingFrequency('annual')}
              style={billingFrequency === 'annual' ? {
                background: 'var(--mkt-accent)',
                color: 'white',
                boxShadow: '0 0 20px rgba(79, 110, 247, 0.3)'
              } : {
                background: 'transparent',
                color: 'var(--mkt-muted)'
              }}
              className="px-6 py-2 text-sm font-medium rounded-md transition-all hover:text-mkt-white"
            >
              Annual
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-12">
          {availablePlans.map((plan) => {
            const price = planPrices[plan][billingFrequency]
            const isSelected = selectedPlan === plan
            const features = planFeatures[plan]
            const cardSavings = planPrices[plan].monthly - planPrices[plan].annual

            return (
              <div
                key={plan}
                className={`relative rounded-lg border p-6 transition-all cursor-pointer ${isSelected
                  ? 'border-mkt-accent-border bg-mkt-surface2 shadow-lg'
                  : 'border-mkt-border bg-mkt-surface hover:border-mkt-accent-border'
                  }`}
                onClick={() => handlePlanSelect(plan)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handlePlanSelect(plan)
                  }
                }}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: 'var(--mkt-accent)' }}>
                      Selected
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-mkt-white mb-2 capitalize">{plan}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-mkt-white">${price}</span>
                  {plan === 'trial' ? (
                    <span className="text-mkt-muted">/one-time</span>
                  ) : (
                    <span className="text-mkt-muted">/month</span>
                  )}
                  {billingFrequency === 'annual' && plan !== 'trial' && (
                    <p className="text-sm text-mkt-muted2 mt-1">
                      Billed annually (save ${cardSavings}/month)
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 text-sm text-mkt-muted">
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
        <div className="max-w-6xl mx-auto mb-12">
          <div className="mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '600', color: 'var(--mkt-white)' }}>
              Compare Plans in Full
            </h2>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '20px', border: '1px solid rgba(255,255,255,.07)', boxShadow: '0 4px 24px rgba(0,0,0,.3)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--mkt-surface2)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--mkt-muted)', textAlign: 'left', whiteSpace: 'nowrap', width: '40%' }}>
                    Feature
                  </th>
                  {availablePlans.map((plan) => (
                    <th
                      key={plan}
                      style={{
                        padding: '16px',
                        fontWeight: '600',
                        color: 'var(--mkt-muted)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {plan === 'trial' ? '$1 Trial' : plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
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
                  <tr
                    key={row.key}
                    style={{
                      background: 'var(--mkt-surface)',
                      borderBottom: '1px solid rgba(255,255,255,.04)',
                      transition: 'background .15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--mkt-surface2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--mkt-surface)' }}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--mkt-white)', textAlign: 'left', fontWeight: '500' }}>
                      {row.label}
                    </td>
                    {availablePlans.map((plan) => {
                      const value = planFeatures[plan][row.key as keyof PlanFeatures]
                      return (
                        <td
                          key={plan}
                          style={{
                            padding: '12px 16px',
                            color: 'var(--mkt-muted)',
                            textAlign: 'center'
                          }}
                        >
                          {row.boolean ? (
                            <span style={{ color: value ? '#3b82f6' : 'var(--mkt-muted2)', fontSize: '16px', fontWeight: '700' }}>
                              {value ? '✓' : '—'}
                            </span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Display */}
        {(errorInfo || error) && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className={`rounded-lg p-4 border ${errorInfo?.type === 'warning'
              ? 'bg-mkt-accent-lite border-mkt-accent-border'
              : 'bg-mkt-red bg-opacity-10 border-mkt-red border-opacity-30'
              }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {errorInfo?.type === 'warning' ? (
                    <svg className="h-5 w-5 text-mkt-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-mkt-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className={`text-sm font-medium ${errorInfo?.type === 'warning' ? 'text-mkt-accent' : 'text-mkt-red'
                    }`}>
                    {errorInfo?.title || 'Error'}
                  </h3>
                  <div className={`mt-2 text-sm ${errorInfo?.type === 'warning' ? 'text-mkt-accent' : 'text-mkt-red'
                    }`}>
                    <p>{errorInfo?.message || error}</p>
                  </div>
                  {(errorInfo || error) && (
                    <div className="mt-4">
                      <button
                        onClick={handleSubscribe}
                        disabled={isSubmitting}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-all ${errorInfo?.type === 'warning'
                          ? 'bg-mkt-accent text-white hover:opacity-90'
                          : 'bg-mkt-red text-white hover:opacity-90'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
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
        {!(errorInfo || error) && (
          <div className="max-w-3xl mx-auto text-center">
            <button
              onClick={handleSubscribe}
              disabled={isSubmitting}
              style={{
                background: 'var(--mkt-accent)',
                color: 'white',
                boxShadow: '0 0 20px rgba(79, 110, 247, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--mkt-accent-hover)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(79, 110, 247, 0.5)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--mkt-accent)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(79, 110, 247, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-base font-medium border-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : `Subscribe to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

