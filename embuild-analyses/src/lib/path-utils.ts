/**
 * Utility functions for handling paths with basePath support
 */

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/data-blog'
 * In development, this is ''
 */
export function getBasePath(): string {
  // Check if we're in production by looking at the current URL
  if (typeof window !== 'undefined') {
    const { pathname } = window.location
    // If pathname starts with /data-blog, we're in production
    if (pathname.startsWith('/data-blog')) {
      return '/data-blog'
    }
  }
  return ''
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
