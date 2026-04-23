/**
 * Generate HTML for a view
 */
export function generateViewHtml(
  viewKey: string,
  viewPath: string
): string {
  console.log(`[generateViewHtml] Generating HTML for view ${viewKey}`);
  return `<html><body><h1>View: ${viewKey}</h1><p>Path: ${viewPath}</p></body></html>`;
}
