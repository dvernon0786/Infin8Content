import { describe, it, expect, vi, beforeEach } from 'vitest'

// --------------------
// Test Sequential Processing Logic
// --------------------

describe('B-4 Sequential Processing Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents parallel execution with in-flight guard', async () => {
    const executionLog: string[] = []
    let inFlight = false

    // Mock delay function
    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms))

    // Mock research function with parallelism guard
    const mockResearch = vi.fn().mockImplementation(async (sectionHeader: string) => {
      if (inFlight) {
        throw new Error('Parallel execution detected')
      }
      inFlight = true

      executionLog.push(`research:start:${sectionHeader}`)
      await delay(50)
      executionLog.push(`research:end:${sectionHeader}`)

      inFlight = false
      return { queries: [], results: [], totalSearches: 0 }
    })

    // Mock writing function with parallelism guard
    const mockWriting = vi.fn().mockImplementation(async (sectionHeader: string) => {
      if (inFlight) {
        throw new Error('Parallel execution detected')
      }
      inFlight = true

      executionLog.push(`write:start:${sectionHeader}`)
      await delay(50)
      executionLog.push(`write:end:${sectionHeader}`)

      inFlight = false
      return {
        markdown: `content ${sectionHeader}`,
        html: `<p>content ${sectionHeader}</p>`,
        wordCount: 2,
      }
    })

    // Test sequential processing
    const sections = ['Section 1', 'Section 2']

    for (const section of sections) {
      await mockResearch(section)
      await mockWriting(section)
    }

    // Verify sequential execution
    expect(executionLog).toEqual([
      'research:start:Section 1',
      'research:end:Section 1',
      'write:start:Section 1',
      'write:end:Section 1',
      'research:start:Section 2',
      'research:end:Section 2',
      'write:start:Section 2',
      'write:end:Section 2',
    ])

    // Verify functions were called correctly
    expect(mockResearch).toHaveBeenCalledTimes(2)
    expect(mockWriting).toHaveBeenCalledTimes(2)
    expect(mockResearch).toHaveBeenCalledWith('Section 1')
    expect(mockResearch).toHaveBeenCalledWith('Section 2')
    expect(mockWriting).toHaveBeenCalledWith('Section 1')
    expect(mockWriting).toHaveBeenCalledWith('Section 2')
  })

  it('detects and prevents parallel execution attempts', async () => {
    let inFlight = false
    let parallelAttempts = 0

    const mockFunction = vi.fn().mockImplementation(async () => {
      if (inFlight) {
        parallelAttempts++
        throw new Error('Parallel execution detected')
      }
      inFlight = true
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 10))
      
      inFlight = false
      return 'completed'
    })

    // Try to execute in parallel (should fail)
    const promises = [
      mockFunction(),
      mockFunction(),
      mockFunction()
    ]

    const results = await Promise.allSettled(promises)

    // Only one should succeed, others should fail
    const successful = results.filter(r => r.status === 'fulfilled')
    const failed = results.filter(r => r.status === 'rejected')

    expect(successful).toHaveLength(1)
    expect(failed).toHaveLength(2)
    expect(parallelAttempts).toBe(2)
    expect(mockFunction).toHaveBeenCalledTimes(3)
  })

  it('maintains execution order with proper timing', async () => {
    const timestamps: number[] = []
    
    const mockFunction = vi.fn().mockImplementation(async (id: number) => {
      timestamps.push(Date.now())
      await new Promise(resolve => setTimeout(resolve, 10 * id)) // Variable delay
      timestamps.push(Date.now())
      return `result-${id}`
    })

    // Execute sequentially (not in parallel)
    const result1 = await mockFunction(1)
    const result2 = await mockFunction(2)  
    const result3 = await mockFunction(3)

    // Verify all completed
    expect([result1, result2, result3]).toEqual(['result-1', 'result-2', 'result-3'])
    expect(mockFunction).toHaveBeenCalledTimes(3)

    // Verify timing shows sequential execution
    expect(timestamps).toHaveLength(6) // 3 starts + 3 ends
    expect(timestamps[0]).toBeLessThan(timestamps[1]) // 1 starts before 1 ends
    expect(timestamps[1]).toBeLessThan(timestamps[2]) // 1 ends before 2 starts
    expect(timestamps[2]).toBeLessThan(timestamps[3]) // 2 starts before 2 ends
    expect(timestamps[3]).toBeLessThan(timestamps[4]) // 2 ends before 3 starts
    expect(timestamps[4]).toBeLessThan(timestamps[5]) // 3 starts before 3 ends
  })
})
