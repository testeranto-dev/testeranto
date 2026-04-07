import { existsSync } from "fs";
import path from "path";
import { getDocumentationFilesFromGlob } from "./getDocumentationFilesFromGlob";

/**
 * Get documentation data by merging glob files and documentation.json
 */
export async function getDocumentationData(configs: any): Promise<any> {
  const fs = require("fs").promises;


  // First, try to get documentation files from the glob pattern
  const docFiles = getDocumentationFilesFromGlob(configs?.documentationGlob);

  // Also check the old documentation.json file for backward compatibility
  const docPath = path.join(process.cwd(), "testeranto", "documentation.json");
  let oldDocFiles: string[] = [];

  if (existsSync(docPath)) {
    try {
      const content = await fs.readFile(docPath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.files && Array.isArray(parsed.files)) {
        oldDocFiles = parsed.files;
      }
    } catch (error) {
      console.error(`[utils] Failed to read documentation.json file: ${error}`);
    }
  }

  // Merge both sources, removing duplicates
  const allFiles = [...new Set([...docFiles, ...oldDocFiles])];

  // Sort files for consistent display
  allFiles.sort();

  return { files: allFiles };
}
