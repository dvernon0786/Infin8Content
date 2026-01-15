import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill process.env for browser environment
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: {} } as any
}

// Set up environment variables for tests
globalThis.process.env.NEXT_PUBLIC_SUPABASE_URL = globalThis.process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
globalThis.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = globalThis.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

// Mock matchMedia
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

// Mock ResizeObserver - use globalThis for browser compatibility
globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
