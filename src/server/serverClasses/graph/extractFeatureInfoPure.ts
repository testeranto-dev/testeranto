import path from 'path';

// Pure function to extract feature information from a URL or file path
export function extractFeatureInfoPure(featureUrl: string): {
  isUrl: boolean;
  featureName: string;
  sanitizedFeatureName: string;
  featureId: string;
} {
  // Check if it's a URL (http:// or https://)
  const isUrl = featureUrl.startsWith('http://') || featureUrl.startsWith('https://');

  let featureName: string;

  if (isUrl) {
    try {
      const url = new URL(featureUrl);
      // Get the last part of the pathname
      const pathname = url.pathname;
      featureName = pathname.split('/').pop() || url.hostname;
      // Remove any file extension and query parameters
      featureName = featureName.split('?')[0].split('#')[0];
    } catch {
      featureName = featureUrl.split('/').pop() || featureUrl;
    }
  } else {
    // For local file paths, use the filename
    featureName = path.basename(featureUrl);
  }

  // Clean up the feature name
  if (!featureName || featureName.trim() === '') {
    featureName = 'unnamed-feature';
  }

  // Sanitize the feature name for use in node ID
  const sanitizedFeatureName = featureName.replace(/[^a-zA-Z0-9:_\-.]/g, '_');
  const featureId = `feature:${sanitizedFeatureName}`;

  return {
    isUrl,
    featureName,
    sanitizedFeatureName,
    featureId
  };
}
