/**
 * Tests for embed-config module
 *
 * NOTE: This project doesn't have a test framework configured yet.
 * To run these tests, you'll need to:
 * 1. Install a test framework: npm install -D vitest @testing-library/react @testing-library/jest-dom
 * 2. Add vitest.config.ts
 * 3. Add test script to package.json: "test": "vitest"
 */

import { describe, it, expect } from 'vitest'
import {
  getAllEmbedParams,
  isEmbeddable,
  getEmbedConfig,
  EMBED_CONFIGS
} from '../embed-config'

describe('embed-config', () => {
  describe('getAllEmbedParams', () => {
    it('should return all embeddable sections as static params', () => {
      const params = getAllEmbedParams()

      // Should return an array
      expect(Array.isArray(params)).toBe(true)

      // Should have params for vergunningen-goedkeuringen
      const vergunningenParams = params.filter(p => p.slug === 'vergunningen-goedkeuringen')
      expect(vergunningenParams).toHaveLength(2)
      expect(vergunningenParams.map(p => p.section)).toContain('renovatie')
      expect(vergunningenParams.map(p => p.section)).toContain('nieuwbouw')

      // Should have params for starters-stoppers
      const startersStoppersParams = params.filter(p => p.slug === 'starters-stoppers')
      expect(startersStoppersParams).toHaveLength(3)
      expect(startersStoppersParams.map(p => p.section)).toContain('starters')
      expect(startersStoppersParams.map(p => p.section)).toContain('stoppers')
      expect(startersStoppersParams.map(p => p.section)).toContain('survival')
    })

    it('should return params with correct structure', () => {
      const params = getAllEmbedParams()

      params.forEach(param => {
        expect(param).toHaveProperty('slug')
        expect(param).toHaveProperty('section')
        expect(typeof param.slug).toBe('string')
        expect(typeof param.section).toBe('string')
      })
    })
  })

  describe('isEmbeddable', () => {
    it('should return true for valid embeddable sections', () => {
      expect(isEmbeddable('vergunningen-goedkeuringen', 'renovatie')).toBe(true)
      expect(isEmbeddable('vergunningen-goedkeuringen', 'nieuwbouw')).toBe(true)
      expect(isEmbeddable('starters-stoppers', 'starters')).toBe(true)
      expect(isEmbeddable('starters-stoppers', 'stoppers')).toBe(true)
      expect(isEmbeddable('starters-stoppers', 'survival')).toBe(true)
    })

    it('should return false for invalid sections', () => {
      expect(isEmbeddable('invalid-slug', 'renovatie')).toBe(false)
      expect(isEmbeddable('vergunningen-goedkeuringen', 'invalid-section')).toBe(false)
      expect(isEmbeddable('', '')).toBe(false)
    })

    it('should prevent broken embed buttons', () => {
      // This is the key use case - ExportButtons should check this
      // before showing the embed code
      const shouldShowEmbedButton = isEmbeddable('vergunningen-goedkeuringen', 'renovatie')
      expect(shouldShowEmbedButton).toBe(true)
    })
  })

  describe('getEmbedConfig', () => {
    it('should return config for valid sections', () => {
      const config = getEmbedConfig('vergunningen-goedkeuringen', 'renovatie')

      expect(config).not.toBeNull()
      expect(config?.type).toBe('standard')
      if (config?.type === 'standard') {
        expect(config.title).toBe('Renovatie (Gebouwen)')
        expect(config.metric).toBe('ren')
        expect(config.dataPath).toBe('vergunningen-goedkeuringen/results/data_quarterly.json')
      }
    })

    it('should return null for invalid sections', () => {
      expect(getEmbedConfig('invalid-slug', 'renovatie')).toBeNull()
      expect(getEmbedConfig('vergunningen-goedkeuringen', 'invalid-section')).toBeNull()
    })

    it('should return custom config for starters-stoppers', () => {
      const config = getEmbedConfig('starters-stoppers', 'starters')

      expect(config).not.toBeNull()
      expect(config?.type).toBe('custom')
      if (config?.type === 'custom') {
        expect(config.component).toBe('StartersStoppersEmbed')
      }
    })
  })

  describe('EMBED_CONFIGS validation', () => {
    it('should have all standard configs with required fields', () => {
      for (const analysis of EMBED_CONFIGS) {
        for (const [sectionId, config] of Object.entries(analysis.sections)) {
          expect(config).toHaveProperty('type')
          expect(config).toHaveProperty('title')
          expect(config.title).not.toBe('')

          if (config.type === 'standard') {
            expect(config).toHaveProperty('dataPath')
            expect(config).toHaveProperty('municipalitiesPath')
            expect(config).toHaveProperty('metric')
            expect(config.dataPath).not.toBe('')
            expect(config.municipalitiesPath).not.toBe('')
            expect(config.metric).not.toBe('')

            // Paths should start with analysis slug
            expect(config.dataPath.startsWith(`${analysis.slug}/`)).toBe(true)
            expect(config.municipalitiesPath.startsWith(`${analysis.slug}/`)).toBe(true)
          }

          if (config.type === 'custom') {
            expect(config).toHaveProperty('component')
            expect(config.component).not.toBe('')
          }
        }
      }
    })

    it('should not have path traversal attempts', () => {
      for (const analysis of EMBED_CONFIGS) {
        for (const config of Object.values(analysis.sections)) {
          if (config.type === 'standard') {
            expect(config.dataPath).not.toContain('..')
            expect(config.municipalitiesPath).not.toContain('..')
          }
        }
      }
    })
  })
})
