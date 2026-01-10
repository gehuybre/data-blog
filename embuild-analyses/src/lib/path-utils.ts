/**
 * Utility functions for handling paths with basePath support
 */

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/data-blog'
 * In development, this is ''
 *
 * IMPORTANT: This uses NEXT_PUBLIC_BASE_PATH which is embedded at build time
 * by Next.js and is safe to access in client-side code.
 */
export function getBasePath(): string {
  // NEXT_PUBLIC_* environment variables are embedded at build time
  // and are safe to access in client-side code
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
