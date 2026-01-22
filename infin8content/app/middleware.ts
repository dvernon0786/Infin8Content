import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { validateSupabaseEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getPaymentAccessStatus, checkGracePeriodExpired } from "@/lib/utils/payment-status";
import { sendSuspensionEmail } from "@/lib/services/payment-notifications";

export async function middleware(request: NextRequest) {
  // Add comprehensive logging for debugging paywall issues
  const requestId = Math.random().toString(36).substring(7)
  const timestamp = new Date().toISOString()
  const pathname = request.nextUrl.pathname
  
  console.log(`[MIDDLEWARE-${requestId}] ${timestamp} - === MIDDLEWARE EXECUTING === Processing request: ${pathname}`, {
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    cookies: request.cookies.getAll().map(c => c.name),
    searchParams: request.nextUrl.searchParams.toString()
  })

  // Validate environment variables on every request
  // This ensures env vars are present and fails fast if missing
  try {
    validateSupabaseEnv();
    console.log(`[MIDDLEWARE-${requestId}] Environment validation passed`)
  } catch (error) {
    console.error(`[MIDDLEWARE-${requestId}] Environment validation failed:`, error)
    // If validation fails, return error response
    // This prevents the app from running with missing configuration
    return NextResponse.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message: error instanceof Error ? error.message : "Missing required Supabase environment variables",
          actionableSteps: [
            "Set NEXT_PUBLIC_SUPABASE_URL in your .env.local file",
            "Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file",
            "Set SUPABASE_SERVICE_ROLE_KEY in your .env.local file",
          ],
          retryable: false,
        },
      },
      { status: 500 }
    );
  }

  // Update Supabase session (validates env vars and refreshes session)
  let response = await updateSession(request);

  // Public routes that don't require authentication
  const publicRoutes = ['/register', '/login', '/verify-email'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Inngest webhook endpoint - bypass authentication (Inngest handles its own auth)
  const isInngestWebhook = request.nextUrl.pathname.startsWith('/api/inngest');

  console.log(`[MIDDLEWARE-${requestId}] Route classification:`, {
    pathname,
    isPublicRoute,
    isInngestWebhook
  })

  if (isPublicRoute || isInngestWebhook) {
    console.log(`[MIDDLEWARE-${requestId}] Allowing access to public/webhook route`)
    return response;
  }

  // Payment-related routes that don't require active payment status
  const paymentRoutes = ['/payment', '/create-organization', '/suspended'];
  const isPaymentRoute = paymentRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  console.log(`[MIDDLEWARE-${requestId}] Payment route classification:`, {
    pathname,
    isPaymentRoute
  })

  // Check authentication and OTP verification for protected routes
  // Create Supabase client for middleware (Edge runtime compatible)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  console.log(`[MIDDLEWARE-${requestId}] Authentication check:`, {
    hasUser: !!user,
    hasError: !!error,
    userId: user?.id,
    userEmail: user?.email,
    authError: error?.message
  })

  if (error || !user) {
    console.log(`[MIDDLEWARE-${requestId}] Authentication failed, redirecting to login`)
    // User not authenticated or session expired - redirect to login
    // Supabase automatically handles JWT expiration (24 hours)
    // When getUser() returns null/error, session is expired
    const loginUrl = new URL('/login', request.url);
    // Add expired parameter if session was previously authenticated (indicates expiration)
    // Note: We can't distinguish between "never logged in" vs "expired" without additional state
    // For now, we'll add expired=true when there's an error (likely expired session)
    if (error) {
      loginUrl.searchParams.set('expired', 'true');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check OTP verification status by querying users table
  // Note: We check the users table because OTP verification is stored there
  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
  const { data: userRecord, error: userRecordError } = await (supabase as any)
    .from('users')
    .select('id, otp_verified, org_id')
    .eq('auth_user_id', user.id)
    .single();

  console.log(`[MIDDLEWARE-${requestId}] User record check:`, {
    hasUserRecord: !!userRecord,
    userRecordError: userRecordError?.message,
    userId: userRecord?.id,
    otpVerified: userRecord?.otp_verified,
    orgId: userRecord?.org_id
  })

  if (!userRecord || !userRecord.otp_verified) {
    console.log(`[MIDDLEWARE-${requestId}] OTP verification failed, redirecting to verify-email`)
    // User authenticated but OTP not verified - redirect to verification page
    const verifyUrl = new URL('/verify-email', request.url);
    if (user.email) {
      verifyUrl.searchParams.set('email', user.email);
    }
    return NextResponse.redirect(verifyUrl);
  }

  // Check payment status for protected routes (except payment-related routes)
  if (!isPaymentRoute && userRecord.org_id) {
    console.log(`[MIDDLEWARE-${requestId}] Starting payment status check for org: ${userRecord.org_id}`)
    
    // Use service role client to read organization payment status (bypasses RLS)
    // This is necessary because RLS may block users from reading their own organization data
    const adminSupabase = createServiceRoleClient();
    
    console.log(`[MIDDLEWARE-${requestId}] Created service role client, querying organization`)
    
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: org, error: orgError } = await (adminSupabase as any)
      .from('organizations')
      .select('*')
      .eq('id', userRecord.org_id)
      .single();

    console.log(`[MIDDLEWARE-${requestId}] Organization query result:`, {
      hasOrg: !!org,
      orgError: orgError?.message,
      orgId: org?.id,
      orgName: org?.name,
      paymentStatus: org?.payment_status,
      plan: org?.plan,
      gracePeriodStarted: org?.grace_period_started_at,
      suspendedAt: org?.suspended_at,
      createdAt: org?.created_at
    })

    if (org) {
      // Check if grace period expired for past_due accounts
      // Also handle edge case: past_due with null grace_period_started_at should be suspended
      if (org.payment_status === 'past_due') {
        // Edge case: past_due but no grace period started - should be suspended immediately
        if (!org.grace_period_started_at) {
          // Account is past_due but grace period never started - update to suspended
          const wasAlreadySuspended = org.suspended_at !== null;
          const suspendedAt = new Date().toISOString();
          
          if (!wasAlreadySuspended) {
            // TODO: Remove type assertion after regenerating types from Supabase Dashboard
            const { error: updateError } = await (adminSupabase as any)
              .from('organizations')
              .update({
                payment_status: 'suspended',
                suspended_at: suspendedAt,
              })
              .eq('id', userRecord.org_id)
              .is('suspended_at', null);

            if (updateError) {
              console.error('Failed to update organization to suspended status (past_due with null grace_period_started_at):', {
                orgId: userRecord.org_id,
                error: updateError,
                timestamp: new Date().toISOString(),
              });
            } else {
              // Send suspension email for this edge case (non-blocking)
              try {
                // TODO: Remove type assertion after regenerating types from Supabase Dashboard
                const { data: user } = await (adminSupabase as any)
                  .from('users')
                  .select('email')
                  .eq('id', userRecord.id)
                  .single();

                if (user?.email) {
                  await sendSuspensionEmail({
                    to: user.email,
                    userName: undefined, // users table doesn't have name column
                    suspensionDate: new Date(suspendedAt),
                  });
                  console.log('Suspension email sent (past_due with null grace_period_started_at):', {
                    orgId: userRecord.org_id,
                    email: user.email,
                    timestamp: new Date().toISOString(),
                  });
                }
              } catch (emailError) {
                console.error('Failed to send suspension email (non-blocking):', {
                  orgId: userRecord.org_id,
                  error: emailError instanceof Error ? emailError.message : String(emailError),
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
          
          // Redirect to suspension page
          const suspendedUrl = new URL('/suspended', request.url);
          suspendedUrl.searchParams.set('redirect', request.nextUrl.pathname);
          return NextResponse.redirect(suspendedUrl);
        }
        
        // Normal case: past_due with grace_period_started_at - check if expired
        const gracePeriodExpired = checkGracePeriodExpired(
          new Date(org.grace_period_started_at)
        );

        if (gracePeriodExpired) {
          // Grace period expired - update to suspended status
          // Idempotency: Only update if not already suspended to prevent race conditions
          const wasAlreadySuspended = org.suspended_at !== null;
          const suspendedAt = new Date().toISOString();
          
          // Only update if not already suspended (prevents duplicate updates and emails)
          if (!wasAlreadySuspended) {
            // TODO: Remove type assertion after regenerating types from Supabase Dashboard
            const { error: updateError } = await (adminSupabase as any)
              .from('organizations')
              .update({
                payment_status: 'suspended',
                suspended_at: suspendedAt,
              })
              .eq('id', userRecord.org_id)
              .is('suspended_at', null); // Additional idempotency: only update if suspended_at is null

            if (updateError) {
              // Log error but still redirect - security is more important than perfect state
              console.error('Failed to update organization to suspended status after grace period expiration:', {
                orgId: userRecord.org_id,
                error: updateError,
                timestamp: new Date().toISOString(),
              })
              // Continue to redirect even if update failed - user should still be blocked
            } else {
              // Send suspension email (non-blocking - log errors but don't fail redirect)
              // Idempotency: Only send email if this is a new suspension (wasAlreadySuspended was false)
              try {
                // Query user record to get email
                // Note: users table doesn't have name column, userName will be undefined
                const { data: user, error: userQueryError } = await adminSupabase
                  .from('users')
                  .select('email')
                  .eq('id', userRecord.id)
                  .single();

                if (userQueryError) {
                  console.error('Failed to query user for suspension email:', {
                    orgId: userRecord.org_id,
                    userId: userRecord.id,
                    error: userQueryError.message,
                    timestamp: new Date().toISOString(),
                  });
                } else if ((user as any)?.email) {
                  // Verify the update succeeded by checking suspended_at was actually set
                  // This provides additional idempotency protection
                  // TODO: Remove type assertion after regenerating types from Supabase Dashboard
                  const { data: updatedOrg } = await (adminSupabase as any)
                    .from('organizations')
                    .select('suspended_at')
                    .eq('id', userRecord.org_id)
                    .single();

                  // Only send email if suspended_at was actually set (within 5 second window for safety)
                  // This handles edge cases where another request updated it between our check and update
                  if (updatedOrg?.suspended_at) {
                    const timeDiff = Math.abs(
                      new Date(updatedOrg.suspended_at).getTime() - new Date(suspendedAt).getTime()
                    );
                    
                    if (timeDiff < 10000) {
                      // Suspension was just set - send email (10 second window for safety)
                      await sendSuspensionEmail({
                        to: (user as any).email,
                        userName: undefined, // users table doesn't have name column
                        suspensionDate: new Date(suspendedAt),
                      });
                      console.log('Suspension email sent successfully:', {
                        orgId: userRecord.org_id,
                        email: (user as any).email,
                        timestamp: new Date().toISOString(),
                      });
                    } else {
                      // Suspension timestamp doesn't match - another request likely updated it
                      console.log('Suspension email skipped (suspension timestamp mismatch):', {
                        orgId: userRecord.org_id,
                        email: (user as any).email,
                        expectedSuspendedAt: suspendedAt,
                        actualSuspendedAt: updatedOrg.suspended_at,
                        timestamp: new Date().toISOString(),
                      });
                    }
                  } else {
                    // Suspension wasn't set - update may have failed or been overwritten
                    console.warn('Suspension email skipped (suspended_at not set):', {
                      orgId: userRecord.org_id,
                      email: (user as any).email,
                      timestamp: new Date().toISOString(),
                    });
                  }
                } else {
                  console.warn('User email not found for suspension notification:', {
                    orgId: userRecord.org_id,
                    userId: userRecord.id,
                    timestamp: new Date().toISOString(),
                  });
                }
              } catch (emailError) {
                // Email failures are non-blocking - log but don't fail suspension redirect
                // Fallback: User will see suspension page message when they try to access the site
                // TODO: In production, consider adding a background job to retry failed emails
                // or store email_sent flag in database for monitoring
                console.error('Failed to send suspension email (non-blocking):', {
                  orgId: userRecord.org_id,
                  userId: userRecord.id,
                  email: user?.email || 'unknown',
                  error: emailError instanceof Error ? emailError.message : String(emailError),
                  errorStack: emailError instanceof Error ? emailError.stack : undefined,
                  timestamp: new Date().toISOString(),
                  action: 'MONITOR_EMAIL_FAILURES',
                  note: 'User will see suspension page message as fallback notification',
                });
                // TODO: Consider integrating with error tracking service (e.g., Sentry) in production
              }
            }
          } else {
            // Account was already suspended - skip update and email
            console.log('Suspension skipped (account already suspended):', {
              orgId: userRecord.org_id,
              existingSuspendedAt: org.suspended_at,
              timestamp: new Date().toISOString(),
            });
          }

          // Redirect to suspension page (preserve original destination for post-reactivation redirect)
          const suspendedUrl = new URL('/suspended', request.url);
          suspendedUrl.searchParams.set('redirect', request.nextUrl.pathname);
          return NextResponse.redirect(suspendedUrl);
        }
      }

      // Get payment access status using utility function
      const accessStatus = getPaymentAccessStatus(org);

      console.log(`[MIDDLEWARE-${requestId}] Payment access status determined:`, {
        accessStatus,
        originalPaymentStatus: org.payment_status,
        pathname,
        isPaymentRoute
      })

      if (accessStatus === 'suspended') {
        console.log(`[MIDDLEWARE-${requestId}] Access denied - account suspended, redirecting to /suspended`)
        // Account suspended - redirect to suspension page (preserve original destination for post-reactivation redirect)
        const suspendedUrl = new URL('/suspended', request.url);
        suspendedUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(suspendedUrl);
      } else if (accessStatus === 'pending_payment') {
        console.log(`[MIDDLEWARE-${requestId}] Access denied - payment pending, redirecting to /payment`)
        // Payment not confirmed - redirect to payment page
        return NextResponse.redirect(new URL('/payment', request.url));
      } else if (accessStatus === 'grace_period') {
        console.log(`[MIDDLEWARE-${requestId}] Access granted - grace period active`)
        // Grace period active - allow access (future: show banner)
        // For now, allow access during grace period
      } else {
        console.log(`[MIDDLEWARE-${requestId}] Access granted - payment active`)
      }
      // accessStatus === 'active' - allow access (continue below)
    } else {
      console.log(`[MIDDLEWARE-${requestId}] No organization found or payment route, allowing access`)
    }
  } else {
    console.log(`[MIDDLEWARE-${requestId}] Payment route check bypassed or no org_id, allowing access`)
  }

  console.log(`[MIDDLEWARE-${requestId}] Final decision - allowing access to: ${pathname}`)
  // User is authenticated, email is verified, and payment is active (or no org) - allow access
  console.log(`[MIDDLEWARE-${requestId}] ${timestamp} - === MIDDLEWARE COMPLETED === Allowing access`)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

