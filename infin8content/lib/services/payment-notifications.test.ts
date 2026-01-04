/**
 * Payment Notifications Service Tests
 * 
 * Unit tests for payment notification email functions
 * Story 1.8: Payment-First Access Control (Paywall Implementation)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendPaymentFailureEmail, sendPaymentReactivationEmail } from './payment-notifications'
import * as brevo from '@getbrevo/brevo'

// Mock Brevo module
const mockSendTransacEmail = vi.fn()
const mockSetApiKey = vi.fn()

vi.mock('@getbrevo/brevo', () => {
  const mockTransactionalEmailsApi = vi.fn(() => ({
    sendTransacEmail: mockSendTransacEmail,
    setApiKey: mockSetApiKey,
  }))
  
  return {
    default: {},
    TransactionalEmailsApi: mockTransactionalEmailsApi,
    TransactionalEmailsApiApiKeys: {
      apiKey: 'apiKey',
    },
    SendSmtpEmail: vi.fn(),
  }
})

describe('sendPaymentFailureEmail', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      BREVO_API_KEY: 'test-api-key',
      BREVO_SENDER_EMAIL: 'test@example.com',
      BREVO_SENDER_NAME: 'Test Sender',
      NEXT_PUBLIC_APP_URL: 'https://app.test.com',
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('should send payment failure email successfully', async () => {
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentFailureEmail({
      to: 'user@example.com',
      userName: 'Test User',
      gracePeriodDays: 7,
    })

    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1)
    const callArgs = mockSendTransacEmail.mock.calls[0][0]
    
    expect(callArgs.subject).toBe('Payment Failed - Action Required')
    expect(callArgs.to).toEqual([{ email: 'user@example.com', name: 'Test User' }])
    expect(callArgs.htmlContent).toContain('Payment Failed - Action Required')
    expect(callArgs.htmlContent).toContain('7-day grace period')
    expect(callArgs.htmlContent).toContain('Update Payment Method')
    expect(callArgs.textContent).toContain('Payment Failed - Action Required')
  })

  it('should send email without userName when not provided', async () => {
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentFailureEmail({
      to: 'user@example.com',
      gracePeriodDays: 7,
    })

    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1)
    const callArgs = mockSendTransacEmail.mock.calls[0][0]
    
    expect(callArgs.to).toEqual([{ email: 'user@example.com', name: 'user@example.com' }])
    expect(callArgs.htmlContent).toContain('Hello,')
    expect(callArgs.htmlContent).not.toContain('Hello Test User,')
  })

  it('should use custom grace period days', async () => {
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentFailureEmail({
      to: 'user@example.com',
      gracePeriodDays: 14,
    })

    const callArgs = mockSendTransacEmail.mock.calls[0][0]
    expect(callArgs.htmlContent).toContain('14-day grace period')
    expect(callArgs.htmlContent).toContain('14 days')
  })

  it('should throw error when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY

    await expect(
      sendPaymentFailureEmail({
        to: 'user@example.com',
        gracePeriodDays: 7,
      })
    ).rejects.toThrow('BREVO_API_KEY environment variable is not set')
  })

  it('should throw user-friendly error when email sending fails', async () => {
    const error = new Error('API Error')
    mockApiInstance.sendTransacEmail.mockRejectedValueOnce(error)

    await expect(
      sendPaymentFailureEmail({
        to: 'user@example.com',
        gracePeriodDays: 7,
      })
    ).rejects.toThrow('Failed to send payment failure notification. Please try again.')
  })

  it('should use default sender email and name when not set', async () => {
    delete process.env.BREVO_SENDER_EMAIL
    delete process.env.BREVO_SENDER_NAME
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentFailureEmail({
      to: 'user@example.com',
      gracePeriodDays: 7,
    })

    const callArgs = mockSendTransacEmail.mock.calls[0][0]
    expect(callArgs.sender.email).toBe('noreply@infin8content.com')
    expect(callArgs.sender.name).toBe('Infin8Content')
  })
})

describe('sendPaymentReactivationEmail', () => {
  const originalEnv = process.env
  let mockApiInstance: any
  let mockSendTransacEmail: any

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...originalEnv,
      BREVO_API_KEY: 'test-api-key',
      BREVO_SENDER_EMAIL: 'test@example.com',
      BREVO_SENDER_NAME: 'Test Sender',
      NEXT_PUBLIC_APP_URL: 'https://app.test.com',
    }

    // Get mock instance and reset the mock function
    const brevoModule = require('@getbrevo/brevo')
    mockApiInstance = new brevoModule.TransactionalEmailsApi()
    mockSendTransacEmail = mockApiInstance.sendTransacEmail
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('should send reactivation email successfully', async () => {
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentReactivationEmail({
      to: 'user@example.com',
      userName: 'Test User',
    })

    expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1)
    const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
    
    expect(callArgs.subject).toBe('Account Reactivated - Payment Confirmed')
    expect(callArgs.to).toEqual([{ email: 'user@example.com', name: 'Test User' }])
    expect(callArgs.htmlContent).toContain('Account Reactivated - Payment Confirmed')
    expect(callArgs.htmlContent).toContain('Your account is now active')
    expect(callArgs.htmlContent).toContain('Go to Dashboard')
    expect(callArgs.textContent).toContain('Account Reactivated - Payment Confirmed')
  })

  it('should send email without userName when not provided', async () => {
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentReactivationEmail({
      to: 'user@example.com',
    })

    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1)
    const callArgs = mockSendTransacEmail.mock.calls[0][0]
    
    expect(callArgs.to).toEqual([{ email: 'user@example.com', name: 'user@example.com' }])
    expect(callArgs.htmlContent).toContain('Hello,')
  })

  it('should throw error when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY

    await expect(
      sendPaymentReactivationEmail({
        to: 'user@example.com',
      })
    ).rejects.toThrow('BREVO_API_KEY environment variable is not set')
  })

  it('should throw user-friendly error when email sending fails', async () => {
    const error = new Error('API Error')
    mockApiInstance.sendTransacEmail.mockRejectedValueOnce(error)

    await expect(
      sendPaymentReactivationEmail({
        to: 'user@example.com',
      })
    ).rejects.toThrow('Failed to send reactivation notification. Please try again.')
  })

  it('should use default sender email and name when not set', async () => {
    delete process.env.BREVO_SENDER_EMAIL
    delete process.env.BREVO_SENDER_NAME
    mockSendTransacEmail.mockResolvedValueOnce({})

    await sendPaymentReactivationEmail({
      to: 'user@example.com',
    })

    const callArgs = mockSendTransacEmail.mock.calls[0][0]
    expect(callArgs.sender.email).toBe('noreply@infin8content.com')
    expect(callArgs.sender.name).toBe('Infin8Content')
  })
})

