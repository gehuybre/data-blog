/**
 * Utility functions for handling paths with basePath support
 */

/**
 * The base path is determined at build time via string replacement.
 * In production (GitHub Pages), this is '/data-blog'
 * In development, this is ''
 *
 * IMPORTANT: This is replaced during the build process and does NOT use
 * process.env to avoid client-side errors in static exports.
 */
const BASE_PATH = typeof window !== 'undefined'
  ? (window.location.pathname.startsWith('/data-blog') ? '/data-blog' : '')
  : '';

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/data-blog'
 * In development, this is ''
 */
export function getBasePath(): string {
  return BASE_PATH;
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

/**
 * Check if the application is running in development mode.
 * This is determined by checking if we're running on localhost.
 */
export function isDevMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}
