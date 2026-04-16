'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface PaymentStatusBannerProps {
  paymentStatus: string | null | undefined
  trialEndsAt: string | null | undefined
  planType: string | null | undefined
}

function daysUntil(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function PaymentStatusBanner({
  paymentStatus,
  trialEndsAt,
  planType,
}: PaymentStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Trial — plan_type = 'trial' and payment_status = 'active' means on trial
  if (planType === 'trial' && trialEndsAt) {
    const days = daysUntil(trialEndsAt)
    if (days > 3) return null // Only show when ≤3 days left to avoid noise

    return (
      <Alert className="rounded-none border-x-0 border-t-0 border-amber-200 bg-amber-50 flex items-center gap-3 py-2.5 px-4">
        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
        <AlertDescription className="flex-1 font-lato text-sm text-amber-800">
          Your trial ends in{' '}
          <strong>{days === 0 ? 'less than a day' : `${days} day${days !== 1 ? 's' : ''}`}</strong>.{' '}
          <Link href="/payment" className="underline font-semibold hover:text-amber-900">
            Choose a plan to keep access →
          </Link>
        </AlertDescription>
        <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs shrink-0">
          Trial
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-600 hover:bg-amber-100 shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
        >
          <X className="h-3 w-3" />
        </Button>
      </Alert>
    )
  }

  // Grace period
  if (paymentStatus === 'grace_period') {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 border-red-200 bg-red-50 flex items-center gap-3 py-2.5 px-4">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <AlertDescription className="flex-1 font-lato text-sm text-red-800">
          Your payment failed. You have a short grace period before access is suspended.{' '}
          <Link href="/payment" className="underline font-semibold hover:text-red-900">
            Update billing →
          </Link>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-600 hover:bg-red-100 shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
        >
          <X className="h-3 w-3" />
        </Button>
      </Alert>
    )
  }

  // Active — no banner needed
  return null
}
