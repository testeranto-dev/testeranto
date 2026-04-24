// Helper function to extract route name from API path
export const extractRouteNameFromPath = (path: string): string => {
  // Remove leading /~/
  return path.startsWith("/~/") ? path.substring(3) : path;
};
