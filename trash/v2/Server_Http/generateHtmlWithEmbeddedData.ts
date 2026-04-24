import fs from "fs";
import path from "path";
// import { extractFeaturesAndDocsFromTestResults } from "./extractFeaturesAndDocsFromTestResults";

// NOTE: this file no longer embeds data in the html . that feature is deprecated. 
export async function generateHtmlWithEmbeddedData(
  htmlPath: string,
  configs: any,
  collatedFilesTree: any,
  allTestResults: any = {},
): Promise<string> {
  try {
    return fs.promises.readFile(htmlPath, "utf-8");

  } catch (error) {
    console.error("Error generating HTML with embedded data:", error);
    // Fallback to original HTML
    return await fs.promises.readFile(htmlPath, "utf-8");
  }
}

async function readDocumentationFiles(
  files: string[],
): Promise<Record<string, string>> {
  const contents: Record<string, string> = {};

  for (const file of files) {
    try {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = await fs.promises.readFile(fullPath, "utf-8");
        contents[file] = content;
      }
    } catch (error) {
      console.warn(`Could not read documentation file ${file}:`, error);
    }
  }

  return contents;
}

function convertTreeToGraph(tree: any): any {
  const nodes: any[] = [];
  const edges: any[] = [];
  let nodeCounter = 0;

  const traverse = (node: any, parentId: string | null = null, depth: number = 0) => {
    if (!node) return;

    // Generate a unique ID for the node
    const nodeId = `node-${nodeCounter++}`;

    nodes.push({
      id: nodeId,
      attributes: {
        name: node.name || 'root',
        type: node.type || 'directory',
        fileType: node.fileType || 'directory',
        path: node.path || '',
        depth: depth
      }
    });

    if (parentId !== null) {
      edges.push({
        source: parentId,
        target: nodeId,
        attributes: {
          relationship: 'parent-child'
        }
      });
    }

    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        traverse(child, nodeId, depth + 1);
      }
    }
  };

  traverse(tree);

  return {
    nodes,
    edges
  };
}

async function extractFileContentsFromTree(
  tree: any,
): Promise<Record<string, string>> {
  const contents: Record<string, string> = {};

  const traverse = async (node: any, currentPath: string = "") => {
    if (!node) return;

    if (node.type === "file" && node.path) {
      try {
        const fullPath = path.join(process.cwd(), node.path);
        if (fs.existsSync(fullPath)) {
          const content = await fs.promises.readFile(fullPath, "utf-8");
          contents[node.path] = content;
        }
      } catch (error) {
        console.warn(`Could not read file ${node.path}:`, error);
      }
    }

    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        await traverse(child, currentPath ? `${currentPath}/${key}` : key);
      }
    }
  };

  await traverse(tree);
  return contents;
}
