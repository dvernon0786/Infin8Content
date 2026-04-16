// Epic 12: Story 12-7 — Onboarding Email Sequence (Inngest function)
// Triggered by event 'onboarding/payment-confirmed'.
// Sends: welcome (instant) → day-3 tips → day-7 success check-in.

import { inngest } from '@/lib/inngest/client'
import {
  sendWelcomeEmail,
  sendDay3TipsEmail,
  sendDay7SuccessEmail,
} from '@/lib/services/onboarding/onboarding-emails'

export const onboardingEmailSequence = inngest.createFunction(
  {
    id: 'onboarding/email-sequence',
    concurrency: { limit: 10 },
  },
  { event: 'onboarding/payment-confirmed' },
  async ({ event, step }) => {
    const { email, userName } = event.data as {
      email: string
      userName: string
    }

    // Email 1: Welcome — sent immediately
    await step.run('send-welcome-email', async () => {
      await sendWelcomeEmail({ to: email, userName })
    })

    // Email 2: Tips — sent 3 days later
    await step.sleep('wait-3-days', '3 days')
    await step.run('send-day3-tips-email', async () => {
      await sendDay3TipsEmail({ to: email, userName })
    })

    // Email 3: Success check-in — sent 7 days after payment
    await step.sleep('wait-4-more-days', '4 days')
    await step.run('send-day7-success-email', async () => {
      await sendDay7SuccessEmail({ to: email, userName })
    })

    return { ok: true, email }
  }
)
