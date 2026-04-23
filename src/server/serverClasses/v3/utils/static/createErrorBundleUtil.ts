import fs from 'fs';

export const createErrorBundleUtil = (
  bundlePath: string,
  viewKey: string,
  errorMessage: string
): void => {
  const errorBundle = `
console.error('Error loading view ${viewKey}:', ${JSON.stringify(errorMessage)});
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = \`
      <div style="padding: 40px; text-align: center; color: #d32f2f;">
        <h1>Error Loading View</h1>
        <p>Failed to load ${viewKey} view bundle.</p>
        <p>Error: ${errorMessage.replace(/`/g, '\\`')}</p>
        <p>Check server logs for more details.</p>
      </div>
    \`;
  }
});
`;
  try {
    fs.writeFileSync(bundlePath, errorBundle, 'utf-8');
    console.log(`[Server] Created error bundle for view ${viewKey} at ${bundlePath}`);
  } catch (writeError) {
    console.error(`[Server] Failed to write error bundle for ${viewKey}:`, writeError);
  }
};
