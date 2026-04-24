
// Helper to clean test name for file paths (preserves directory structure)
export const cleanTestNameForPath = (testName: string): string => {
  // Keep original case for directory parts, only clean the filename part
  const parts = testName.split('/');
  const lastPart = parts[parts.length - 1];
  // Clean the filename part: replace dots with hyphens and remove invalid chars
  const cleanedLastPart = lastPart.replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
  parts[parts.length - 1] = cleanedLastPart;
  let result = parts.join('/');
  // Remove any other invalid characters from the full path (keep slashes, hyphens, underscores, alphanumeric)
  // But preserve the case for directory names
  result = result.replace(/[^a-zA-Z0-9_/-]/g, '');
  return result;
};
