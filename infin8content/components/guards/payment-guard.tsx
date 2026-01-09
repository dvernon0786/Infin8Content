'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PaymentGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PaymentGuard({ children, fallback }: PaymentGuardProps) {
  const router = useRouter()
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get current user
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get user record
        const { data: userRecord, error: userError } = await (supabase as any)
          .from('users')
          .select('id, org_id, otp_verified')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userRecord || !userRecord.otp_verified) {
          router.push('/verify-email')
          return
        }

        // Check payment status if user has organization
        if (userRecord.org_id) {
          // Use server-side API to check payment status (bypasses RLS)
          const response = await fetch('/api/debug/payment-status')
          
          if (!response.ok) {
            console.error('Failed to check payment status')
            return
          }
          
          const data = await response.json()
          
          if (data.paymentAccessStatus === 'pending_payment') {
            router.push('/payment')
            return
          } else if (data.paymentAccessStatus === 'suspended') {
            router.push('/suspended')
            return
          }
        }
      } catch (error) {
        console.error('Payment guard error:', error)
      }
    }

    checkPaymentStatus()
  }, [router])

  return <>{children}</>
}
