import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { validateSupabaseEnv } from "@/lib/supabase/env";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

export async function middleware(request: NextRequest) {
  // Validate environment variables on every request
  // This ensures env vars are present and fails fast if missing
  try {
    validateSupabaseEnv();
  } catch (error) {
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

  if (isPublicRoute) {
    return response;
  }

  // Payment-related routes that don't require active payment status
  const paymentRoutes = ['/payment', '/create-organization'];
  const isPaymentRoute = paymentRoutes.some(route => request.nextUrl.pathname.startsWith(route));

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
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
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

  if (error || !user) {
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
  const { data: userRecord } = await supabase
    .from('users')
    .select('otp_verified')
    .eq('auth_user_id', user.id)
    .single();

  if (!userRecord || !userRecord.otp_verified) {
    // User authenticated but OTP not verified - redirect to verification page
    const verifyUrl = new URL('/verify-email', request.url);
    if (user.email) {
      verifyUrl.searchParams.set('email', user.email);
    }
    return NextResponse.redirect(verifyUrl);
  }

  // Check payment status for protected routes (except payment-related routes)
  if (!isPaymentRoute && userRecord.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('payment_status')
      .eq('id', userRecord.org_id)
      .single();

    if (org) {
      const paymentStatus: Database['public']['Tables']['organizations']['Row']['payment_status'] = 
        org.payment_status || 'pending_payment';

      if (paymentStatus === 'suspended') {
        // Account suspended - redirect to payment page with suspended flag
        const paymentUrl = new URL('/payment', request.url);
        paymentUrl.searchParams.set('suspended', 'true');
        return NextResponse.redirect(paymentUrl);
      } else if (paymentStatus === 'pending_payment' || paymentStatus === 'canceled') {
        // Payment not confirmed - redirect to payment page
        return NextResponse.redirect(new URL('/payment', request.url));
      }
      // paymentStatus === 'active' - allow access (continue below)
    }
  }

  // User is authenticated, email is verified, and payment is active (or no org) - allow access
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

