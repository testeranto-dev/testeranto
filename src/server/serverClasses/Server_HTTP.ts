import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { HttpManager } from "./Server_Http/HttpManager";
import { Server_Base } from "./Server_Base";
import { Server_WS } from "./Server_WS";
import { Server_HTTP_utils } from "./Server_Http/Server_HTTP_utils";
import { Server_HTTP_Routes } from "./Server_Http/Server_HTTP_Routes";
import fs from "fs";
import path from "path";

export abstract class Server_HTTP extends Server_Base {
  http: HttpManager;
  protected bunServer: ReturnType<typeof Bun.serve> | null = null;
  private routesHandler: Server_HTTP_Routes;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.http = new HttpManager();
    this.routesHandler = new Server_HTTP_Routes(this);
  }

  async start(): Promise<void> {
    await super.start();

    const port = 3000;

    const serverOptions: any = {
      port,
      idleTimeout: 60,
      fetch: async (request: Request, server: any) => {
        const response = this.handleRequest(request, server);

        if (response instanceof Response) {
          return response;
        } else if (response && typeof response.then === 'function') {
          return await response;
        } else if (response === undefined || response === null) {
          return undefined;
        } else {
          return new Response(`Server Error: handleRequest did not return a Response`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          });
        }
      },
      error: (error: Error) => {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      },
    };

    if (this instanceof Server_WS) {
      serverOptions.websocket = {
        open: (ws: WebSocket) => {
          (this as Server_WS).wsClients.add(ws);
          ws.send(JSON.stringify({
            type: "connected",
            message: "Connected to Process Manager WebSocket",
            timestamp: new Date().toISOString()
          }));
        },
        message: (ws: WebSocket, message: object) => {
          const data = typeof message === "string" ?
            JSON.parse(message) :
            JSON.parse(message.toString());
          if (ws && typeof ws.send === 'function') {
            (this as Server_WS).handleWebSocketMessage(ws, data);
          }
        },
        close: (ws: WebSocket) => {
          (this as Server_WS).wsClients.delete(ws);
        },
        error: (ws: WebSocket, error: Error) => {
          (this as Server_WS).wsClients.delete(ws);
        },
      };
    }

    this.bunServer = Bun.serve(serverOptions);
  }

  async stop() {
    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }

  protected handleRequest(request: Request, server?: any): Response | Promise<Response> | undefined {
    const url = new URL(request.url);

    if (request.headers.get("upgrade") === "websocket") {
      if (this instanceof Server_WS && server) {
        const success = server.upgrade(request);
        if (success) {
          return undefined;
        } else {
          return new Response("WebSocket upgrade failed", { status: 500 });
        }
      } else {
        return new Response("WebSocket not supported", { status: 426 });
      }
    }

    if (url.pathname.startsWith("/~/")) {
      return this.handleRouteRequest(request, url);
    } else {
      return this.serveStaticFile(request, url);
    }
  }

  private handleRouteRequest(request: Request, url: URL): Response {
    const routeName = url.pathname.slice(3);

    if (request.method === 'OPTIONS') {
      return Server_HTTP_utils.handleOptions();
    }

    return this.routesHandler.handleRoute(routeName, request, url);
  }

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    const normalizedPath = decodeURIComponent(url.pathname);

    if (normalizedPath.includes("..")) {
      return new Response("Forbidden: Directory traversal not allowed", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const projectRoot = process.cwd();

    if (normalizedPath === '/' || normalizedPath === '/index.html') {
      const reportPath = Server_HTTP_utils.join(projectRoot, 'testeranto', 'reports', 'index.html');
      if (Server_HTTP_utils.existsSync(reportPath)) {
        // Generate collated files tree and test results, then embed in HTML
        const collatedFilesTree = await this.generateCollatedFilesTree();
        const allTestResults = await this.collectAllTestResults();
        const htmlWithData = await Server_HTTP_utils.generateHtmlWithEmbeddedData(
          reportPath,
          this.configs,
          collatedFilesTree,
          allTestResults
        );
        return new Response(htmlWithData, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    if (normalizedPath === '/testeranto/reports/index.html' || normalizedPath === '/testeranto/reports/') {
      const reportPath = Server_HTTP_utils.join(projectRoot, 'testeranto', 'reports', 'index.html');
      if (Server_HTTP_utils.existsSync(reportPath)) {
        // Generate collated files tree and test results, then embed in HTML
        const collatedFilesTree = await this.generateCollatedFilesTree();
        const allTestResults = await this.collectAllTestResults();
        const htmlWithData = await Server_HTTP_utils.generateHtmlWithEmbeddedData(
          reportPath,
          this.configs,
          collatedFilesTree,
          allTestResults
        );
        return new Response(htmlWithData, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    const filePath = Server_HTTP_utils.join(projectRoot, normalizedPath);

    if (!filePath.startsWith(Server_HTTP_utils.resolve(projectRoot))) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    try {
      const stats = await Server_HTTP_utils.stat(filePath);

      if (stats.isDirectory()) {
        const indexPath = Server_HTTP_utils.join(filePath, 'index.html');
        if (Server_HTTP_utils.existsSync(indexPath)) {
          return Server_HTTP_utils.serveFile(indexPath);
        }

        const files = await Server_HTTP_utils.readdir(filePath);

        const items = await Promise.all(
          files.map(async (file) => {
            try {
              const stat = await Server_HTTP_utils.stat(Server_HTTP_utils.join(filePath, file));
              const isDir = stat.isDirectory();
              const slash = isDir ? "/" : "";
              return `<li><a href="${Server_HTTP_utils.join(
                normalizedPath,
                file
              )}${slash}">${file}${slash}</a></li>`;
            } catch {
              return `<li><a href="${Server_HTTP_utils.join(
                normalizedPath,
                file
              )}">${file}</a></li>`;
            }
          })
        );

        const html = `
          <!DOCTYPE html>
          <html>
          <head><title>Directory listing for ${normalizedPath}</title></head>
          <body>
            <h1>Directory listing for ${normalizedPath}</h1>
            <ul>
              ${items.join("")}
            </ul>
          </body>
          </html>
        `;

        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      } else {
        return Server_HTTP_utils.serveFile(filePath);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        if (normalizedPath === '/' || normalizedPath === '/index.html' ||
          normalizedPath === '/testeranto/reports/index.html') {
          const reportPath = Server_HTTP_utils.join(projectRoot, 'testeranto', 'reports', 'index.html');
          if (Server_HTTP_utils.existsSync(reportPath)) {
            return Server_HTTP_utils.serveFile(reportPath);
          }
        }
        return new Response(`File not found: ${normalizedPath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      } else {
        return new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
  }

  private async generateCollatedFilesTree(): Promise<Record<string, any>> {
    // Get all runtimes from configs
    const configs = this.configs;
    if (!configs || !configs.runtimes) {
      return {
        type: 'directory',
        path: '',
        name: 'root',
        children: {}
      };
    }

    // Build a unified tree of all files across all runtimes
    const treeRoot: Record<string, any> = {};

    // For each runtime, fetch input and output files for each test
    const runtimes = configs.runtimes;
    const promises: Promise<void>[] = [];

    for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
      const config = runtimeConfig as any;
      const runtime = config.runtime;
      const tests = config.tests || [];

      for (const testName of tests) {
        promises.push(
          (async () => {
            try {
              // Fetch input files
              const inputResponse = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
              const inputData = inputResponse.ok ? await inputResponse.json() : { inputFiles: [] };
              const inputFiles = inputData.inputFiles || [];

              // Fetch output files
              const outputResponse = await fetch(`http://localhost:3000/~/outputfiles?runtime=${encodeURIComponent(runtime)}&testName=${encodeURIComponent(testName)}`);
              const outputData = outputResponse.ok ? await outputResponse.json() : { outputFiles: [] };
              const outputFiles = outputData.outputFiles || [];

              // Add all input files to the tree
              for (const file of inputFiles) {
                const normalizedPath = file.startsWith('/') ? file.substring(1) : file;
                const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
                
                if (parts.length === 0) continue;
                
                let currentNode = treeRoot;
                
                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i];
                  const isLast = i === parts.length - 1;
                  
                  if (!currentNode[part]) {
                    if (isLast) {
                      currentNode[part] = {
                        type: 'file',
                        path: file,
                        name: part,
                        runtime,
                        testName,
                        fileType: 'input'
                      };
                    } else {
                      currentNode[part] = {
                        type: 'directory',
                        name: part,
                        path: parts.slice(0, i + 1).join('/'),
                        children: {}
                      };
                    }
                  } else if (isLast) {
                    // If it's already a file, update with additional info
                    if (currentNode[part].type === 'file') {
                      // Keep existing info, but add runtime and testName if not present
                      if (!currentNode[part].runtimes) {
                        currentNode[part].runtimes = [];
                      }
                      if (!currentNode[part].runtimes.includes(runtime)) {
                        currentNode[part].runtimes.push(runtime);
                      }
                      if (!currentNode[part].tests) {
                        currentNode[part].tests = [];
                      }
                      if (!currentNode[part].tests.includes(testName)) {
                        currentNode[part].tests.push(testName);
                      }
                    }
                  }
                  
                  if (!isLast && currentNode[part].type === 'directory') {
                    currentNode = currentNode[part].children;
                  }
                }
              }

              // Add all output files to the tree
              for (const file of outputFiles) {
                const normalizedPath = file.startsWith('/') ? file.substring(1) : file;
                const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');
                
                if (parts.length === 0) continue;
                
                let currentNode = treeRoot;
                
                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i];
                  const isLast = i === parts.length - 1;
                  
                  if (!currentNode[part]) {
                    if (isLast) {
                      currentNode[part] = {
                        type: 'file',
                        path: file,
                        name: part,
                        runtime,
                        testName,
                        fileType: 'output'
                      };
                    } else {
                      currentNode[part] = {
                        type: 'directory',
                        name: part,
                        path: parts.slice(0, i + 1).join('/'),
                        children: {}
                      };
                    }
                  } else if (isLast) {
                    // If it's already a file, update with additional info
                    if (currentNode[part].type === 'file') {
                      // Keep existing info, but add runtime and testName if not present
                      if (!currentNode[part].runtimes) {
                        currentNode[part].runtimes = [];
                      }
                      if (!currentNode[part].runtimes.includes(runtime)) {
                        currentNode[part].runtimes.push(runtime);
                      }
                      if (!currentNode[part].tests) {
                        currentNode[part].tests = [];
                      }
                      if (!currentNode[part].tests.includes(testName)) {
                        currentNode[part].tests.push(testName);
                      }
                      // Update fileType to include both if needed
                      if (currentNode[part].fileType === 'input') {
                        // If it was already marked as input, now it's both
                        currentNode[part].fileType = 'both';
                      } else if (currentNode[part].fileType !== 'both') {
                        currentNode[part].fileType = 'output';
                      }
                    }
                  }
                  
                  if (!isLast && currentNode[part].type === 'directory') {
                    currentNode = currentNode[part].children;
                  }
                }
              }
            } catch (error) {
              console.error(`Error processing ${runtimeKey}/${testName}:`, error);
            }
          })()
        );
      }
    }

    // Wait for all fetches to complete
    await Promise.all(promises);
    
    // Also add test results files from the reports directory
    const reportsDir = path.join(process.cwd(), 'testeranto', 'reports');
    if (fs.existsSync(reportsDir)) {
      this.addTestResultsFilesToTree(treeRoot, reportsDir);
    }
    
    // Convert the tree to the format expected by the stakeholder app
    const convertTree = (node: Record<string, any>, currentPath: string = ''): any => {
      if (node.type === 'file') {
        const result: any = {
          type: 'file',
          path: node.path,
          name: node.name || path.basename(node.path),
          fileType: node.fileType || 'file',
          runtime: node.runtime,
          testName: node.testName,
        };
        
        // Only try to parse JSON files that are likely test results
        const isJsonFile = node.path && (
          node.path.endsWith('.json') || 
          node.path.endsWith('tests.json') ||
          path.basename(node.path) === 'tests.json'
        );
        
        // Check if it's a test results file (in reports directory)
        const isInReportsDir = node.path && node.path.includes('testeranto/reports/');
        const isTestResultsFile = isJsonFile && isInReportsDir;
        
        if (isTestResultsFile && node.path) {
          try {
            const content = fs.readFileSync(node.path, 'utf-8');
            // First, check if the content looks like JSON
            const trimmedContent = content.trim();
            if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
              const testData = JSON.parse(content);
              result.testData = testData;
              result.fileType = 'test-results';
            } else {
              // Not valid JSON, keep as regular file
              console.log(`File ${node.path} is not valid JSON, skipping parse`);
            }
          } catch (error) {
            // If parsing fails, it's not a valid JSON file
            console.log(`Error parsing JSON from ${node.path}:`, error.message);
            // Keep as regular file, don't set testData
          }
        }
        
        return result;
      } else if (node.type === 'directory') {
        const children: Record<string, any> = {};
        for (const [childName, childNode] of Object.entries(node.children || {})) {
          children[childName] = convertTree(childNode as Record<string, any>, 
            currentPath ? `${currentPath}/${childName}` : childName);
        }
        return {
          type: 'directory',
          path: node.path || currentPath,
          name: node.name || path.basename(currentPath) || 'root',
          children: children
        };
      }
      return node;
    };

    // Convert the entire tree
    const convertedTree: Record<string, any> = {};
    for (const [key, node] of Object.entries(treeRoot)) {
      convertedTree[key] = convertTree(node as Record<string, any>, key);
    }
    
    // Return as a single root node
    return {
      type: 'directory',
      path: '',
      name: 'root',
      children: convertedTree
    };
  }

  private addTestResultsFilesToTree(treeRoot: Record<string, any>, reportsDir: string): void {
    const addFilesToTree = (dir: string, relativePath: string = '') => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
          
          if (stat.isDirectory()) {
            addFilesToTree(fullPath, itemRelativePath);
          } else {
            // Add ALL files, including logs
            const fileType = this.getFileType(item);
            
            // Add file to tree
            const parts = itemRelativePath.split('/').filter(part => part.length > 0);
            if (parts.length === 0) continue;
            
            let currentNode = treeRoot;
            
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              const isLast = i === parts.length - 1;
              
              if (!currentNode[part]) {
                if (isLast) {
                  currentNode[part] = {
                    type: 'file',
                    path: fullPath,
                    name: part,
                    fileType: fileType
                  };
                } else {
                  currentNode[part] = {
                    type: 'directory',
                    name: part,
                    path: parts.slice(0, i + 1).join('/'),
                    children: {}
                  };
                }
              }
              
              if (!isLast && currentNode[part].type === 'directory') {
                currentNode = currentNode[part].children;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
      }
    };
    
    addFilesToTree(reportsDir);
  }

  private getFileType(filename: string): string {
    if (filename === 'tests.json' || (filename.endsWith('.json') && filename.includes('test'))) {
      return 'test-results';
    } else if (filename.endsWith('.log')) {
      return 'log';
    } else if (filename.endsWith('.html')) {
      return 'html';
    } else if (filename.endsWith('.json')) {
      return 'json';
    } else if (filename.endsWith('.md')) {
      return 'documentation';
    } else if (filename.endsWith('.ts') || filename.endsWith('.js') || filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      return 'javascript';
    } else if (filename.endsWith('.rb')) {
      return 'ruby';
    } else if (filename.endsWith('.py')) {
      return 'python';
    } else if (filename.endsWith('.go')) {
      return 'golang';
    } else if (filename.endsWith('.rs')) {
      return 'rust';
    } else if (filename.endsWith('.java')) {
      return 'java';
    } else {
      return 'file';
    }
  }

  private async collectAllTestResults(): Promise<Record<string, any>> {
    const configs = this.configs;
    if (!configs || !configs.runtimes) {
      return {};
    }

    const allTestResults: Record<string, any> = {};
    const runtimes = configs.runtimes;
    const reportsDir = path.join(process.cwd(), 'testeranto', 'reports');

    // Helper function to find all tests.json files
    const findAllTestsJsonFiles = (dir: string): string[] => {
      let results: string[] = [];
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              results = results.concat(findAllTestsJsonFiles(fullPath));
            } else if (item === 'tests.json') {
              results.push(fullPath);
            }
          } catch {
            // Skip if we can't stat
          }
        }
      } catch {
        // Skip if we can't read directory
      }
      return results;
    };

    // First, collect all tests.json files
    const allTestsJsonFiles = findAllTestsJsonFiles(reportsDir);

    // Process each runtime and test
    for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
      const config = runtimeConfig as any;
      const runtime = config.runtime;
      const tests = config.tests || [];

      if (!allTestResults[runtimeKey]) {
        allTestResults[runtimeKey] = {};
      }

      for (const testName of tests) {
        // Try to find a matching tests.json file
        let found = false;
        for (const filePath of allTestsJsonFiles) {
          // Only process actual JSON files
          if (!filePath.endsWith('.json') && !filePath.endsWith('tests.json')) {
            continue;
          }
          
          const normalizedPath = filePath.toLowerCase();
          const runtimeLower = runtime.toLowerCase();
          const testNameLower = testName.toLowerCase();
          
          // Extract test name from path (last directory before tests.json)
          const dirName = path.dirname(filePath);
          const lastDir = path.basename(dirName).toLowerCase();
          
          // Check various patterns
          const containsRuntime = normalizedPath.includes(runtimeLower);
          const containsTestName = normalizedPath.includes(testNameLower) || 
                                   lastDir.includes(testNameLower.replace(/\./g, '')) ||
                                   testNameLower.includes(lastDir);
          
          if (containsRuntime && containsTestName) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              // Check if content is valid JSON before parsing
              const trimmedContent = content.trim();
              if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
                const testData = JSON.parse(content);
                allTestResults[runtimeKey][testName] = testData;
                found = true;
                break;
              } else {
                console.log(`File ${filePath} is not valid JSON, skipping`);
              }
            } catch (error) {
              console.error(`Error reading test results from ${filePath}:`, error.message);
            }
          }
        }
        
        // If not found, try to find in runtime directory
        if (!found) {
          const runtimeDir = path.join(reportsDir, runtime);
          if (fs.existsSync(runtimeDir)) {
            const runtimeTestsJsonFiles = findAllTestsJsonFiles(runtimeDir);
            for (const filePath of runtimeTestsJsonFiles) {
              try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const testData = JSON.parse(content);
                allTestResults[runtimeKey][testName] = testData;
                found = true;
                break;
              } catch (error) {
                // Continue
              }
            }
          }
        }
        
        // If still not found, leave empty
        if (!found) {
          console.log(`No test results found for ${runtimeKey}/${testName}`);
        }
      }
    }

    return allTestResults;
  }

  router(a: any): any {
    return a;
  }
}
