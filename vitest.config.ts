/**
 * Root-level Vitest config for __tests__/ directory.
 * Dependencies (react, testing-library etc.) are resolved from infin8content/node_modules.
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const infin8Modules = path.resolve(__dirname, 'infin8content/node_modules')

export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./infin8content/vitest.setup.ts'],
    environmentOptions: {
      jsdom: { resources: 'usable' }
    },
    include: ['./__tests__/**/*.{test,spec}.{ts,tsx}']
  },
  resolve: {
    alias: {
      // Ensure JSX runtime resolves from infin8content/node_modules
      'react/jsx-dev-runtime': path.join(infin8Modules, 'react/jsx-dev-runtime.js'),
      'react/jsx-runtime': path.join(infin8Modules, 'react/jsx-runtime.js'),
      'react': path.join(infin8Modules, 'react/index.js'),
      'react-dom': path.join(infin8Modules, 'react-dom/index.js'),
      'react-dom/client': path.join(infin8Modules, 'react-dom/client.js'),
      '@testing-library/react': path.join(infin8Modules, '@testing-library/react'),
      '@testing-library/jest-dom': path.join(infin8Modules, '@testing-library/jest-dom'),
      '@testing-library/user-event': path.join(infin8Modules, '@testing-library/user-event'),
      // Map root-level wrapper paths back into the repo
      '@': path.resolve(__dirname, 'infin8content'),
    }
  }
})
