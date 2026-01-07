/**
 * Runtime validation for gemeentelijke-investeringen data
 *
 * Provides type guards and validation functions to ensure JSON data
 * conforms to expected schemas at runtime.
 */

import type { Metadata, Lookups } from './types'

/**
 * Validate metadata structure
 */
export function validateMetadata(data: unknown): data is Metadata {
  if (!data || typeof data !== 'object') {
    console.error('[gemeentelijke-investeringen] Invalid metadata: not an object')
    return false
  }

  const metadata = data as Record<string, unknown>
  const errors: string[] = []

  // Required fields
  if (typeof metadata.latest_year !== 'number') {
    errors.push('latest_year must be a number')
  }
  if (typeof metadata.latest_date !== 'string') {
    errors.push('latest_date must be a string')
  }
  if (typeof metadata.bv_latest_year !== 'number') {
    errors.push('bv_latest_year must be a number')
  }
  if (typeof metadata.kostenpost_latest_year !== 'number') {
    errors.push('kostenpost_latest_year must be a number')
  }
  if (typeof metadata.total_municipalities !== 'number') {
    errors.push('total_municipalities must be a number')
  }
  if (typeof metadata.bv_records !== 'number') {
    errors.push('bv_records must be a number')
  }
  if (typeof metadata.kostenpost_records !== 'number') {
    errors.push('kostenpost_records must be a number')
  }

  // Optional fields (new in this PR)
  if ('kostenpost_municipalities' in metadata && typeof metadata.kostenpost_municipalities !== 'number') {
    errors.push('kostenpost_municipalities must be a number if present')
  }
  if ('is_kostenpost_truncated' in metadata && typeof metadata.is_kostenpost_truncated !== 'boolean') {
    errors.push('is_kostenpost_truncated must be a boolean if present')
  }

  if (errors.length > 0) {
    console.error('[gemeentelijke-investeringen] Metadata validation errors:', errors)
    return false
  }

  return true
}

/**
 * Validate lookups structure
 */
export function validateLookups(data: unknown): data is Lookups {
  if (!data || typeof data !== 'object') {
    console.error('[gemeentelijke-investeringen] Invalid lookups: not an object')
    return false
  }

  const lookups = data as Record<string, unknown>
  const errors: string[] = []

  if (!Array.isArray(lookups.domains)) {
    errors.push('domains must be an array')
  } else {
    // Validate domain structure
    for (const domain of lookups.domains) {
      if (typeof domain !== 'object' || !domain) {
        errors.push('domain items must be objects')
        break
      }
      const d = domain as Record<string, unknown>
      if (typeof d.domain_code !== 'string' || typeof d.domain_name !== 'string') {
        errors.push('domain items must have domain_code and domain_name strings')
        break
      }
    }
  }

  if (!Array.isArray(lookups.subdomains)) {
    errors.push('subdomains must be an array')
  }

  if (!Array.isArray(lookups.cost_categories_niveau1)) {
    errors.push('cost_categories_niveau1 must be an array')
  }

  if (!Array.isArray(lookups.years)) {
    errors.push('years must be an array')
  }

  if (errors.length > 0) {
    console.error('[gemeentelijke-investeringen] Lookups validation errors:', errors)
    return false
  }

  return true
}

/**
 * Validate investment record structure (domain or category)
 */
export function validateInvestmentRecord(
  data: unknown,
  recordType: 'domain' | 'category'
): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  const record = data as Record<string, unknown>
  const errors: string[] = []

  // Common fields
  if (typeof record.year !== 'number') {
    errors.push('year must be a number')
  }
  if (typeof record.value !== 'number') {
    errors.push('value must be a number')
  }
  if (record.metric !== 'total' && record.metric !== 'per_capita') {
    errors.push('metric must be "total" or "per_capita"')
  }

  // Type-specific fields
  if (recordType === 'domain') {
    if (typeof record.domain_code !== 'string') {
      errors.push('domain_code must be a string')
    }
    if (typeof record.domain_name !== 'string') {
      errors.push('domain_name must be a string')
    }
  } else {
    if (typeof record.category_l1 !== 'string') {
      errors.push('category_l1 must be a string')
    }
  }

  if (errors.length > 0) {
    console.error(`[gemeentelijke-investeringen] ${recordType} record validation errors:`, errors)
    return false
  }

  return true
}

/**
 * Validate array of investment records
 */
export function validateInvestmentData(
  data: unknown,
  recordType: 'domain' | 'category',
  sampleSize: number = 5
): boolean {
  if (!Array.isArray(data)) {
    console.error('[gemeentelijke-investeringen] Investment data must be an array')
    return false
  }

  if (data.length === 0) {
    console.warn('[gemeentelijke-investeringen] Investment data array is empty')
    return true
  }

  // Validate a sample of records
  const samplesToCheck = Math.min(sampleSize, data.length)
  for (let i = 0; i < samplesToCheck; i++) {
    const index = Math.floor((i * data.length) / samplesToCheck)
    if (!validateInvestmentRecord(data[index], recordType)) {
      console.error(`[gemeentelijke-investeringen] Validation failed at record index ${index}`)
      return false
    }
  }

  return true
}
