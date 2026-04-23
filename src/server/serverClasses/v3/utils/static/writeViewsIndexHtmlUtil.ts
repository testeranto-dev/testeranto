import fs from 'fs/promises';
import path from 'path';

export const writeViewsIndexHtmlUtil = async (
  html: string
): Promise<void> => {
  const viewsDir = path.join(process.cwd(), "testeranto", "views");
  const indexPath = path.join(viewsDir, "index.html");
  
  // Ensure directory exists
  try {
    await fs.access(viewsDir);
  } catch {
    await fs.mkdir(viewsDir, { recursive: true });
  }
  
  await fs.writeFile(indexPath, html, 'utf-8');
  console.log(`[Server] Generated views index at ${indexPath}`);
};
