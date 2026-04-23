import fs from 'fs/promises';
import path from 'path';

export const writeViewHtmlFileUtil = async (
  viewKey: string,
  html: string
): Promise<void> => {
  const viewsDir = path.join(process.cwd(), "testeranto", "views");
  const htmlFilePath = path.join(viewsDir, `${viewKey}.html`);
  
  // Ensure directory exists
  try {
    await fs.access(viewsDir);
  } catch {
    await fs.mkdir(viewsDir, { recursive: true });
  }
  
  await fs.writeFile(htmlFilePath, html, 'utf-8');
  console.log(`[Server] Generated HTML file for view ${viewKey} at ${htmlFilePath}`);
};
