/**
 * Check if a feature string looks like a local file URL
 */
export function isLocalFileUrl(feature: string): boolean {
  // Check if feature looks like a local file path or URL
  return feature.startsWith('./') ||
    feature.startsWith('/') ||
    feature.includes('/') &&
    !feature.startsWith('http://') &&
    !feature.startsWith('https://');
}
