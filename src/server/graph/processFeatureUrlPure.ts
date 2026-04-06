import fs from 'fs';
import path from 'path';

// Pure function to process a feature URL using featureIngestor
export async function processFeatureUrlPure(
  featureUrl: string,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>
): Promise<{ content: string; localPath?: string }> {
  // Check if it's a URL (http:// or https://)
  const isUrl = featureUrl.startsWith('http://') || featureUrl.startsWith('https://');

  if (isUrl) {
    if (featureIngestor) {
      try {
        console.log(`[GraphManager] Processing feature URL with featureIngestor: ${featureUrl}`);
        // featureIngestor now returns { data: string, filepath: string }
        const result = await featureIngestor(featureUrl);

        // Extract data and filepath from the result
        const content = result.data;
        let filepath = result.filepath;

        // If filepath is relative, make it absolute relative to projectRoot
        if (!path.isAbsolute(filepath)) {
          filepath = path.join(projectRoot, filepath);
        }

        // Ensure the directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write the content to the specified filepath
        fs.writeFileSync(filepath, content, 'utf-8');

        return { content, localPath: filepath };
      } catch (error) {
        console.error(`[GraphManager] Error processing feature URL ${featureUrl}:`, error);
        return { content: `Error processing feature: ${(error as Error).message}` };
      }
    } else {
      console.warn(`[GraphManager] Feature URL detected but no featureIngestor provided: ${featureUrl}`);
      return { content: `URL feature requires featureIngestor to process` };
    }
  } else {
    // Local file path
    const localPath = path.isAbsolute(featureUrl) ? featureUrl : path.join(projectRoot, featureUrl);
    if (fs.existsSync(localPath)) {
      try {
        const content = fs.readFileSync(localPath, 'utf-8');
        return { content, localPath };
      } catch (error) {
        console.error(`[GraphManager] Error reading local feature file ${localPath}:`, error);
        return { content: `Error reading local file: ${(error as Error).message}` };
      }
    } else {
      console.warn(`[GraphManager] Feature file not found: ${featureUrl}`);
      return { content: `Feature file not found: ${featureUrl}` };
    }
  }
}
