import fs from 'fs';
import path from 'path';
import type { ITesterantoConfig } from "../../../src/server/Types";
import { generateViewHtml, generateViewsIndexHtml } from './viewHtml';

export const generateViewHtmlFilesUtil = async (
  configs: ITesterantoConfig,
  generateViewBundleFn: (viewKey: string, viewPath: string) => Promise<void>
): Promise<void> => {
  const views = configs.views;
  if (!views || Object.keys(views).length === 0) {
    console.log('[Server] No views configured, skipping HTML generation');
    return;
  }

  console.log(`[Server] Generating HTML files and bundles for ${Object.keys(views).length} views`);

  // Create the views directory if it doesn't exist
  const viewsDir = path.join(process.cwd(), "testeranto", "views");
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }

  // Generate HTML file for each view
  for (const [viewKey, v] of Object.entries(views)) {
    // Generate HTML file
    const htmlFilePath = path.join(viewsDir, `${viewKey}.html`);
    const htmlContent = generateViewHtml(viewKey, v.filePath);

    fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
    console.log(`[Server] Generated HTML file for view ${viewKey} at ${htmlFilePath}`);

    // Generate JavaScript bundle for this view
    await generateViewBundleFn(viewKey, v.filePath);
  }

  // Also generate a simple index.html that lists all views
  const indexHtml = generateViewsIndexHtml(views);
  const indexPath = path.join(viewsDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log(`[Server] Generated views index at ${indexPath}`);
};
