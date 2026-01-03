import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { validateSupabaseEnv } from "@/lib/supabase/env";

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

  return await updateSession(request);
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

