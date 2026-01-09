"use client"

/**
 * Central number formatting utilities for all charts in the codebase.
 * Provides automatic scaling for large numbers to prevent axis label overflow.
 */

export type NumberScale = {
  divisor: number
  suffix: "" | "k" | "mln" | "mrd"
}

/**
 * Determines the appropriate scale based on the maximum absolute value in the dataset.
 * @param values - Array of numbers to analyze
 * @returns Scale object with divisor and suffix
 */
export function getNumberScale(values: number[]): NumberScale {
  const maxAbs = values.reduce((acc, v) => Math.max(acc, Math.abs(v)), 0)
  if (maxAbs >= 1_000_000_000) return { divisor: 1_000_000_000, suffix: "mrd" }
  if (maxAbs >= 1_000_000) return { divisor: 1_000_000, suffix: "mln" }
  if (maxAbs >= 10_000) return { divisor: 1_000, suffix: "k" }
  return { divisor: 1, suffix: "" }
}

/**
 * Formats a number with maximum 5 significant digits using Dutch locale.
 * @param value - Number to format
 * @returns Formatted string
 */
function formatMax5Digits(value: number): string {
  return new Intl.NumberFormat("nl-BE", {
    maximumSignificantDigits: 5,
  }).format(value)
}

/**
 * Formats a number with the appropriate scale (k, mln, mrd) for compact display.
 * Use this for Y-axis tickFormatter to prevent overflow with large numbers.
 * @param value - Number to format
 * @param scale - Scale object (use getNumberScale to determine)
 * @returns Formatted string with scale suffix
 */
export function formatScaledNumber(value: number, scale: NumberScale): string {
  const scaled = value / scale.divisor
  const formatted = formatMax5Digits(scaled)
  return scale.suffix ? `${formatted} ${scale.suffix}` : formatted
}

/**
 * Formats a number as currency (€) with the appropriate scale.
 * Use this for Y-axis tickFormatter when displaying monetary values.
 * @param value - Number to format
 * @param scale - Scale object (use getNumberScale to determine)
 * @returns Formatted string with € and scale suffix
 */
export function formatScaledCurrency(value: number, scale: NumberScale): string {
  const scaled = value / scale.divisor
  const formatted = formatMax5Digits(scaled)
  return scale.suffix ? `€ ${formatted} ${scale.suffix}` : `€ ${formatted}`
}

/**
 * Updates an axis label to include the scale suffix.
 * @param baseLabel - Original axis label (e.g., "Uitgave (€)")
 * @param scale - Scale object
 * @returns Updated label (e.g., "Uitgave (mln €)")
 */
export function getScaledLabel(baseLabel: string, scale: NumberScale): string {
  if (scale.suffix === "mrd") return baseLabel.replace("(€)", "(mrd €)")
  if (scale.suffix === "mln") return baseLabel.replace("(€)", "(mln €)")
  if (scale.suffix === "k") return baseLabel.replace("(€)", "(k €)")
  return baseLabel
}

/**
 * Basic number formatter using Dutch locale (no scaling).
 * Use this for tooltips or when you want full precision.
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("nl-BE").format(Math.round(num))
}

/**
 * Basic currency formatter using Dutch locale (no scaling).
 * Use this for tooltips or when you want full precision.
 * @param num - Number to format
 * @returns Formatted string with €
 */
export function formatCurrency(num: number): string {
  return `€ ${formatNumber(num)}`
}

/**
 * Helper to create a Y-axis tick formatter that automatically scales large numbers.
 * @param values - All Y-axis values from your data (used to determine scale)
 * @param isCurrency - Whether to add € symbol
 * @returns Object with formatter function and scale info
 *
 * @example
 * const data = [{ value: 5000000 }, { value: 8000000 }]
 * const { formatter, scale } = createAutoScaledFormatter(data.map(d => d.value), true)
 *
 * <YAxis tickFormatter={formatter} label={{ value: getScaledLabel('Uitgave (€)', scale) }} />
 */
export function createAutoScaledFormatter(
  values: number[],
  isCurrency: boolean = false
): { formatter: (value: number) => string; scale: NumberScale } {
  const scale = getNumberScale(values)
  const formatter = (value: number) =>
    isCurrency ? formatScaledCurrency(value, scale) : formatScaledNumber(value, scale)
  return { formatter, scale }
}
