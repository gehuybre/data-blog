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
 *
 * Determines the appropriate scale (B/M/K) based on the maximum absolute value
 * in the data and returns a formatter function that applies Belgian locale formatting.
 *
 * @param values - Array of numbers to determine the scale
 * @param isCurrency - Whether to format as currency (with € symbol)
 * @returns Object with:
 *   - formatter: Function to format axis tick values with Belgian locale (space separator, comma decimal)
 *   - scale: Scale suffix string ("B", "M", "K", or "" for no scaling)
 */
export function createAutoScaledFormatter(
  values: number[],
  isCurrency: boolean = false
): { formatter: (value: number) => string; scale: string } {
  // Filter out invalid values
  const filteredValues = values.filter((v) => !isNaN(v) && isFinite(v))

  // Handle empty or all-invalid data
  if (filteredValues.length === 0) {
    return {
      formatter: (value: number) => {
        const formatted = value.toLocaleString("nl-BE", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        return isCurrency ? `€${formatted}` : formatted
      },
      scale: "",
    }
  }

  // Use absolute max to handle negative values correctly
  const maxAbsValue = Math.max(...filteredValues.map((v) => Math.abs(v)))

  if (maxAbsValue >= 1_000_000_000) {
    // Billion scale
    return {
      formatter: (value: number) => {
        const scaled = value / 1_000_000_000
        const formatted = scaled.toLocaleString("nl-BE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
        return isCurrency ? `€${formatted}` : formatted
      },
      scale: "B",
    }
  } else if (maxAbsValue >= 1_000_000) {
    // Million scale
    return {
      formatter: (value: number) => {
        const scaled = value / 1_000_000
        const formatted = scaled.toLocaleString("nl-BE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
        return isCurrency ? `€${formatted}` : formatted
      },
      scale: "M",
    }
  } else if (maxAbsValue >= 10_000) {
    // Thousand scale (only if > 10k to avoid unnecessary scaling)
    return {
      formatter: (value: number) => {
        const scaled = value / 1_000
        const formatted = scaled.toLocaleString("nl-BE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
        return isCurrency ? `€${formatted}` : formatted
      },
      scale: "K",
    }
  }

  // No scaling needed
  return {
    formatter: (value: number) => {
      const formatted = value.toLocaleString("nl-BE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      return isCurrency ? `€${formatted}` : formatted
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
