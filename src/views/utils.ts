/**
 * Get the static slice file path for a view
 * Always returns a path like /slices/{viewName}.json
 */
// export function getSliceFilePath(viewName: string): string {
//   return `/slices/${viewName}.json`;
// }

/**
 * Extract view name from various path formats
 */
// export function extractViewName(path: string): string {
//   // Handle /~/views/{viewName}/slice format
//   if (path.startsWith('/~/views/') && path.endsWith('/slice')) {
//     return path.split('/')[3];
//   }
//   // Handle /slices/{viewName}.json format
//   if (path.startsWith('/slices/') && path.endsWith('.json')) {
//     return path.split('/')[2].replace('.json', '');
//   }
//   // Default: use the last part of the path
//   const parts = path.split('/');
//   const last = parts[parts.length - 1];
//   return last.replace('.json', '').replace('/slice', '');
// }
/**
 * Get the static slice file path for a view
 * Always returns a path like /testeranto/slices/views/{viewName}.json
 */
export function getSliceFilePath(viewName: string): string {
  console.log("viewName", viewName);
  // Return absolute path from server root to where slice files are actually stored
  // The server writes to testeranto/slices/views/ and serves from project root
  return `/testeranto/slices/views/${viewName}.json`;
}

/**
 * Extract view name from various path formats
 */
export function extractViewName(path: string): string {
  // Handle /~/views/{viewName}/slice format
  if (path.startsWith('/~/views/') && path.endsWith('/slice')) {
    return path.split('/')[3];
  }
  // Handle /slices/{viewName}.json format
  if (path.startsWith('/slices/') && path.endsWith('.json')) {
    return path.split('/')[2].replace('.json', '');
  }
  // Default: use the last part of the path
  const parts = path.split('/');
  const last = parts[parts.length - 1];
  return last.replace('.json', '').replace('/slice', '');
}
