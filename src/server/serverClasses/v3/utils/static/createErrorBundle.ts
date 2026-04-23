/**
 * Create an error bundle
 */
export function createErrorBundle(
  bundlePath: string, 
  viewKey: string, 
  errorMessage: string
): void {
  console.log(`[createErrorBundle] Creating error bundle at ${bundlePath} for view ${viewKey}: ${errorMessage}`);
}
