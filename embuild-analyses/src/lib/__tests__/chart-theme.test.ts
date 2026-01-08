import { describe, it } from 'node:test'
import assert from 'node:assert'
import { formatAxisNumber } from '../chart-theme'

describe('formatAxisNumber', () => {
  describe('small numbers (< 10K)', () => {
    it('should format zero correctly', () => {
      assert.strictEqual(formatAxisNumber(0), '0')
    })

    it('should format small positive integers without suffix', () => {
      assert.strictEqual(formatAxisNumber(500), '500')
      assert.strictEqual(formatAxisNumber(999), '999')
      assert.strictEqual(formatAxisNumber(9999), '9.999')
    })

    it('should format small negative integers without suffix', () => {
      assert.strictEqual(formatAxisNumber(-500), '-500')
      assert.strictEqual(formatAxisNumber(-999), '-999')
    })
  })

  describe('thousands (>= 10K, < 1M)', () => {
    it('should format exact thousands with K suffix', () => {
      assert.strictEqual(formatAxisNumber(10_000), '10K')
      assert.strictEqual(formatAxisNumber(50_000), '50K')
      assert.strictEqual(formatAxisNumber(100_000), '100K')
    })

    it('should format fractional thousands with K suffix', () => {
      assert.strictEqual(formatAxisNumber(15_000), '15K')
      assert.strictEqual(formatAxisNumber(15_500), '15,5K')
      assert.strictEqual(formatAxisNumber(123_456), '123,5K')
    })

    it('should format negative thousands with K suffix', () => {
      assert.strictEqual(formatAxisNumber(-10_000), '-10K')
      assert.strictEqual(formatAxisNumber(-15_500), '-15,5K')
    })

    it('should handle boundary at 10K', () => {
      assert.strictEqual(formatAxisNumber(9_999), '9.999')
      assert.strictEqual(formatAxisNumber(10_000), '10K')
    })
  })

  describe('millions (>= 1M, < 1B)', () => {
    it('should format exact millions with M suffix', () => {
      assert.strictEqual(formatAxisNumber(1_000_000), '1M')
      assert.strictEqual(formatAxisNumber(5_000_000), '5M')
      assert.strictEqual(formatAxisNumber(100_000_000), '100M')
    })

    it('should format fractional millions with M suffix', () => {
      assert.strictEqual(formatAxisNumber(1_500_000), '1,5M')
      assert.strictEqual(formatAxisNumber(2_500_000), '2,5M')
      assert.strictEqual(formatAxisNumber(12_345_678), '12,3M')
    })

    it('should format negative millions with M suffix', () => {
      assert.strictEqual(formatAxisNumber(-1_000_000), '-1M')
      assert.strictEqual(formatAxisNumber(-1_500_000), '-1,5M')
    })

    it('should handle boundary at 1M', () => {
      assert.strictEqual(formatAxisNumber(999_999), '1.000K')
      assert.strictEqual(formatAxisNumber(1_000_000), '1M')
    })
  })

  describe('billions (>= 1B)', () => {
    it('should format exact billions with Mrd suffix', () => {
      assert.strictEqual(formatAxisNumber(1_000_000_000), '1Mrd')
      assert.strictEqual(formatAxisNumber(5_000_000_000), '5Mrd')
    })

    it('should format fractional billions with Mrd suffix', () => {
      assert.strictEqual(formatAxisNumber(1_500_000_000), '1,5Mrd')
      assert.strictEqual(formatAxisNumber(2_500_000_000), '2,5Mrd')
      assert.strictEqual(formatAxisNumber(12_345_678_901), '12,3Mrd')
    })

    it('should format negative billions with Mrd suffix', () => {
      assert.strictEqual(formatAxisNumber(-1_000_000_000), '-1Mrd')
      assert.strictEqual(formatAxisNumber(-1_500_000_000), '-1,5Mrd')
    })

    it('should handle boundary at 1B', () => {
      assert.strictEqual(formatAxisNumber(999_999_999), '1.000M')
      assert.strictEqual(formatAxisNumber(1_000_000_000), '1Mrd')
    })
  })

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      assert.strictEqual(formatAxisNumber(999_999_999_999), '1.000Mrd')
      assert.strictEqual(formatAxisNumber(1_234_567_890_123), '1.234,6Mrd')
    })

    it('should remove trailing .0 from whole numbers', () => {
      assert.strictEqual(formatAxisNumber(10_000), '10K')
      assert.strictEqual(formatAxisNumber(1_000_000), '1M')
      assert.strictEqual(formatAxisNumber(1_000_000_000), '1Mrd')
    })

    it('should preserve single decimal place for fractional values', () => {
      assert.strictEqual(formatAxisNumber(10_500), '10,5K')
      assert.strictEqual(formatAxisNumber(1_500_000), '1,5M')
      assert.strictEqual(formatAxisNumber(1_500_000_000), '1,5Mrd')
    })
  })
})
