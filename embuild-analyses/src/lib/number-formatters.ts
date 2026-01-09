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
