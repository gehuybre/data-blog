/**
 * Utility functions for handling paths with basePath support
 */

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/data-blog'
 * In development, this is ''
 *
 * IMPORTANT: For client-side code, we hardcode the basePath to avoid runtime
 * process.env access which doesn't work in the browser.
 * This matches the basePath in next.config.mjs.
 */
export function getBasePath(): string {
  // Use hardcoded value for production build
  // This must match the basePath in next.config.mjs
  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  return isProd ? '/data-blog' : ''
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
