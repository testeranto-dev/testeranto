import fs from "fs";
import path from "path";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { HttpManager } from "./HttpManager";
import { Server_Base } from "./Server_Base";
import { Server_WS } from "./Server_WS";
import { CONTENT_TYPES, getContentType } from "./tcp";

export abstract class Server_HTTP extends Server_Base {
  http: HttpManager;
  protected bunServer: ReturnType<typeof Bun.serve> | null = null;
  routes: any;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.http = new HttpManager();
    this.routes = {
      'processes': {
        method: 'GET',
        handler: () => this.handleHttpGetProcesses()
      }
    };
  }

  private handleHttpGetProcesses(): Response {
    const getProcessSummary = (this as any).getProcessSummary;
    if (typeof getProcessSummary !== 'function') {
      return this.jsonResponse({
        error: 'getProcessSummary method not available',
        processes: [],
        total: 0,
        message: 'Server does not support process listing'
      }, 503);
    }

    const processSummary = getProcessSummary();

    if (processSummary?.error) {
      return this.jsonResponse({
        error: processSummary.error,
        processes: [],
        total: 0,
        message: processSummary.message || 'Error retrieving docker processes'
      }, 503);
    }

    const formattedProcesses = (processSummary?.processes || []).map((process: any) => ({
      name: process.processId || process.containerId,
      status: process.status || process.state,
      state: process.state,
      image: process.image,
      ports: process.ports,
      exitCode: process.exitCode,
      isActive: process.isActive,
      runtime: process.runtime,
      startedAt: process.startedAt,
      finishedAt: process.finishedAt
    }));

    return this.jsonResponse({
      processes: formattedProcesses,
      total: processSummary?.total || formattedProcesses.length,
      message: processSummary?.message || 'Success'
    });
  }

  private handleHttpGetOutputFiles(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    console.log(`[Server_HTTP] handleHttpGetOutputFiles: runtime=${runtime}, testName=${testName}`);

    if (!runtime || !testName) {
      console.log(`[Server_HTTP] Missing runtime or testName parameters`);
      return this.jsonResponse({
        error: 'Missing runtime or testName query parameters'
      }, 400);
    }

    const getOutputFiles = (this as any).getOutputFiles;
    if (typeof getOutputFiles === 'function') {
      console.log(`[Server_HTTP] Using getOutputFiles method`);
      const outputFiles = getOutputFiles(runtime, testName);
      console.log(`[Server_HTTP] Found ${outputFiles?.length || 0} output files via method`);
      return this.jsonResponse({
        runtime,
        testName,
        outputFiles: outputFiles || [],
        message: 'Success'
      });
    }

    console.log(`[Server_HTTP] getOutputFiles method not available, falling back to directory scan`);
    const outputDir = path.join(process.cwd(), 'testeranto', 'reports', runtime);
    console.log(`[Server_HTTP] Looking in directory: ${outputDir}`);

    if (!fs.existsSync(outputDir)) {
      console.log(`[Server_HTTP] Output directory does not exist`);
      return this.jsonResponse({
        error: 'getOutputFiles method not available and directory not found',
        runtime,
        testName,
        outputFiles: [],
        message: 'No output files found'
      }, 404);
    }

    const files = fs.readdirSync(outputDir);
    console.log(`[Server_HTTP] Found ${files.length} files in output directory`);

    const searchPattern = testName.replace('/', '_').replace('.', '-');
    console.log(`[Server_HTTP] Looking for files containing: ${searchPattern}`);

    const testFiles = files.filter((file: string) =>
      file.includes(searchPattern)
    );

    console.log(`[Server_HTTP] Found ${testFiles.length} matching files`);

    const projectRoot = process.cwd();
    const relativePaths = testFiles.map((file: string) => {
      const absolutePath = path.join(outputDir, file);
      let relativePath = path.relative(projectRoot, absolutePath);
      relativePath = relativePath.split(path.sep).join('/');
      return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    });

    console.log(`[Server_HTTP] Returning ${relativePaths.length} output files`);
    return this.jsonResponse({
      runtime,
      testName,
      outputFiles: relativePaths || [],
      message: 'Success (from directory)'
    });
  }

  private handleHttpGetTestResults(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    console.log(`[Server_HTTP] handleHttpGetTestResults: runtime=${runtime}, testName=${testName}`);

    const getTestResults = (this as any).getTestResults;
    if (typeof getTestResults !== 'function') {
      console.log(`[Server_HTTP] getTestResults method not available`);
      return this.jsonResponse({
        error: 'Test results functionality not available',
        testResults: [],
        message: 'Server does not support test results'
      }, 503);
    }

    // If runtime and testName are provided, return specific test results
    if (runtime && testName) {
      console.log(`[Server_HTTP] Looking for specific test results for ${runtime}/${testName}`);
      const testResults = getTestResults(runtime, testName);
      console.log(`[Server_HTTP] Found ${testResults?.length || 0} test results`);
      return this.jsonResponse({
        runtime,
        testName,
        testResults: testResults || [],
        message: 'Success'
      });
    }

    // If no parameters, we need to get all test results
    // Since getTestResults requires runtime and testName, we need to get all runtimes and tests
    console.log(`[Server_HTTP] No parameters provided, returning all test results`);
    
    // Get all runtimes from configs
    const configs = this.configs;
    if (!configs || !configs.runtimes) {
      console.log(`[Server_HTTP] No runtimes configured`);
      return this.jsonResponse({
        testResults: [],
        message: 'No runtimes configured'
      });
    }

    const allTestResults: any[] = [];

    // For each runtime and test, call getTestResults
    for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
      const runtime = (runtimeConfig as any).runtime;
      const tests = (runtimeConfig as any).tests || [];
      
      for (const testName of tests) {
        console.log(`[Server_HTTP] Getting test results for ${runtime}/${testName}`);
        try {
          const testResults = getTestResults(runtime, testName);
          if (testResults && Array.isArray(testResults)) {
            allTestResults.push(...testResults);
          }
        } catch (error) {
          console.error(`[Server_HTTP] Error getting test results for ${runtime}/${testName}:`, error);
        }
      }
    }

    console.log(`[Server_HTTP] Returning ${allTestResults.length} total test results`);
    return this.jsonResponse({
      testResults: allTestResults,
      message: 'Success (all test results)'
    });
  }

  private handleHttpGetInputFiles(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    console.log(`[Server_HTTP] handleHttpGetInputFiles: runtime="${runtime}", testName="${testName}"`);

    if (!runtime || !testName) {
      console.log(`[Server_HTTP] Missing runtime or testName parameters`);
      return this.jsonResponse({
        error: 'Missing runtime or testName query parameters'
      }, 400);
    }

    const getInputFiles = (this as any).getInputFiles;
    if (typeof getInputFiles !== 'function') {
      console.log(`[Server_HTTP] getInputFiles method not available`);
      throw new Error('getInputFiles does not exist on this instance');
    }

    console.log(`[Server_HTTP] Calling getInputFiles with runtime="${runtime}", testName="${testName}"`);
    const inputFiles = getInputFiles(runtime, testName);
    console.log(`[Server_HTTP] Found ${inputFiles?.length || 0} input files for runtime="${runtime}", testName="${testName}"`);
    
    return this.jsonResponse({
      runtime,
      testName,
      inputFiles: inputFiles || [],
      message: 'Success'
    });
  }

  private handleHttpGetAiderProcesses(): Response {
    const handleAiderProcesses = (this as any).handleAiderProcesses;
    const getAiderProcesses = (this as any).getAiderProcesses;

    if (typeof handleAiderProcesses === 'function') {
      const result = handleAiderProcesses();
      return this.jsonResponse({
        aiderProcesses: result.aiderProcesses || [],
        message: result.message || 'Success'
      });
    } else if (typeof getAiderProcesses === 'function') {
      const aiderProcesses = getAiderProcesses();
      return this.jsonResponse({
        aiderProcesses: aiderProcesses || [],
        message: 'Success'
      });
    } else {
      return this.jsonResponse({
        aiderProcesses: [],
        message: 'Aider processes not available'
      });
    }
  }

  private handleHttpGetConfigs(): Response {
    if (!this.configs) {
      return this.jsonResponse({
        error: 'configs property not available',
        message: 'Server does not have configs'
      }, 503);
    }

    return this.jsonResponse({
      configs: this.configs,
      message: 'Success'
    });
  }

  private handleHttpGetDocumentation(): Response {
    const server = this as any;
    if (typeof server.getDocumentationFiles === 'function') {
      const files = server.getDocumentationFiles();
      console.log(`[Server_HTTP] handleHttpGetDocumentation returning ${files.length} files`);
      return this.jsonResponse({
        files: files || [],
        message: 'Success',
        count: files.length
      });
    }

    const docPath = path.join(process.cwd(), 'testeranto', 'documentation.json');
    if (fs.existsSync(docPath)) {
      try {
        const content = fs.readFileSync(docPath, 'utf-8');
        const data = JSON.parse(content);
        console.log(`[Server_HTTP] handleHttpGetDocumentation read ${data.files?.length || 0} files from file`);
        return this.jsonResponse({
          files: data.files || [],
          message: 'Success (from file)',
          count: data.files?.length || 0
        });
      } catch (error) {
        console.error(`[Server_HTTP] Failed to read documentation file: ${error}`);
        return this.jsonResponse({
          error: 'Failed to read documentation file',
          message: String(error)
        }, 500);
      }
    }

    console.log('[Server_HTTP] No documentation configured or server not ready');
    return this.jsonResponse({
      files: [],
      message: 'No documentation configured or server not ready'
    });
  }

  private handleHttpGetHtmlReport(): Response {
    const workspaceRoot = process.cwd();
    const reportsDir = path.join(workspaceRoot, 'testeranto', 'reports');
    const reportPath = path.join(reportsDir, 'index.html');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Testeranto Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .test { margin: 20px 0; padding: 10px; border-left: 4px solid #ccc; }
        .passed { border-left-color: #4CAF50; }
        .failed { border-left-color: #f44336; }
        .feature { background: #f5f5f5; padding: 5px; margin: 5px 0; }
        .documentation { margin: 10px 0; padding: 10px; background: #f0f8ff; }
    </style>
</head>
<body>
    <h1>Testeranto Test Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <div id="content">
        <div class="documentation">
            <h2>Documentation</h2>
            <p>Documentation files are shown here for stakeholders.</p>
        </div>
        <div class="test">
            <h3>Test Results</h3>
            <p>Test results will be displayed here in a future update.</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);

    return this.jsonResponse({
      message: 'HTML report generated successfully',
      path: reportPath,
      url: `/testeranto/reports/index.html`
    });
  }

  private jsonResponse(data: any, status = 200): Response {
    const responseData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  private handleOptions(): Response {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  async start(): Promise<void> {
    await super.start();

    const port = 3000;

    const serverOptions: any = {
      port,
      idleTimeout: 60, // Increase from default 10 seconds to 60 seconds
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
      return this.handleOptions();
    }

    const routeHandlers: Record<string, () => Response> = {
      'processes': () => this.handleHttpGetProcesses(),
      'configs': () => this.handleHttpGetConfigs(),
      'documentation': () => this.handleHttpGetDocumentation(),
      'aider-processes': () => this.handleHttpGetAiderProcesses(),
      'outputfiles': () => this.handleHttpGetOutputFiles(request, url),
      'inputfiles': () => this.handleHttpGetInputFiles(request, url),
      'testresults': () => this.handleHttpGetTestResults(request, url),
      'html-report': () => this.handleHttpGetHtmlReport(),
    };

    const handler = routeHandlers[routeName];
    if (handler) {
      if (request.method !== 'GET') {
        return new Response(`Method ${request.method} not allowed`, {
          status: 405,
          headers: {
            'Allow': 'GET, OPTIONS',
            'Content-Type': 'text/plain'
          }
        });
      }
      return handler();
    }

    const match = this.http.matchRoute(routeName, this.routes);
    if (match) {
      const nodeReq = {
        url: url.pathname,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body,
        params: match.params
      };

      const response = {
        writeHead: (status: number, headers: Record<string, string>) => {
          return new Response(null, { status, headers });
        },
        end: (body: string) => {
          return new Response(body, {
            status: 200,
            headers: { "Content-Type": "text/plain" }
          });
        }
      };

      const result = match.handler(nodeReq, response);
      if (result instanceof Response) {
        return result;
      }
      return result as Response;
    }

    return new Response(`Route not found: /~/${routeName}`, {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
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
    const filePath = path.join(projectRoot, normalizedPath);

    if (!filePath.startsWith(path.resolve(projectRoot))) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        const files = await fs.promises.readdir(filePath);

        const items = await Promise.all(
          files.map(async (file) => {
            try {
              const stat = await fs.promises.stat(path.join(filePath, file));
              const isDir = stat.isDirectory();
              const slash = isDir ? "/" : "";
              return `<li><a href="${path.join(
                normalizedPath,
                file
              )}${slash}">${file}${slash}</a></li>`;
            } catch {
              return `<li><a href="${path.join(
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
        return this.serveFile(filePath);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
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

  private async serveFile(filePath: string): Promise<Response> {
    const contentType = getContentType(filePath) || CONTENT_TYPES.OCTET_STREAM;

    try {
      const file = await Bun.file(filePath).arrayBuffer();
      return new Response(file, {
        status: 200,
        headers: { "Content-Type": contentType },
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return new Response(`File not found: ${filePath}`, {
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

  router(a: any): any {
    return a;
  }
}
