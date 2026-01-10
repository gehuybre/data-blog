/**
 * Number formatting utilities for Belgian locale
 */

/**
 * Format a number with Belgian locale (space as thousand separator, comma as decimal)
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + "M"
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(decimals) + "K"
  }
  return value.toLocaleString("nl-BE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format currency in euros
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return `€${formatNumber(value, decimals)}`
}

/**
 * Get the scaled label for a value (K, M, or empty string)
 * Can also append scale suffix to a label string
 */
export function getScaledLabel(labelOrValue: string | number, scale?: string): string {
  // If called with two arguments (label, scale), append scale to label
  if (typeof labelOrValue === "string" && scale !== undefined) {
    return scale ? `${labelOrValue} ${scale}` : labelOrValue
  }

  // Otherwise, determine scale from numeric value
  const value = labelOrValue as number
  if (value >= 1_000_000) {
    return "M"
  } else if (value >= 1_000) {
    return "K"
  }
  return ""
}

/**
 * Create an auto-scaled number formatter
 * Automatically chooses between K, M suffixes based on magnitude
 *
 * @param values - Array of values to determine scale (optional)
 * @param isCurrency - Whether to format as currency
 * @returns Object with formatter function and scale label
 */
export function createAutoScaledFormatter(values?: number[], isCurrency: boolean = false) {
  // Determine scale based on max value
  const maxValue = values && values.length > 0 ? Math.max(...values) : 0
  const scale = getScaledLabel(maxValue)

  const formatter = (value: number) => {
    if (isCurrency) {
      return formatCurrency(value)
    }
    return formatNumber(value)
  }

  return { formatter, scale }
}
