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

    // // Extract features and documentation files from all test results
    // const result =
    //   await extractFeaturesAndDocsFromTestResults(allTestResults);
    // const features = result.features || [];
    // const documentationFiles = result.documentationFiles || [];
    // const bddStatus = result.bddStatus || {};
    // const featureGraph = result.featureGraph || { nodes: [], edges: [] };

    // // Read contents of documentation files
    // const documentationWithContent =
    //   await readDocumentationFiles(documentationFiles);

    // // Convert the collated files tree to a graph structure
    // const fileTreeGraph = convertTreeToGraph(collatedFilesTree);

    // Prepare the data to embed in the format expected by the stakeholder app
    // const embeddedData = {
    //   configs,
    //   // Use the collated files tree which includes source files, documentation, etc.
    //   featureTree: collatedFilesTree,
    //   documentation: {
    //     files: documentationFiles,
    //     timestamp: Date.now(),
    //     contents: documentationWithContent,
    //   },
    //   features: features,
    //   bddStatus: bddStatus,
    //   testResults: {},
    //   errors: [],
    //   timestamp: new Date().toISOString(),
    //   workspaceRoot: process.cwd(),
    //   allTestResults: allTestResults,
    //   // Add file contents for files in the tree
    //   fileContents: await extractFileContentsFromTree(collatedFilesTree),
    //   // Add feature graph for visualization (with fallback)
    //   featureGraph: featureGraph || { nodes: [], edges: [] },
    //   // Add file tree graph for visualization
    //   fileTreeGraph: fileTreeGraph,
    //   // Add grafeovidajo configuration
    //   vizConfig: {
    //     projection: {
    //       xAttribute: "status",
    //       yAttribute: "points",
    //       xType: "categorical",
    //       yType: "continuous",
    //       layout: "grid",
    //     },
    //     style: {
    //       nodeSize: (node: any) => {
    //         if (node.attributes.points)
    //           return Math.max(10, node.attributes.points * 5);
    //         return 10;
    //       },
    //       nodeColor: (node: any) => {
    //         const status = node.attributes.status;
    //         if (status === "done") return "#4caf50";
    //         if (status === "doing") return "#ff9800";
    //         if (status === "todo") return "#f44336";
    //         return "#9e9e9e";
    //       },
    //       nodeShape: "circle",
    //       labels: {
    //         show: true,
    //         attribute: "name",
    //         fontSize: 12,
    //       },
    //     },
    //   },
    // };

    // Convert embedded data to a JSON string
    // const jsonString = JSON.stringify(embeddedData);
    // Encode to base64 to avoid any HTML/JS escaping issues
    // const base64String = Buffer.from(jsonString, "utf8").toString("base64");

    // Create a script tag that decodes the base64 string
    //     const scriptTag = `<script>
    // window.TESTERANTO_EMBEDDED_DATA = JSON.parse(atob('${base64String}'));
    // </script>`;

    // Insert the script tag before the closing </head> tag
    // If no </head> tag, insert before </body> or at the end
    // let modifiedHtml = htmlContent;

    // if (htmlContent.includes("</head>")) {
    //   modifiedHtml = htmlContent.replace("</head>", `${scriptTag}\n</head>`);
    // } else if (htmlContent.includes("</body>")) {
    //   modifiedHtml = htmlContent.replace(`</body>`, `${scriptTag}\n</body>`);
    // } else {
    //   modifiedHtml = htmlContent + scriptTag;
    // }

    // return modifiedHtml;
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
