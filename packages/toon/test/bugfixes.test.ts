import { describe, expect, it } from 'vitest'
import { decode, decodeStream } from '../src/index'

describe('Bug fixes', () => {
  describe('BUG-002: negative numbers with leading zeros', () => {
    it('treats -05 as string (leading zero after minus)', () => {
      const result = decode('value: -05')
      expect(result).toEqual({ value: '-05' })
    })

    it('treats -007 as string (multiple leading zeros after minus)', () => {
      const result = decode('value: -007')
      expect(result).toEqual({ value: '-007' })
    })

    it('parses -0 as number (valid negative zero)', () => {
      const result = decode('value: -0')
      expect(result).toEqual({ value: 0 })
    })

    it('parses -0.5 as number (negative decimal starting with zero)', () => {
      const result = decode('value: -0.5')
      expect(result).toEqual({ value: -0.5 })
    })

    it('handles mixed positive and negative leading zeros in array', () => {
      const result = decode('nums[4]: 05,-05,-0,-0.5')
      expect(result).toEqual({ nums: ['05', '-05', 0, -0.5] })
    })
  })

  describe('BUG-001: async await in decodeListItemAsync', () => {
    it('correctly decodes nested list items with async stream', async () => {
      const input = `items[2]:
  - name: first
    data:
      key: value1
  - name: second
    data:
      key: value2`

      // Create async iterable from string
      async function* stringToAsyncLines(str: string) {
        for (const line of str.split('\n')) {
          yield line
        }
      }

      const events: unknown[] = []
      for await (const event of decodeStream(stringToAsyncLines(input))) {
        events.push(event)
      }

      // Should have all expected events without infinite loops
      expect(events.length).toBeGreaterThan(0)

      // Verify we get the complete structure
      const startArrayCount = events.filter((e: unknown) => (e as { type: string }).type === 'startArray').length
      const endArrayCount = events.filter((e: unknown) => (e as { type: string }).type === 'endArray').length
      expect(startArrayCount).toBe(endArrayCount)
    })
  })
})
