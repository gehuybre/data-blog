/**
 * Tests for ExportButtons component
 *
 * NOTE: This project doesn't have a test framework configured yet.
 * To run these tests, you'll need to:
 * 1. Install a test framework: npm install -D vitest @testing-library/react @testing-library/jest-dom
 * 2. Add vitest.config.ts
 * 3. Add test script to package.json: "test": "vitest"
 */

import { describe, it, expect } from 'vitest'

/**
 * These tests demonstrate what should be tested in the ExportButtons component.
 * Once a test framework is set up, these can be converted to actual component tests.
 */

describe('ExportButtons - URL Encoding', () => {
  it('should URL-encode slug and sectionId to prevent injection', () => {
    // Simulate what the component does
    const slug = 'vergunningen-goedkeuringen'
    const sectionId = 'renovatie'

    const encodedSlug = encodeURIComponent(slug)
    const encodedSectionId = encodeURIComponent(sectionId)

    const embedUrl = `https://gehuybre.github.io/data-blog/embed/${encodedSlug}/${encodedSectionId}`

    expect(embedUrl).toBe(
      'https://gehuybre.github.io/data-blog/embed/vergunningen-goedkeuringen/renovatie'
    )
  })

  it('should handle special characters in slug/section', () => {
    // Edge case: what if slug/section had special chars?
    const slug = 'test-slug & special'
    const sectionId = 'section/with/slashes'

    const encodedSlug = encodeURIComponent(slug)
    const encodedSectionId = encodeURIComponent(sectionId)

    expect(encodedSlug).toBe('test-slug%20%26%20special')
    expect(encodedSectionId).toBe('section%2Fwith%2Fslashes')

    // Should not contain unencoded special characters
    expect(encodedSlug).not.toContain('&')
    expect(encodedSlug).not.toContain(' ')
    expect(encodedSectionId).not.toContain('/')
  })

  it('should generate valid iframe code without deprecated attributes', () => {
    const slug = 'vergunningen-goedkeuringen'
    const sectionId = 'renovatie'

    const embedUrl = `https://gehuybre.github.io/data-blog/embed/${encodeURIComponent(
      slug
    )}/${encodeURIComponent(sectionId)}`

    const iframeCode = `<iframe src="${embedUrl}" style="border: 0;" width="100%" height="600"></iframe>`

    // Should use modern CSS instead of frameborder
    expect(iframeCode).toContain('style="border: 0;"')
    expect(iframeCode).not.toContain('frameborder')

    // Should have proper src
    expect(iframeCode).toContain(`src="${embedUrl}"`)
  })
})

describe('ExportButtons - Embed Validation', () => {
  it('should only show embed button for embeddable sections', () => {
    // This would be tested with actual component rendering
    // For now, we document the expected behavior

    // Mock isEmbeddable function
    const isEmbeddable = (slug: string, section: string) => {
      const validCombinations = [
        ['vergunningen-goedkeuringen', 'renovatie'],
        ['vergunningen-goedkeuringen', 'nieuwbouw'],
        ['starters-stoppers', 'starters'],
        ['starters-stoppers', 'stoppers'],
        ['starters-stoppers', 'survival'],
      ]

      return validCombinations.some(([s, sec]) => s === slug && sec === section)
    }

    // Valid sections should show embed button
    expect(isEmbeddable('vergunningen-goedkeuringen', 'renovatie')).toBe(true)
    expect(isEmbeddable('starters-stoppers', 'starters')).toBe(true)

    // Invalid sections should NOT show embed button
    expect(isEmbeddable('invalid-slug', 'renovatie')).toBe(false)
    expect(isEmbeddable('vergunningen-goedkeuringen', 'invalid-section')).toBe(false)
  })
})
