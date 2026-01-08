/**
 * Centralized theme configuration for charts and maps.
 * These values are synced with globals.css variables where possible,
 * but provided here as constants for libraries that don't easily support CSS variables (like Recharts/React Simple Maps in some cases).
 */

export const CHART_COLORS = {
  // Core colors
  primary: "oklch(0.205 0 0)", // Corresponding to --primary
  secondary: "oklch(0.97 0 0)", // Corresponding to --secondary
  accent: "oklch(0.97 0 0)", // Corresponding to --accent
  
  // Chart specific ramps (Tailwind 4 / Shadcn style)
  chart1: "oklch(0.646 0.222 41.116)",
  chart2: "oklch(0.6 0.118 184.704)",
  chart3: "oklch(0.398 0.07 227.392)",
  chart4: "oklch(0.828 0.189 84.429)",
  chart5: "oklch(0.769 0.188 70.08)",
  
  // Traditional hex codes for libraries that prefer them or for quick reuse
  // (Mapped from the oklch values above for consistency)
  bars: "#8884d8", // Default fallback, but we'll try to use variables
  lines: "#ff7300", 
}

export const MAP_COLOR_SCHEMES = {
  blue: ["#e6f2ff", "#b3d9ff", "#66b3ff", "#0077cc", "#004c99"],
  orange: ["#fff5eb", "#fed7aa", "#fdba74", "#f97316", "#c2410c"],
  green: ["#ecfdf5", "#a7f3d0", "#6ee7b7", "#10b981", "#065f46"],
  purple: ["#f3e8ff", "#d8b4fe", "#c084fc", "#a855f7", "#7e22ce"],
  red: ["#fef2f2", "#fecaca", "#f87171", "#ef4444", "#b91c1c"],
}

export const CHART_THEME = {
  fontSize: 12,
  fontFamily: "var(--font-sans)",
  gridStroke: "#e5e7eb",
  tooltip: {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    borderRadius: "0.5rem",
    border: "1px solid var(--border)",
  },
  margin: { top: 10, right: 30, left: 0, bottom: 0 },
}

export const TABLE_THEME = {
  spacing: "p-4",
  headerBg: "bg-muted/50",
  fontSize: "text-sm",
}

/**
 * Format large numbers for axis labels to prevent overflow.
 * Uses K (duizend), M (miljoen), Mrd (miljard) Dutch suffixes to match nl-BE locale.
 *
 * Examples:
 * - 500 -> "500"
 * - 1500 -> "1,5K"
 * - 1000000 -> "1M"
 * - 2500000 -> "2,5M"
 * - 1000000000 -> "1Mrd"
 */
export function formatAxisNumber(value: number): string {
  const absValue = Math.abs(value)

  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).replace(/\.0$/, '')}Mrd`
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).replace(/\.0$/, '')}M`
  }
  if (absValue >= 10_000) {
    return `${(value / 1_000).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).replace(/\.0$/, '')}K`
  }

  return new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 0 }).format(value)
}
