/**
 * Team Notifications Service Tests
 * 
 * Unit tests for team invitation email notification functions
 * Tests cover email sending, error handling, and template generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as brevo from '@getbrevo/brevo'
import {
  sendTeamInvitationEmail,
  sendTeamInvitationAcceptedEmail,
  sendRoleChangeEmail,
  sendMemberRemovedEmail,
} from './team-notifications'

// Mock Brevo
vi.mock('@getbrevo/brevo', () => {
  const mockTransactionalEmailsApi = vi.fn()
  mockTransactionalEmailsApi.prototype.sendTransacEmail = vi.fn()
  mockTransactionalEmailsApi.prototype.setApiKey = vi.fn()

  return {
    TransactionalEmailsApi: mockTransactionalEmailsApi,
    TransactionalEmailsApiApiKeys: {
      apiKey: 'api-key',
    },
    SendSmtpEmail: vi.fn(),
  }
})

describe('Team Notifications Service', () => {
  let mockApiInstance: any
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset environment
    process.env = {
      ...originalEnv,
      BREVO_API_KEY: 'test-api-key',
      BREVO_SENDER_EMAIL: 'test@example.com',
      BREVO_SENDER_NAME: 'Test App',
      NEXT_PUBLIC_APP_URL: 'https://test.example.com',
    }

    mockApiInstance = {
      sendTransacEmail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
      setApiKey: vi.fn(),
    }

    // Mock Brevo client
    vi.spyOn(brevo, 'TransactionalEmailsApi').mockImplementation(() => mockApiInstance as any)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('sendTeamInvitationEmail', () => {
    it('should send invitation email with correct parameters', async () => {
      const params = {
        to: 'user@example.com',
        inviterName: 'John Doe',
        organizationName: 'Test Org',
        role: 'editor',
        invitationToken: 'token-123',
      }

      await sendTeamInvitationEmail(params)

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1)
      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      
      expect(callArgs.subject).toContain('invited to join')
      expect(callArgs.subject).toContain('Test Org')
      expect(callArgs.to[0].email).toBe('user@example.com')
      expect(callArgs.htmlContent).toContain('token-123')
      expect(callArgs.htmlContent).toContain('editor')
      expect(callArgs.textContent).toBeDefined()
    })

    it('should include expiration notice in email', async () => {
      await sendTeamInvitationEmail({
        to: 'user@example.com',
        inviterName: 'John',
        organizationName: 'Org',
        role: 'viewer',
        invitationToken: 'token',
      })

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      expect(callArgs.htmlContent).toContain('7 days')
      expect(callArgs.textContent).toContain('7 days')
    })

    it('should handle email sending errors', async () => {
      mockApiInstance.sendTransacEmail.mockRejectedValue(new Error('API Error'))

      await expect(
        sendTeamInvitationEmail({
          to: 'user@example.com',
          inviterName: 'John',
          organizationName: 'Org',
          role: 'editor',
          invitationToken: 'token',
        })
      ).rejects.toThrow('Failed to send team invitation notification')
    })
  })

  describe('sendTeamInvitationAcceptedEmail', () => {
    it('should send acceptance notification to owner', async () => {
      const params = {
        to: 'owner@example.com',
        memberName: 'Jane Doe',
        memberEmail: 'jane@example.com',
        organizationName: 'Test Org',
      }

      await sendTeamInvitationAcceptedEmail(params)

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1)
      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      
      expect(callArgs.subject).toContain('joined')
      expect(callArgs.subject).toContain('Test Org')
      expect(callArgs.to[0].email).toBe('owner@example.com')
      expect(callArgs.htmlContent).toContain('Jane Doe')
      expect(callArgs.htmlContent).toContain('jane@example.com')
    })
  })

  describe('sendRoleChangeEmail', () => {
    it('should send role change notification', async () => {
      const params = {
        to: 'user@example.com',
        memberName: 'John Doe',
        oldRole: 'viewer',
        newRole: 'editor',
        organizationName: 'Test Org',
      }

      await sendRoleChangeEmail(params)

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1)
      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      
      expect(callArgs.subject).toContain('role has been updated')
      expect(callArgs.htmlContent).toContain('viewer')
      expect(callArgs.htmlContent).toContain('editor')
      expect(callArgs.htmlContent).toContain('create, edit, and manage content')
    })

    it('should handle missing member name', async () => {
      await sendRoleChangeEmail({
        to: 'user@example.com',
        memberName: '',
        oldRole: 'editor',
        newRole: 'viewer',
        organizationName: 'Org',
      })

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      expect(callArgs.htmlContent).toContain('Hello,')
    })
  })

  describe('sendMemberRemovedEmail', () => {
    it('should send removal notification', async () => {
      const params = {
        to: 'user@example.com',
        memberName: 'John Doe',
        organizationName: 'Test Org',
      }

      await sendMemberRemovedEmail(params)

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1)
      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      
      expect(callArgs.subject).toContain('removed from')
      expect(callArgs.htmlContent).toContain('Access Revoked')
      expect(callArgs.htmlContent).toContain('Test Org')
    })
  })

  describe('Environment Variable Handling', () => {
    it('should use default values when env vars are not set', async () => {
      delete process.env.BREVO_SENDER_EMAIL
      delete process.env.BREVO_SENDER_NAME
      delete process.env.NEXT_PUBLIC_APP_URL

      await sendTeamInvitationEmail({
        to: 'user@example.com',
        inviterName: 'John',
        organizationName: 'Org',
        role: 'editor',
        invitationToken: 'token',
      })

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0]
      expect(callArgs.sender.email).toBe('noreply@infin8content.com')
      expect(callArgs.sender.name).toBe('Infin8Content')
    })
  })
})

