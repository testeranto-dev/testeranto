import fs from "fs";
import path from "path";
import { generateHtmlWithEmbeddedData } from "../Server_Http/generateHtmlWithEmbeddedData";
import type { ITesterantoConfig } from "../../../Types";

/**
 * Embed configuration in HTML for stakeholder app using modern graph-based approach
 * Note: The stakeholder app should already be bundled by Server_Docker.ts
 */
export async function embedConfigInHtml(configs: ITesterantoConfig): Promise<void> {
  const reportsDir = path.join(process.cwd(), "testeranto", "reports");

  // Always create directory if needed
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Get the stakeholder app HTML template
  const htmlTemplatePath = path.join(
    process.cwd(),
    "src",
    "stakeholderApp",
    "index.html"
  );

  if (!fs.existsSync(htmlTemplatePath)) {
    throw new Error(`Stakeholder app HTML template not found at ${htmlTemplatePath}`);
  }

  // The stakeholder app should already be bundled by Server_Docker.ts
  // Check if the bundled JavaScript exists
  const bundledJsPath = path.join(reportsDir, "index.js");
  if (!fs.existsSync(bundledJsPath)) {
    throw new Error(`Stakeholder app bundle not found at ${bundledJsPath}. Make sure the app is bundled before generating HTML.`);
  }

  // Generate HTML with embedded data using the existing implementation
  // We need to pass empty/default values for parameters we don't have
  const htmlContent = await generateHtmlWithEmbeddedData(
    htmlTemplatePath,
    configs,
    {}, // collatedFilesTree - empty for now
    {}  // allTestResults - empty for now
  );

  // Write the HTML file
  const htmlPath = path.join(reportsDir, "index.html");
  await fs.promises.writeFile(htmlPath, htmlContent, "utf-8");

  // Generate graph-data.json for dual-mode operation
  const graphData = {
    timestamp: new Date().toISOString(),
    version: "1.0",
    data: {
      configs: {
        runtimes: configs.runtimes || {},
        documentationGlob: configs.documentationGlob,
        stakeholderReactModule: configs.stakeholderReactModule
      },
      allTestResults: {},
      featureTree: {},
      featureGraph: {
        nodes: [],
        edges: []
      },
      fileTreeGraph: {
        nodes: [],
        edges: []
      },
      vizConfig: {
        projection: {
          xAttribute: 'status',
          yAttribute: 'priority',
          xType: 'categorical',
          yType: 'continuous',
          layout: 'grid'
        },
        style: {
          nodeSize: 10,
          nodeColor: '#007acc',
          nodeShape: 'circle'
        }
      }
    }
  };

  const graphDataPath = path.join(reportsDir, "graph-data.json");
  await fs.promises.writeFile(
    graphDataPath,
    JSON.stringify(graphData, null, 2),
    "utf-8"
  );
}
