import { findNodeInTree } from "../StakeholderUtils";
import { addFileToTree } from "./addFileToTree";
import { addSourceFilesToTree } from "./addSourceFilesToTree";
import { addTestResultsToSourceFiles } from "./addTestResultsToSourceFiles";
import { getDocumentationData } from "./getDocumentationData";

/**
 * Generate a feature tree from documentation files and source files
 */
export async function generateFeatureTree(configs: any): Promise<any> {
  const fs = require('fs').promises;
  const path = require('path');
  const { existsSync } = require('fs');

  const tree: any = {
    type: "directory",
    name: "root",
    path: ".",
    children: {},
  };

  // Get all documentation files
  const documentation = await getDocumentationData(configs);
  const docFiles = documentation.files || [];

  // Process documentation files into the tree
  for (const filePath of docFiles) {
    addFileToTree(tree, filePath, "documentation");
    // Load content for documentation files
    const node = findNodeInTree(tree, filePath);
    if (node && node.type === "file") {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        if (existsSync(fullPath)) {
          const content = await fs.readFile(fullPath, "utf-8");
          node.content = content;
        }
      } catch (error) {
        console.warn(
          `[utils] Could not read documentation file ${filePath}: ${error}`,
        );
      }
    }
  }

  // Add source files from the project structure
  await addSourceFilesToTree(tree, configs);

  // Add test results to their corresponding source files
  await addTestResultsToSourceFiles(tree, configs);

  return tree;
}
