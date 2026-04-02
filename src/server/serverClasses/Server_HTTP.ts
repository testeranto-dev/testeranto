import fs from 'fs';
import path from 'path';
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Base } from "./Server_Base";
import { handleOptions } from "./Server_Http/handleOptions";
import { Server_HTTP_Routes } from "./Server_Http/Server_HTTP_Routes";
import {
  serveStaticFile,
} from "./Server_Http/utils/utils";
import { Server_WS } from "./Server_WS";
import { stakeholderWsAPI } from "../../api";
import { GraphManager } from "../graph/index";

declare const Bun: any;

export abstract class Server_HTTP extends Server_Base {
  protected bunServer: any | null = null;
  private routesHandler: Server_HTTP_Routes;
  protected graphManager: GraphManager;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    console.log('[Server_HTTP] Constructor called with configs:',
      configs ? `has runtimes: ${Object.keys(configs.runtimes || {}).length}` : 'configs is null/undefined');
    this.routesHandler = new Server_HTTP_Routes(this);
    this.graphManager = new GraphManager(process.cwd());

    // Save initial empty graph immediately
    console.log('[Server_HTTP] Saving initial empty graph...');
    this.graphManager.saveGraph();
    
    // Also save static graph data file
    const initialGraphData = this.graphManager.getGraphData();
    this.saveGraphDataForStaticMode(initialGraphData);

    // Temporarily disabled: Initialize graph with markdown files if available
    // if (configs.documentationGlob) {
    //   try {
    //     const update = this.graphManager.parseMarkdownFiles(configs.documentationGlob);
    //     this.graphManager.applyUpdate(update);
    //     console.log('[Server_HTTP] Initialized graph from markdown files');
    //   } catch (error) {
    //     console.error('[Server_HTTP] Error initializing graph from markdown files:', error);
    //   }
    // }
  }

  async start(): Promise<void> {
    await super.start();

    // Generate and save graph data immediately on startup
    console.log('[Server_HTTP] Generating initial graph data...');
    try {
      const graphData = this.generateGraphData();
      console.log('[Server_HTTP] Initial graph data generated successfully');
      
      // Save graph data for static mode access
      this.saveGraphDataForStaticMode(graphData.featureGraph || { nodes: [], edges: [] });
    } catch (error) {
      console.error('[Server_HTTP] Error generating initial graph data:', error);
    }

    const port = 3000;

    const serverOptions: any = {
      port,
      idleTimeout: 60,
      fetch: async (request: Request, server: any) => {
        try {
          const response = await this.handleRequest(request, server);

          if (response instanceof Response) {
            return response;
          } else if (response === undefined || response === null) {
            // This happens for successful WebSocket upgrades
            return undefined;
          } else {
            return new Response(
              `Server Error: handleRequest did not return a Response`,
              {
                status: 500,
                headers: { "Content-Type": "text/plain" },
              },
            );
          }
        } catch (error) {
          console.error('[Server_HTTP] Error in fetch handler:', error);
          return new Response(`Server Error: ${error.message}`, {
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
      const wsThis = this as Server_WS;
      serverOptions.websocket = {
        open: (ws: WebSocket) => {
          (wsThis as any).wsClients?.add?.(ws);
          ws.send(
            JSON.stringify({
              type: stakeholderWsAPI.connected.type,
              message: "Connected to Process Manager WebSocket",
              timestamp: new Date().toISOString(),
            }),
          );
        },
        message: (ws: WebSocket, message: object) => {
          const data =
            typeof message === "string"
              ? JSON.parse(message)
              : JSON.parse(message.toString());
          if (ws && typeof ws.send === "function") {
            (wsThis as any).handleWebSocketMessage?.(ws, data);
          }
        },
        close: (ws: WebSocket) => {
          (wsThis as any).wsClients?.delete?.(ws);
        },
        error: (ws: WebSocket, error: Error) => {
          (wsThis as any).wsClients?.delete?.(ws);
        },
      };
    }

    if (typeof Bun !== 'undefined') {
      this.bunServer = Bun.serve(serverOptions);
    } else {
      console.error('Bun is not available');
    }
  }

  async stop() {
    // Save graph before stopping
    if (this.graphManager) {
      this.graphManager.saveGraph();
    }

    if (this.bunServer) {
      this.bunServer.stop();
    }
    await super.stop();
  }

  protected async handleRequest(
    request: Request,
    server?: any,
  ): Promise<Response | undefined> {
    const url = new URL(request.url);

    console.log(`[Server_HTTP] Handling request: ${request.method} ${url.pathname}`);

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
      return await this.handleRouteRequest(request, url);
    } else {
      return await this.serveStaticFile(request, url);
    }
  }

  private async handleRouteRequest(request: Request, url: URL): Promise<Response> {
    const routeName = url.pathname.slice(3);

    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    try {
      const result = await this.routesHandler.handleRoute(routeName, request, url);
      // Ensure we always return a Response
      if (result instanceof Response) {
        return result;
      }
      return new Response(JSON.stringify({ error: "Invalid response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('[Server_HTTP] Error handling route:', error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private async serveStaticFile(request: Request, url: URL): Promise<Response> {
    return serveStaticFile(request, url, this.configs);
  }

  public generateGraphData(): any {
    // Generate graph data based on current configuration and test results
    const configs = this.configs;

    // Get graph data from GraphManager
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };

    // Get test results if available
    const testResults = this.getCurrentTestResults ? this.getCurrentTestResults() : {};

    // Update graph with test results
    if (Object.keys(testResults).length > 0) {
      for (const [runtime, runtimeResults] of Object.entries(testResults as Record<string, any>)) {
        for (const [testName, testResult] of Object.entries(runtimeResults as Record<string, any>)) {
          // Create a combined test result object
          const combinedResult = {
            testName,
            runtime,
            ...testResult
          };
          const update = this.graphManager.updateFromTestResults(combinedResult);
          this.graphManager.applyUpdate(update);
        }
      }
    }

    // If graph has nodes but no edges, generate edges
    if (this.graphManager && graphData.nodes.length > 0 && graphData.edges.length === 0) {
      console.log('[Server_HTTP] Graph has nodes but no edges, generating edges...');
      const update = this.graphManager.generateEdges();
      this.graphManager.applyUpdate(update);
    }

    // Save the graph to disk
    if (this.graphManager) {
      this.graphManager.saveGraph();
      
      // Log graph statistics
      const stats = this.graphManager.getGraphStats();
      console.log(`[Server_HTTP] Graph stats: ${stats.nodes} nodes, ${stats.edges} edges`);
      console.log(`[Server_HTTP] Node types:`, stats.nodeTypes);
      console.log(`[Server_HTTP] Edge types:`, stats.edgeTypes);
    }
    
    // Get updated graph data
    const updatedGraphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
    
    // Log if edges are missing
    if (updatedGraphData.nodes.length > 0 && updatedGraphData.edges.length === 0) {
      console.warn('[Server_HTTP] WARNING: Graph has nodes but no edges!');
    }

    // Also save a standalone graph-data.json file for static mode
    this.saveGraphDataForStaticMode(updatedGraphData);

    return {
      configs: {
        runtimes: configs?.runtimes || {},
        documentationGlob: configs?.documentationGlob,
        stakeholderReactModule: configs?.stakeholderReactModule
      },
      allTestResults: testResults,
      featureTree: this.generateFeatureTree ? this.generateFeatureTree() : {},
      featureGraph: updatedGraphData,
      fileTreeGraph: this.generateFileTreeGraph ? this.generateFileTreeGraph() : { nodes: [], edges: [] },
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
    };
  }

  // Save graph data for static mode access
  private saveGraphDataForStaticMode(graphData: any): void {
    try {
      const projectRoot = process.cwd();
      const filePath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create a standalone graph data object for static mode
      const staticGraphData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          featureGraph: graphData,
          fileTreeGraph: this.generateFileTreeGraph ? this.generateFileTreeGraph() : { nodes: [], edges: [] },
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
      
      fs.writeFileSync(filePath, JSON.stringify(staticGraphData, null, 2), 'utf-8');
      console.log(`[Server_HTTP] Saved static graph data to ${filePath}`);
    } catch (error) {
      console.error('[Server_HTTP] Error saving static graph data:', error);
    }
  }

  protected getCurrentTestResults(): any {
    // Try to get test results from the server
    // This should be implemented by subclasses
    if ((this as any).getTestResults) {
      return (this as any).getTestResults();
    }
    return {};
  }

  protected generateFeatureTree(): any {
    // Generate a tree structure from features
    const graphData = this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };

    const featureNodes = graphData.nodes.filter((node: any) => node.type === 'feature');
    const featureEdges = graphData.edges.filter((edge: any) =>
      edge.attributes.type === 'dependsUpon' || edge.attributes.type === 'blocks'
    );

    const tree: any = {};

    featureNodes.forEach((node: any) => {
      tree[node.id] = {
        ...node,
        children: [],
        parents: []
      };
    });

    featureEdges.forEach((edge: any) => {
      if (edge.attributes.type === 'dependsUpon') {
        // source depends on target
        if (tree[edge.source]) {
          tree[edge.source].parents.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].children.push(edge.source);
        }
      } else if (edge.attributes.type === 'blocks') {
        // source blocks target
        if (tree[edge.source]) {
          tree[edge.source].children.push(edge.target);
        }
        if (tree[edge.target]) {
          tree[edge.target].parents.push(edge.source);
        }
      }
    });

    return tree;
  }

  protected generateFeatureGraph(): any {
    return this.graphManager ? this.graphManager.getGraphData() : { nodes: [], edges: [] };
  }

  protected generateFileTreeGraph(): any {
    // Generate a file tree graph based on the project structure
    // Only include: entry files, input files used by entry files, and feature references (URLs or files)
    const fs = require('fs');
    const path = require('path');

    const projectRoot = process.cwd();
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Track which files/URLs we've already added to avoid duplicates
    const addedItems = new Set<string>();
    
    // Helper to add a file node if not already added
    const addFileNode = (filePath: string) => {
      const relativePath = path.relative(projectRoot, filePath);
      if (addedItems.has(relativePath)) {
        return null;
      }
      
      const nodeId = `file:${relativePath}`;
      const isDirectory = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
      
      nodes.push({
        id: nodeId,
        type: 'file',
        label: path.basename(filePath),
        description: isDirectory ? `Directory: ${relativePath}` : `File: ${relativePath}`,
        metadata: { 
          path: relativePath, 
          isDirectory,
          isEntryFile: false,
          isInputFile: false,
          isFeature: false,
          isUrl: false
        }
      });
      
      addedItems.add(relativePath);
      
      // Add parent directory structure
      if (!isDirectory) {
        const dirPath = path.dirname(filePath);
        const dirRelativePath = path.relative(projectRoot, dirPath);
        const dirNodeId = `file:${dirRelativePath}`;
        
        // Add parent directory if not already added
        if (!addedItems.has(dirRelativePath) && fs.existsSync(dirPath)) {
          nodes.push({
            id: dirNodeId,
            type: 'file',
            label: path.basename(dirPath),
            description: `Directory: ${dirRelativePath}`,
            metadata: { 
              path: dirRelativePath, 
              isDirectory: true,
              isEntryFile: false,
              isInputFile: false,
              isFeature: false,
              isUrl: false
            }
          });
          addedItems.add(dirRelativePath);
          
          // Connect file to directory
          edges.push({
            source: dirNodeId,
            target: nodeId,
            attributes: { type: 'locatedIn' }
          });
        } else if (addedItems.has(dirRelativePath)) {
          // Connect file to existing directory
          edges.push({
            source: dirNodeId,
            target: nodeId,
            attributes: { type: 'locatedIn' }
          });
        }
      }
      
      return nodeId;
    };
    
    // Helper to add a URL node
    const addUrlNode = (url: string) => {
      if (addedItems.has(url)) {
        return null;
      }
      
      const nodeId = `url:${url}`;
      nodes.push({
        id: nodeId,
        type: 'url',
        label: url.split('/').pop() || url,
        description: `URL: ${url}`,
        metadata: { 
          url: url,
          isDirectory: false,
          isEntryFile: false,
          isInputFile: false,
          isFeature: true,
          isUrl: true
        }
      });
      
      addedItems.add(url);
      return nodeId;
    };
    
    // 1. Add entry files (test files from configs)
    const configs = this.configs;
    if (configs?.runtimes) {
      for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
        const tests = (runtimeConfig as any).tests || [];
        for (const testPath of tests) {
          const absoluteTestPath = path.isAbsolute(testPath) ? testPath : path.join(projectRoot, testPath);
          if (fs.existsSync(absoluteTestPath)) {
            const nodeId = addFileNode(absoluteTestPath);
            if (nodeId) {
              // Mark as entry file in metadata
              const nodeIndex = nodes.findIndex(n => n.id === nodeId);
              if (nodeIndex !== -1) {
                nodes[nodeIndex].metadata.isEntryFile = true;
                nodes[nodeIndex].metadata.runtimeKey = runtimeKey;
              }
            }
          }
        }
      }
    }
    
    // 2. Add input files used by entry files
    // We need to get input files from the bundles directory
    const bundlesDir = path.join(projectRoot, 'testeranto', 'bundles');
    if (fs.existsSync(bundlesDir)) {
      try {
        const runtimeDirs = fs.readdirSync(bundlesDir, { withFileTypes: true })
          .filter(item => item.isDirectory())
          .map(dir => dir.name);
        
        for (const runtimeDir of runtimeDirs) {
          const inputFilesPath = path.join(bundlesDir, runtimeDir, 'inputFiles.json');
          if (fs.existsSync(inputFilesPath)) {
            try {
              const inputFilesData = JSON.parse(fs.readFileSync(inputFilesPath, 'utf-8'));
              for (const [testName, testData] of Object.entries(inputFilesData)) {
                if (testData && typeof testData === 'object' && 'files' in testData) {
                  const files = (testData as any).files || [];
                  for (const filePath of files) {
                    const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
                    if (fs.existsSync(absoluteFilePath)) {
                      const nodeId = addFileNode(absoluteFilePath);
                      if (nodeId) {
                        // Mark as input file in metadata
                        const nodeIndex = nodes.findIndex(n => n.id === nodeId);
                        if (nodeIndex !== -1) {
                          nodes[nodeIndex].metadata.isInputFile = true;
                          nodes[nodeIndex].metadata.usedByTest = testName;
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`[Server_HTTP] Error reading input files for ${runtimeDir}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('[Server_HTTP] Error reading bundles directory:', error);
      }
    }
    
    // 3. Add feature references from test results (URLs or files)
    // Get test results to extract feature references
    const testResults = this.getCurrentTestResults();
    if (testResults && typeof testResults === 'object') {
      const featureUrls = new Set<string>();
      
      // Collect all features from test results
      for (const [runtime, runtimeResults] of Object.entries(testResults as Record<string, any>)) {
        if (runtimeResults && typeof runtimeResults === 'object') {
          for (const [testName, testResult] of Object.entries(runtimeResults as Record<string, any>)) {
            if (testResult && typeof testResult === 'object') {
              // Check for features in individualResults
              if (Array.isArray(testResult.individualResults)) {
                for (const individualResult of testResult.individualResults) {
                  if (individualResult && Array.isArray(individualResult.features)) {
                    for (const feature of individualResult.features) {
                      if (typeof feature === 'string') {
                        featureUrls.add(feature);
                      }
                    }
                  }
                }
              }
              // Check for features at the top level
              if (Array.isArray(testResult.features)) {
                for (const feature of testResult.features) {
                  if (typeof feature === 'string') {
                    featureUrls.add(feature);
                  }
                }
              }
            }
          }
        }
      }
      
      // Add feature URLs as nodes
      for (const featureUrl of featureUrls) {
        // Check if it's a URL or a local file path
        if (featureUrl.startsWith('http://') || featureUrl.startsWith('https://')) {
          // It's a URL
          addUrlNode(featureUrl);
        } else {
          // It might be a local file path
          // Check if it exists as a file
          const absoluteFeaturePath = path.isAbsolute(featureUrl) ? featureUrl : path.join(projectRoot, featureUrl);
          if (fs.existsSync(absoluteFeaturePath)) {
            const nodeId = addFileNode(absoluteFeaturePath);
            if (nodeId) {
              // Mark as feature in metadata
              const nodeIndex = nodes.findIndex(n => n.id === nodeId);
              if (nodeIndex !== -1) {
                nodes[nodeIndex].metadata.isFeature = true;
              }
            }
          } else {
            // If it doesn't exist as a file, treat it as a URL or path reference
            addUrlNode(featureUrl);
          }
        }
      }
    }
    
    return { nodes, edges };
  }

  // private async generateCollatedFilesTree(): Promise<Record<string, any>> {
  //   return generateCollatedFilesTree(this.configs);
  // }

  // // private addTestResultsFilesToTree(
  // //   treeRoot: Record<string, any>,
  // //   reportsDir: string,
  // // ): void {
  // //   addTestResultsFilesToTree(treeRoot, reportsDir);
  // // }

  // private getFileType(filename: string): string {
  //   return getFileType(filename);
  // }

  // // private async collectAllTestResults(): Promise<Record<string, any>> {
  // //   return collectAllTestResults(this.configs);
  // // }

  router(a: any): any {
    return a;
  }
}
