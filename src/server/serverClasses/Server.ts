import esbuild from 'esbuild';
import fs from 'fs';
import path, { join } from "path";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Docker } from './Server_Docker';
import { processCwd, processExit } from './Server_Docker/Server_Docker_Dependents';

export class Server extends Server_Docker {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    const entryPoint = join(
      process.cwd(),
      "testeranto",
      "reports",
      "index.tsx",
    );
    const outfile = join(process.cwd(), "testeranto", "reports", "index.js");

    // // Get the path to the stakeholder app source
    // const stakeholderAppSource = join(__dirname, "../../stakeholderApp/index.tsx");

    // // First, check if the entry point exists
    // if (!fs.existsSync(entryPoint)) {
    //   console.log(`[Server] Entry point not found at ${entryPoint}, using default stakeholder app`);
    //   // Copy the default stakeholder app to the reports directory
    //   const defaultStakeholderApp = fs.readFileSync(stakeholderAppSource, 'utf-8');
    //   // Ensure the directory exists
    //   const reportsDir = join(process.cwd(), "testeranto", "reports");
    //   if (!fs.existsSync(reportsDir)) {
    //     fs.mkdirSync(reportsDir, { recursive: true });
    //   }
    //   fs.writeFileSync(entryPoint, defaultStakeholderApp, 'utf-8');
    // }

    // Get the project root to resolve node_modules
    // const projectRoot = process.cwd();
    // const nodeModulesPath = join(projectRoot, 'node_modules');

    // const buildOptions: esbuild.BuildOptions = {
    //   entryPoints: [entryPoint],
    //   metafile: false,
    //   bundle: true,
    //   format: "iife", // Use IIFE format for browser compatibility
    //   platform: "browser",
    //   target: "es2020",
    //   jsx: "automatic",
    //   outfile: outfile,
    //   globalName: "TesterantoStakeholderApp", // Global variable name
    //   define: {
    //     'process.env.NODE_ENV': '"production"'
    //   },
    //   // Add aliases to ensure React is only bundled once
    //   // Use path.dirname to get the directory containing the module, not the entry file
    //   alias: {
    //     'react': path.dirname(require.resolve('react')),
    //     'react-dom': path.dirname(require.resolve('react-dom')),
    //   },
    //   nodePaths: [nodeModulesPath],
    //   loader: {
    //     '.tsx': 'tsx',
    //     '.ts': 'ts',
    //     '.jsx': 'jsx',
    //     '.js': 'js'
    //   }
    // };

    // try {
    //   console.log(`[Server] Bundling stakeholder app from ${entryPoint} to ${outfile}`);
    //   const result = esbuild.buildSync(buildOptions);
    //   console.log(`[Server] Successfully bundled stakeholder app`);

    //   // Verify the bundle was created
    //   if (fs.existsSync(outfile)) {
    //     const stats = fs.statSync(outfile);
    //     console.log(`[Server] Bundle created: ${outfile} (${stats.size} bytes)`);
    //   } else {
    //     console.error(`[Server] Bundle not created at ${outfile}`);
    //     throw new Error(`Bundle not created at ${outfile}`);
    //   }
    // } catch (error) {
    //   console.error(`[Server] Error bundling stakeholder app:`, error);
    //   throw error;
    // }

    // // Copy the HTML file to the reports directory
    // const htmlSource = join(__dirname, "../../stakeholderApp/index.html");
    // const htmlDest = join(process.cwd(), "testeranto", "reports", "index.html");

    // if (fs.existsSync(htmlSource)) {
    //   const htmlDir = path.dirname(htmlDest);
    //   if (!fs.existsSync(htmlDir)) {
    //     fs.mkdirSync(htmlDir, { recursive: true });
    //   }
    //   fs.copyFileSync(htmlSource, htmlDest);
    //   console.log(`[Server] Copied HTML file to ${htmlDest}`);
    // } else {
    //   console.error(`[Server] HTML source file not found at ${htmlSource}`);
    //   throw new Error(`HTML source file not found at ${htmlSource}`);
    // }

    // Generate slice data for views
    await this.generateViewSlices();

    // Generate HTML files for configured views
    await this.generateViewHtmlFiles();

    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  private async generateViewHtmlFiles(): Promise<void> {
    const views = this.configs.views;
    if (!views || Object.keys(views).length === 0) {
      console.log('[Server] No views configured, skipping HTML generation');
      return;
    }

    console.log(`[Server] Generating HTML files and bundles for ${Object.keys(views).length} views`);

    // Create the views directory if it doesn't exist
    const viewsDir = join(process.cwd(), "testeranto", "views");
    if (!fs.existsSync(viewsDir)) {
      fs.mkdirSync(viewsDir, { recursive: true });
    }

    // Generate bundle for each view based on its configuration
    for (const [viewKey, v] of Object.entries(views)) {
      // Generate HTML file
      const htmlFilePath = join(viewsDir, `${viewKey}.html`);
      const htmlContent = this.generateViewHtml(viewKey, v.filePath);

      fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
      console.log(`[Server] Generated HTML file for view ${viewKey} at ${htmlFilePath}`);

      // Generate JavaScript bundle for this view
      await this.generateViewBundle(viewKey, v.filePath);
    }

    // Also generate a simple index.html that lists all views
    const indexHtml = this.generateViewsIndexHtml(views);
    const indexPath = join(viewsDir, 'index.html');
    fs.writeFileSync(indexPath, indexHtml, 'utf-8');
    console.log(`[Server] Generated views index at ${indexPath}`);
  }

  private generateViewHtml(viewKey: string, viewPath: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testeranto - ${viewKey} View</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    #root {
      min-height: 100vh;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.2rem;
      color: #666;
    }
    .error {
      padding: 40px;
      text-align: center;
      color: #d32f2f;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <h2>Loading ${viewKey} View...</h2>
    </div>
  </div>

  <script>
    // View configuration
    const viewKey = '${viewKey}';
    const viewPath = '${viewPath}';
    const dataPath = '/testeranto/slices/views/' + viewKey + '.json';
    
    console.log('[View HTML] Setting up configuration for view:', viewKey);
    console.log('[View HTML] Data path:', dataPath);
    
    window.TESTERANTO_VIEW_CONFIG = {
      viewKey: viewKey,
      viewPath: viewPath,
      dataPath: dataPath,
      apiEndpoint: '/~/api'
    };

    console.log('[View HTML] Configuration set:', window.TESTERANTO_VIEW_CONFIG);

    // Load the view-specific bundle
    const script = document.createElement('script');
    script.src = '/testeranto/views/' + viewKey + '.bundle.js';
    script.onload = function() {
      console.log('[View HTML] View bundle loaded successfully');
    };
    script.onerror = function() {
      console.error('[View HTML] Failed to load view bundle');
      document.getElementById('root').innerHTML = \`
        <div class="error">
          <h1>Error Loading View</h1>
          <p>Failed to load \${viewKey} view bundle.</p>
          <p>Make sure the server has generated the bundle.</p>
          <p>View path: \${viewPath}</p>
        </div>
      \`;
    };
    document.head.appendChild(script);
    console.log('[View HTML] Script element added to head');
  </script>
</body>
</html>`;
  }

  private generateViewsIndexHtml(views: Record<string, any>): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testeranto Views</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 40px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .view-list {
      list-style: none;
      padding: 0;
    }
    .view-item {
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: background-color 0.2s;
    }
    .view-item:hover {
      background-color: #f9f9f9;
    }
    .view-link {
      display: block;
      text-decoration: none;
      color: #007acc;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 5px;
    }
    .view-link:hover {
      text-decoration: underline;
    }
    .view-path {
      font-size: 14px;
      color: #666;
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .empty {
      text-align: center;
      color: #666;
      padding: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Testeranto Views</h1>
    ${Object.keys(views).length > 0 ? `
      <p>Available views:</p>
      <ul class="view-list">
        ${Object.entries(views).map(([key, path]) => `
          <li class="view-item">
            <a href="/testeranto/views/${key}.html" class="view-link">${key}</a>
            <div class="view-path">${path}</div>
          </li>
        `).join('')}
      </ul>
      <p>You can also access the <a href="/testeranto/reports/index.html">main stakeholder report</a>.</p>
    ` : `
      <div class="empty">
        <p>No views are currently configured.</p>
        <p>Add views to your testeranto configuration to see them here.</p>
      </div>
    `}
  </div>
</body>
</html>`;
  }



  private createErrorBundle(bundlePath: string, viewKey: string, errorMessage: string): void {
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
  }

  private async generateViewBundle(viewKey: string, viewPath: string): Promise<void> {
    const viewsDir = join(process.cwd(), "testeranto", "views");
    const bundlePath = join(viewsDir, `${viewKey}.bundle.js`);
    const absoluteViewPath = join(process.cwd(), viewPath);

    // Delete existing bundle to ensure fresh generation
    if (fs.existsSync(bundlePath)) {
      console.log(`[Server] Deleting existing bundle for ${viewKey} at ${bundlePath}`);
      fs.unlinkSync(bundlePath);
    }

    if (!fs.existsSync(absoluteViewPath)) {
      console.error(`[Server] View file not found: ${absoluteViewPath}`);
      this.createErrorBundle(bundlePath, viewKey, `View file not found: ${absoluteViewPath}`);
      return;
    }

    // Generate component name: capitalize first letter and add "View"
    // e.g., "kanban" -> "KanbanView", "gantt" -> "GanttView"
    const componentName = viewKey.charAt(0).toUpperCase() + viewKey.slice(1) + 'View';

    // Create a wrapper entry point that mounts the component
    const wrapperContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ${componentName} } from '${absoluteViewPath.replace(/\\/g, '/')}';

const config = window.TESTERANTO_VIEW_CONFIG;
if (!config) {
  console.error('TESTERANTO_VIEW_CONFIG not found in window');
  document.getElementById('root').innerHTML = \`
    <div style="padding: 40px; text-align: center; color: #d32f2f;">
      <h1>Configuration Error</h1>
      <p>View configuration not found.</p>
    </div>
  \`;
} else {
  console.log('Mounting view with config:', config);
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    React.createElement(${componentName}, {
      slicePath: config.dataPath,
      width: window.innerWidth - 40,
      height: window.innerHeight - 40
    })
  );
}
`;

    const wrapperPath = join(viewsDir, `${viewKey}.wrapper.tsx`);
    fs.writeFileSync(wrapperPath, wrapperContent, 'utf-8');

    const buildOptions: esbuild.BuildOptions = {
      entryPoints: [wrapperPath],
      bundle: true,
      format: "iife",
      platform: "browser",
      target: "es2020",
      jsx: "automatic",
      outfile: bundlePath,
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      alias: {
        'react': path.dirname(require.resolve('react')),
        'react-dom': path.dirname(require.resolve('react-dom')),
      },
      nodePaths: [join(process.cwd(), 'node_modules')],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js'
      },
      // Mark React and ReactDOM as external to prevent multiple copies
      external: ['react', 'react-dom'],
    };

    try {
      console.log(`[Server] Bundling view ${viewKey} from ${wrapperPath} to ${bundlePath}`);
      const result = esbuild.buildSync(buildOptions);

      // Clean up wrapper file
      fs.unlinkSync(wrapperPath);

      if (result.errors && result.errors.length > 0) {
        console.error(`[Server] Errors bundling view ${viewKey}:`, result.errors);
        this.createErrorBundle(bundlePath, viewKey, result.errors.map(e => e.text).join(', '));
      } else {
        console.log(`[Server] Successfully bundled view ${viewKey} to ${bundlePath}`);

        // Verify the bundle was created
        if (fs.existsSync(bundlePath)) {
          const stats = fs.statSync(bundlePath);
          console.log(`[Server] Bundle created: ${bundlePath} (${stats.size} bytes)`);
        } else {
          console.error(`[Server] Bundle not created at ${bundlePath}`);
        }
      }
    } catch (error) {
      console.error(`[Server] Error bundling view ${viewKey}:`, error);
      this.createErrorBundle(bundlePath, viewKey, error instanceof Error ? error.message : String(error));
    }
  }


  private async generateViewSlices(): Promise<void> {
    const views = this.configs.views;
    if (!views || Object.keys(views).length === 0) {
      return;
    }

    // Create the slices directory if it doesn't exist
    const slicesDir = join(process.cwd(), "testeranto", "slices", "views");
    if (!fs.existsSync(slicesDir)) {
      fs.mkdirSync(slicesDir, { recursive: true });
    }

    const graphData = await this.getGraphDataForSlices();

    for (const [viewKey, v] of Object.entries(views)) {

      const slicePath = join(slicesDir, `${viewKey}.json`);
      const sliceData = v.slicer(graphData)
      fs.writeFileSync(slicePath, JSON.stringify(sliceData, null, 2), 'utf-8');
    }
  }

  private async getGraphDataForSlices(): Promise<any> {

    const graphData = this.graphManager.getGraphData();
    if (!graphData) {
      throw new Error('No graph data available for generating view slices');
    }

    console.log(`[Server] Retrieved graph data with ${graphData.nodes?.length || 0} nodes for view slices`);
    return graphData;
  }

  // Note: Slice creation is now handled by view-specific slice functions
  // or by passing the entire graph data to the view component
  // The view component is responsible for filtering what it needs

  private getViewsModulePath(): string {
    // Return the path to the views module relative to the project root
    const projectRoot = process.cwd();
    return join(projectRoot, 'src', 'views');
  }

}
