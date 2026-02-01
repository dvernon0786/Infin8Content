// Minimal working tests for subtopic generator service
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('KeywordSubtopicGenerator - Basic Tests', () => {
  it('should import service successfully', async () => {
    const { KeywordSubtopicGenerator } = await import('../../../lib/services/keyword-engine/subtopic-generator')
    expect(KeywordSubtopicGenerator).toBeDefined()
  })

  it('should create generator instance', async () => {
    const { KeywordSubtopicGenerator } = await import('../../../lib/services/keyword-engine/subtopic-generator')
    const generator = new KeywordSubtopicGenerator()
    expect(generator).toBeDefined()
    expect(typeof generator.generate).toBe('function')
    expect(typeof generator.store).toBe('function')
  })

  it('should validate input parameters', async () => {
    const { KeywordSubtopicGenerator } = await import('../../../lib/services/keyword-engine/subtopic-generator')
    const generator = new KeywordSubtopicGenerator()

    await expect(generator.generate(''))
      .rejects.toThrow('Keyword ID is required')
  })

  it('should validate store parameters', async () => {
    const { KeywordSubtopicGenerator } = await import('../../../lib/services/keyword-engine/subtopic-generator')
    const generator = new KeywordSubtopicGenerator()

    await expect(generator.store('', []))
      .rejects.toThrow('Keyword ID is required')

    await expect(generator.store('test-id', []))
      .rejects.toThrow('Subtopics are required')
  })
})
