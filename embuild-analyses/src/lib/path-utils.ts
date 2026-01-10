/**
 * Utility functions for handling paths with basePath support
 */

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/data-blog'
 * In development, this is ''
 *
 * This uses the NEXT_PUBLIC_BASE_PATH environment variable set at build time
 * in next.config.mjs, providing a single source of truth for the basePath.
 */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || ''
}

/**
 * Get a public asset URL with proper basePath handling
 * @param path - The path relative to /public (e.g., '/data/file.json')
 * @returns The full path including basePath if needed
 */
export function getPublicPath(path: string): string {
  const basePath = getBasePath()
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}
