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
  const publicRoutes = ['/register', '/login', '/auth/callback', '/verify-email'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isPublicRoute) {
    return response;
  }

  // Check authentication and email verification for protected routes
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
    // User not authenticated - redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check email verification status
  if (!user.email_confirmed_at) {
    // User authenticated but email not verified - redirect to verification page
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  // User is authenticated and email is verified - allow access
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

