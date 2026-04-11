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

    // Get the path to the stakeholder app source
    const stakeholderAppSource = join(__dirname, "../../stakeholderApp/index.tsx");

    // First, check if the entry point exists
    if (!fs.existsSync(entryPoint)) {
      console.log(`[Server] Entry point not found at ${entryPoint}, using default stakeholder app`);
      // Copy the default stakeholder app to the reports directory
      const defaultStakeholderApp = fs.readFileSync(stakeholderAppSource, 'utf-8');
      // Ensure the directory exists
      const reportsDir = join(process.cwd(), "testeranto", "reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      fs.writeFileSync(entryPoint, defaultStakeholderApp, 'utf-8');
    }

    // Get the project root to resolve node_modules
    const projectRoot = process.cwd();
    const nodeModulesPath = join(projectRoot, 'node_modules');

    const buildOptions: esbuild.BuildOptions = {
      entryPoints: [entryPoint],
      metafile: false,
      bundle: true,
      format: "iife", // Use IIFE format for browser compatibility
      platform: "browser",
      target: "es2020",
      jsx: "automatic",
      outfile: outfile,
      globalName: "TesterantoStakeholderApp", // Global variable name
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      // Add aliases to ensure React is only bundled once
      // Use path.dirname to get the directory containing the module, not the entry file
      alias: {
        'react': path.dirname(require.resolve('react')),
        'react-dom': path.dirname(require.resolve('react-dom')),
      },
      nodePaths: [nodeModulesPath],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js'
      }
    };

    try {
      console.log(`[Server] Bundling stakeholder app from ${entryPoint} to ${outfile}`);
      const result = esbuild.buildSync(buildOptions);
      console.log(`[Server] Successfully bundled stakeholder app`);

      // Verify the bundle was created
      if (fs.existsSync(outfile)) {
        const stats = fs.statSync(outfile);
        console.log(`[Server] Bundle created: ${outfile} (${stats.size} bytes)`);
      } else {
        console.error(`[Server] Bundle not created at ${outfile}`);
        throw new Error(`Bundle not created at ${outfile}`);
      }
    } catch (error) {
      console.error(`[Server] Error bundling stakeholder app:`, error);
      throw error;
    }

    // Copy the HTML file to the reports directory
    const htmlSource = join(__dirname, "../../stakeholderApp/index.html");
    const htmlDest = join(process.cwd(), "testeranto", "reports", "index.html");

    if (fs.existsSync(htmlSource)) {
      const htmlDir = path.dirname(htmlDest);
      if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, { recursive: true });
      }
      fs.copyFileSync(htmlSource, htmlDest);
      console.log(`[Server] Copied HTML file to ${htmlDest}`);
    } else {
      console.error(`[Server] HTML source file not found at ${htmlSource}`);
      throw new Error(`HTML source file not found at ${htmlSource}`);
    }

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

    // Generate HTML file and bundle for each view
    for (const [viewKey, viewPath] of Object.entries(views)) {
      // Generate HTML file
      const htmlFilePath = join(viewsDir, `${viewKey}.html`);
      const htmlContent = this.generateViewHtml(viewKey, viewPath as string);

      fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
      console.log(`[Server] Generated HTML file for view ${viewKey} at ${htmlFilePath}`);

      // Generate JavaScript bundle
      await this.generateViewBundle(viewKey, viewPath as string);
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
    window.TESTERANTO_VIEW_CONFIG = {
      viewKey: '${viewKey}',
      viewPath: '${viewPath}',
      dataPath: '/testeranto/slices/views/${viewKey}.json',
      apiEndpoint: '/~/api'
    };

    // Load the view bundle
    const script = document.createElement('script');
    script.src = '/testeranto/views/${viewKey}.bundle.js';
    script.onerror = function() {
      document.getElementById('root').innerHTML = \`
        <div class="error">
          <h1>Error Loading View</h1>
          <p>Failed to load ${viewKey} view bundle.</p>
          <p>Make sure the view has been properly compiled.</p>
        </div>
      \`;
    };
    document.head.appendChild(script);
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

  private async generateViewBundle(viewKey: string, viewPath: string): Promise<void> {
    try {
      const viewsDir = join(process.cwd(), "testeranto", "views");
      const bundlePath = join(viewsDir, `${viewKey}.bundle.js`);

      // Get the project root to resolve node_modules
      const projectRoot = process.cwd();
      const nodeModulesPath = join(projectRoot, 'node_modules');

      // Create a simple entry point for the view
      const entryPoint = join(viewsDir, `${viewKey}.entry.js`);

      // Determine which view component to use based on the viewKey
      let componentImport = '';
      let componentName = '';

      // Map view keys to their corresponding components
      // The views are exported from src/views/index.ts
      switch (viewKey) {
        case 'Kanban':
          componentImport = `import { KanbanBoard } from '../../src/views';`;
          componentName = 'KanbanBoard';
          break;
        case 'Gantt':
          componentImport = `import { GanttChart } from '../../src/views';`;
          componentName = 'GanttChart';
          break;
        case 'Eisenhower':
          componentImport = `import { EisenhowerMatrix } from '../../src/views';`;
          componentName = 'EisenhowerMatrix';
          break;
        default:
          // For custom views, try to import from the specified path
          // We need to handle this differently - for now, use a placeholder
          componentImport = `
// Custom view import
const ${viewKey} = () => React.createElement('div', null, 
  \`Custom view '\${viewKey}' from '\${viewPath}' is not yet implemented. 
   Check the console for configuration details.\`
);`;
          componentName = viewKey;
      }

      const entryContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
${componentImport}

// Get configuration from window
const config = window.TESTERANTO_VIEW_CONFIG || {};

// Simple view component that loads data and renders the view
function ViewApp() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(config.dataPath || '/testeranto/slices/views/${viewKey}.json');
        if (!response.ok) {
          throw new Error(\`Failed to load data: \${response.status}\`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading view data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    
    // Set up polling for updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return React.createElement('div', null, 'Loading ${viewKey} view...');
  }

  if (error) {
    return React.createElement('div', { style: { color: 'red', padding: '20px' } }, \`Error: \${error}\`);
  }

  if (!data) {
    return React.createElement('div', null, 'No data available');
  }

  // Create props for the view component
  const props = {
    data: data,
    width: window.innerWidth - 40,
    height: window.innerHeight - 40,
    config: {
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
    },
    onNodeClick: (node) => console.log('Node clicked:', node),
    onNodeHover: (node) => console.log('Node hover:', node)
  };

  return React.createElement(${componentName}, props);
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(ViewApp));
  }
});
`;

      // Write the entry point file
      fs.writeFileSync(entryPoint, entryContent, 'utf-8');

      // Bundle the entry point
      try {
        const buildOptions: esbuild.BuildOptions = {
          entryPoints: [entryPoint],
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
          nodePaths: [nodeModulesPath],
          loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.jsx': 'jsx',
            '.js': 'js'
          },
          external: [], // Don't externalize any packages
        };

        console.log(`[Server] Bundling view ${viewKey} from ${entryPoint} to ${bundlePath}`);
        const result = esbuild.buildSync(buildOptions);

        if (result.errors && result.errors.length > 0) {
          console.error(`[Server] Errors bundling view ${viewKey}:`, result.errors);
          // Create a simple error bundle instead
          this.createErrorBundle(bundlePath, viewKey, result.errors.map(e => e.text).join(', '));
        } else {
          console.log(`[Server] Successfully generated bundle for view ${viewKey} at ${bundlePath}`);
        }

      } catch (buildError) {
        console.error(`[Server] Build error for view ${viewKey}:`, buildError);
        // Create a simple error bundle
        this.createErrorBundle(bundlePath, viewKey, buildError instanceof Error ? buildError.message : String(buildError));
      } finally {
        // Clean up the entry point file
        try {
          if (fs.existsSync(entryPoint)) {
            fs.unlinkSync(entryPoint);
          }
        } catch (cleanupError) {
          console.warn(`[Server] Could not clean up entry point for ${viewKey}:`, cleanupError);
        }
      }

    } catch (error) {
      console.error(`[Server] Error generating bundle for view ${viewKey}:`, error);
      // Try to create an error bundle
      const viewsDir = join(process.cwd(), "testeranto", "views");
      const bundlePath = join(viewsDir, `${viewKey}.bundle.js`);
      this.createErrorBundle(bundlePath, viewKey, error instanceof Error ? error.message : String(error));
    }
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


  private getViewsModulePath(): string {
    // Return the path to the views module relative to the project root
    const projectRoot = process.cwd();
    return join(projectRoot, 'src', 'views');
  }

}
