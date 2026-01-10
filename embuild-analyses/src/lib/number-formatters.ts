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
 * Create an auto-scaled formatter for chart axes to prevent label overflow
 * @param values - Array of numbers to determine the scale
 * @param isCurrency - Whether to format as currency (with € symbol)
 * @returns Object with formatter function and scale string
 */
export function createAutoScaledFormatter(
  values: number[],
  isCurrency: boolean = false
): { formatter: (value: number) => string; scale: string } {
  const maxValue = Math.max(...values.filter((v) => !isNaN(v) && isFinite(v)))

  if (maxValue >= 1_000_000_000) {
    // Billion scale
    return {
      formatter: (value: number) => {
        const scaled = value / 1_000_000_000
        return isCurrency ? `€${scaled.toFixed(1)}` : scaled.toFixed(1)
      },
      scale: "B",
    }
  } else if (maxValue >= 1_000_000) {
    // Million scale
    return {
      formatter: (value: number) => {
        const scaled = value / 1_000_000
        return isCurrency ? `€${scaled.toFixed(1)}` : scaled.toFixed(1)
      },
      scale: "M",
    }
  } else if (maxValue >= 10_000) {
    // Thousand scale (only if > 10k to avoid unnecessary scaling)
    return {
      formatter: (value: number) => {
        const scaled = value / 1_000
        return isCurrency ? `€${scaled.toFixed(1)}` : scaled.toFixed(1)
      },
      scale: "K",
    }
  }

  // No scaling needed
  return {
    formatter: (value: number) => {
      return isCurrency ? `€${value.toFixed(0)}` : value.toFixed(0)
    },
    scale: "",
  }
}

/**
 * Append scale suffix to axis label
 * @param label - The base label (e.g., "Investment (€)")
 * @param scale - The scale string (e.g., "M", "K", "B", or "")
 * @returns Label with scale appended appropriately
 */
export function getScaledLabel(label: string, scale: string): string {
  if (!scale) return label

  // If label ends with (€), insert scale before the closing parenthesis
  if (label.endsWith("(€)")) {
    return label.replace("(€)", `(€${scale})`)
  }

  // Otherwise append to the end
  return `${label} (${scale})`
}
