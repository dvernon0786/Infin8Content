import '@testing-library/jest-dom'

// Polyfill process.env for browser environment
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = { env: {} }
}

// Set up environment variables for tests
const processEnv = (globalThis as any).process.env
processEnv.NEXT_PUBLIC_SUPABASE_URL = processEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
processEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = processEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
processEnv.SUPABASE_SERVICE_ROLE_KEY = processEnv.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

// Mock matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => { }, // Deprecated
          removeListener: () => { }, // Deprecated
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
      }),
  })
}

// Mock ResizeObserver - use globalThis for browser compatibility
(globalThis as any).ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
