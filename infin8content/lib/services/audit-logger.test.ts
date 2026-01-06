/**
 * Unit tests for audit logger service
 * Story 1.13: Audit Logging for Compliance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAction, logActionAsync, extractIpAddress, extractUserAgent } from './audit-logger';
import { AuditAction } from '@/types/audit';
import { createClient } from '@/lib/supabase/server';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('Audit Logger Service', () => {
    let mockSupabase: { from: ReturnType<typeof vi.fn> };
    let mockInsert: ReturnType<typeof vi.fn>;
    let mockFrom: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Create mock chain
        mockInsert = vi.fn().mockResolvedValue({ error: null });
        mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
        mockSupabase = { from: mockFrom };

        // Mock createClient to return our mock
        vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

        // Suppress console.error during tests
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('logAction', () => {
        it('should successfully log an audit action', async () => {
            const params = {
                orgId: 'org-123',
                userId: 'user-456',
                action: AuditAction.TEAM_INVITATION_SENT,
                details: { invitedEmail: 'test@example.com', role: 'editor' },
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };

            await logAction(params);

            expect(mockFrom).toHaveBeenCalledWith('audit_logs');
            expect(mockInsert).toHaveBeenCalledWith({
                org_id: 'org-123',
                user_id: 'user-456',
                action: AuditAction.TEAM_INVITATION_SENT,
                details: { invitedEmail: 'test@example.com', role: 'editor' },
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0',
            });
        });

        it('should handle null userId', async () => {
            const params = {
                orgId: 'org-123',
                action: AuditAction.BILLING_PAYMENT_SUCCEEDED,
            };

            await logAction(params);

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: null,
                })
            );
        });

        it('should use empty object for details if not provided', async () => {
            const params = {
                orgId: 'org-123',
                userId: 'user-456',
                action: AuditAction.ROLE_ASSIGNED,
            };

            await logAction(params);

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: {},
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            mockInsert.mockResolvedValue({
                error: { message: 'Database connection failed' },
            });

            const params = {
                orgId: 'org-123',
                userId: 'user-456',
                action: AuditAction.TEAM_MEMBER_REMOVED,
            };

            // Should not throw
            await expect(logAction(params)).resolves.toBeUndefined();

            // Should log error
            expect(console.error).toHaveBeenCalledWith(
                '[Audit Logger] Failed to log action:',
                expect.objectContaining({
                    action: AuditAction.TEAM_MEMBER_REMOVED,
                    orgId: 'org-123',
                    userId: 'user-456',
                })
            );
        });

        it('should handle unexpected errors gracefully', async () => {
            vi.mocked(createClient).mockRejectedValue(new Error('Unexpected error'));

            const params = {
                orgId: 'org-123',
                userId: 'user-456',
                action: AuditAction.DATA_EXPORT_REQUESTED,
            };

            // Should not throw
            await expect(logAction(params)).resolves.toBeUndefined();

            // Should log error
            expect(console.error).toHaveBeenCalledWith(
                '[Audit Logger] Unexpected error:',
                expect.any(Error)
            );
        });
    });

    describe('logActionAsync', () => {
        it('should call logAction without waiting', () => {
            const params = {
                orgId: 'org-123',
                userId: 'user-456',
                action: AuditAction.BILLING_SUBSCRIPTION_CREATED,
            };

            // Should not throw and should return immediately
            expect(() => logActionAsync(params)).not.toThrow();
        });

        it('should suppress errors from logAction', async () => {
            vi.mocked(createClient).mockRejectedValue(new Error('Database error'));

            const params = {
                orgId: 'org-123',
                userId: 'user-456',
                action: AuditAction.BILLING_SUBSCRIPTION_UPDATED,
            };

            // Should not throw
            expect(() => logActionAsync(params)).not.toThrow();

            // Wait a bit for the async operation to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should log error
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('extractIpAddress', () => {
        it('should extract IP from x-forwarded-for header', () => {
            const headers = new Headers({
                'x-forwarded-for': '192.168.1.1, 10.0.0.1',
            });

            expect(extractIpAddress(headers)).toBe('192.168.1.1');
        });

        it('should extract IP from x-real-ip header', () => {
            const headers = new Headers({
                'x-real-ip': '192.168.1.2',
            });

            expect(extractIpAddress(headers)).toBe('192.168.1.2');
        });

        it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
            const headers = new Headers({
                'cf-connecting-ip': '192.168.1.3',
            });

            expect(extractIpAddress(headers)).toBe('192.168.1.3');
        });

        it('should prioritize x-forwarded-for over other headers', () => {
            const headers = new Headers({
                'x-forwarded-for': '192.168.1.1',
                'x-real-ip': '192.168.1.2',
                'cf-connecting-ip': '192.168.1.3',
            });

            expect(extractIpAddress(headers)).toBe('192.168.1.1');
        });

        it('should return null if no IP headers are present', () => {
            const headers = new Headers();

            expect(extractIpAddress(headers)).toBeNull();
        });

        it('should handle multiple IPs in x-forwarded-for', () => {
            const headers = new Headers({
                'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  ,  172.16.0.1  ',
            });

            expect(extractIpAddress(headers)).toBe('192.168.1.1');
        });
    });

    describe('extractUserAgent', () => {
        it('should extract user agent from header', () => {
            const headers = new Headers({
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            });

            expect(extractUserAgent(headers)).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        });

        it('should return null if user agent header is not present', () => {
            const headers = new Headers();

            expect(extractUserAgent(headers)).toBeNull();
        });
    });
});
