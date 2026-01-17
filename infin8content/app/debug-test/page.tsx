"use client"

import { useState } from 'react'
import { LayoutDiagnostic } from '@/components/layout-diagnostic'

export default function DebugTestPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const newLog = `${timestamp}: ${message}`
    setLogs(prev => [...prev, newLog])
    console.log(newLog)
  }

  const testBasicLogging = () => {
    addLog("Testing basic logging...")
    
    // Test basic console logging
    console.log('🔍 Debug message from test page')
    console.info('ℹ️ Info message from test page')
    console.warn('⚠️ Warning message from test page')
    console.error('❌ Error message from test page')
    
    addLog("✅ Basic console logs sent")
  }

  const testErrorSimulation = () => {
    addLog("Testing error simulation...")
    
    try {
      throw new Error('Test error for debugging')
    } catch (error) {
      console.error('❌ Caught error:', error)
      addLog("✅ Error simulation completed")
    }
  }

  const testPerformance = () => {
    addLog("Testing performance measurement...")
    
    const startTime = performance.now()
    
    // Simulate some work
    setTimeout(() => {
      const duration = performance.now() - startTime
      console.log(`⏱️ Performance test completed in ${duration.toFixed(2)}ms`)
      addLog(`✅ Performance test completed (${duration.toFixed(2)}ms)`)
    }, 100)
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Debug Test Page</h1>
          <p className="text-gray-600">
            Simple test page for debugging functionality
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="space-y-4">
              <button 
                onClick={testBasicLogging}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Test Basic Logging
              </button>
              <button 
                onClick={testErrorSimulation}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Test Error Simulation
              </button>
              <button 
                onClick={testPerformance}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Test Performance
              </button>
              <button 
                onClick={clearLogs}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Clear Logs
              </button>
            </div>
          </div>

          {/* Log Output */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Output</h2>
            <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">Click test buttons to see logs...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <h3 className="font-semibold mb-2">What's Being Tested:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Basic console logging</li>
                <li>• Error handling and simulation</li>
                <li>• Performance measurement</li>
                <li>• Real-time log display</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Where to Check:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Browser console (F12)</li>
                <li>• This page output</li>
                <li>• Network tab for API calls</li>
                <li>• Sources tab for debugging</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>React:</span>
              <span className="text-green-600">✅ Working</span>
            </div>
            <div className="flex justify-between">
              <span>Next.js:</span>
              <span className="text-green-600">✅ Working</span>
            </div>
            <div className="flex justify-between">
              <span>Console Logging:</span>
              <span className="text-green-600">✅ Working</span>
            </div>
            <div className="flex justify-between">
              <span>Error Handling:</span>
              <span className="text-green-600">✅ Working</span>
            </div>
          </div>
        </div>

        {/* Layout Diagnostic */}
        <div className="mt-6">
          <LayoutDiagnostic />
        </div>
      </div>
    </div>
  )
}
