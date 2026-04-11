/**
 * Extract local file path from a feature string
 */
export function extractLocalFilePath(feature: string): string | null {
  // Remove any URL scheme or leading ./
  let path = feature.replace(/^\.\//, '');

  // Remove any anchor or query parts
  path = path.split('#')[0].split('?')[0];

  // Check if it looks like a file path with an extension
  if (path.includes('.') && !path.includes(' ')) {
    return path;
  }

  return null;
}