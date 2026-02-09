// Tests for subtopic parser utility
import { describe, it, expect } from 'vitest'
import { parseSubtopics, validateSubtopicResponse } from '../../../lib/services/keyword-engine/subtopic-parser'

describe('Subtopic Parser', () => {
  describe('validateSubtopicResponse', () => {
    it('should validate a correct DataForSEO response', () => {
      const validResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 20000,
          status_message: 'OK',
          result: [
            {
              title: 'Understanding AI Basics',
              type: 'subtopic',
              keywords: ['artificial intelligence', 'machine learning']
            },
            {
              title: 'AI Applications in Business',
              type: 'subtopic',
              keywords: ['business automation', 'AI solutions']
            }
          ]
        }]
      }

      expect(() => validateSubtopicResponse(validResponse)).not.toThrow()
    })

    it('should throw error for missing tasks', () => {
      const invalidResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: []
      }

      expect(() => validateSubtopicResponse(invalidResponse))
        .toThrow('Invalid DataForSEO response format: no tasks found')
    })

    it('should throw error for failed task status', () => {
      const invalidResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 50000,
          status_message: 'Internal Server Error'
        }]
      }

      expect(() => validateSubtopicResponse(invalidResponse))
        .toThrow('DataForSEO API error: Internal Server Error')
    })

    it('should throw error for missing result array', () => {
      const invalidResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 20000,
          status_message: 'OK'
        }]
      }

      expect(() => validateSubtopicResponse(invalidResponse))
        .toThrow('Invalid DataForSEO response format: no result array found')
    })
  })

  describe('parseSubtopics', () => {
    it('should parse valid subtopics correctly', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: [
            {
              title: 'Understanding AI Basics',
              type: 'subtopic',
              keywords: ['artificial intelligence', 'machine learning']
            },
            {
              title: 'AI Applications in Business',
              type: 'subtopic',
              keywords: ['business automation', 'AI solutions']
            },
            {
              title: 'Future of AI Technology',
              type: 'subtopic',
              keywords: ['AI trends', 'future technology']
            }
          ]
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        title: 'Understanding AI Basics',
        keywords: ['artificial intelligence', 'machine learning']
      })
      expect(result[1]).toEqual({
        title: 'AI Applications in Business',
        keywords: ['business automation', 'AI solutions']
      })
      expect(result[2]).toEqual({
        title: 'Future of AI Technology',
        keywords: ['AI trends', 'future technology']
      })
    })

    it('should filter out non-subtopic items', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: [
            {
              title: 'Understanding AI Basics',
              type: 'subtopic',
              keywords: ['artificial intelligence', 'machine learning']
            },
            {
              title: 'Related Search Term',
              type: 'search',
              keywords: ['AI search']
            },
            {
              title: 'AI Applications in Business',
              type: 'subtopic',
              keywords: ['business automation', 'AI solutions']
            }
          ]
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(2)
      expect(result.map((r: { title: string }) => r.title)).toEqual([
        'Understanding AI Basics',
        'AI Applications in Business'
      ])
    })

    it('should clean and filter keywords', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: [
            {
              title: 'Understanding AI Basics',
              type: 'subtopic',
              keywords: ['artificial intelligence', '  machine learning  ', '', '   ']
            }
          ]
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(1)
      expect(result[0].keywords).toEqual(['artificial intelligence', 'machine learning'])
    })

    it('should filter out subtopics with empty titles', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: [
            {
              title: '',
              type: 'subtopic',
              keywords: ['test']
            },
            {
              title: '   ',
              type: 'subtopic',
              keywords: ['test']
            },
            {
              title: 'Valid Subtopic',
              type: 'subtopic',
              keywords: ['test']
            }
          ]
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Valid Subtopic')
    })

    it('should filter out subtopics with no valid keywords', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: [
            {
              title: 'Valid Title',
              type: 'subtopic',
              keywords: []
            },
            {
              title: 'Another Valid Title',
              type: 'subtopic',
              keywords: ['', '   ']
            },
            {
              title: 'Valid Subtopic',
              type: 'subtopic',
              keywords: ['valid keyword']
            }
          ]
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Valid Subtopic')
    })

    it('should return empty array for no valid subtopics', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: [
            {
              title: 'Invalid Type',
              type: 'search',
              keywords: ['test']
            },
            {
              title: '',
              type: 'subtopic',
              keywords: ['test']
            }
          ]
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(0)
    })

    it('should handle null/undefined result gracefully', () => {
      const response = {
        status_code: 200,
        status_message: 'OK',
        tasks: [{
          status_code: 200,
          status_message: 'OK',
          result: null
        }]
      }

      const result = parseSubtopics(response)

      expect(result).toHaveLength(0)
    })
  })
})
