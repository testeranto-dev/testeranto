import fs from "fs";
import path from "path";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import { HttpManager } from "./HttpManager";
import { Server_Base } from "./Server_Base";
import { Server_WS } from "./Server_WS";
import { CONTENT_TYPES, getContentType } from "./tcp";
import { Server_HTTP_utils } from "./Server_HTTP_utils";

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
    console.log(`[DEBUG] handleHttpGetProcesses called`);

    const getProcessSummary = (this as any).getProcessSummary;
    if (typeof getProcessSummary !== 'function') {
      console.log(`[DEBUG] getProcessSummary method not available`);
      return Server_HTTP_utils.jsonResponse({
        error: 'getProcessSummary method not available',
        processes: [],
        total: 0,
        message: 'Server does not support process listing'
      }, 503);
    }

    const processSummary = getProcessSummary();
    // console.log(`[DEBUG] getProcessSummary returned:`, processSummary);

    if (processSummary?.error) {
      console.log(`[DEBUG] Process summary has error:`, processSummary.error);
      return Server_HTTP_utils.jsonResponse({
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

    console.log(`[DEBUG] Formatted ${formattedProcesses.length} processes`);

    return Server_HTTP_utils.jsonResponse({
      processes: formattedProcesses,
      total: processSummary?.total || formattedProcesses.length,
      message: processSummary?.message || 'Success'
    });
  }

  private handleHttpGetOutputFiles(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    console.log(`[DEBUG] handleHttpGetOutputFiles: runtime=${runtime}, testName=${testName}`);

    if (!runtime || !testName) {
      console.log(`[DEBUG] Missing runtime or testName parameters`);
      return this.jsonResponse({
        error: 'Missing runtime or testName query parameters'
      }, 400);
    }

    const getOutputFiles = (this as any).getOutputFiles;
    if (typeof getOutputFiles === 'function') {
      console.log(`[DEBUG] Using getOutputFiles method`);
      const outputFiles = getOutputFiles(runtime, testName);
      console.log(`[DEBUG] getOutputFiles returned:`, outputFiles);
      return this.jsonResponse({
        runtime,
        testName,
        outputFiles: outputFiles || [],
        message: 'Success'
      });
    }

    console.log(`[DEBUG] getOutputFiles method not available, falling back to directory scan`);
    const outputDir = path.join(process.cwd(), 'testeranto', 'reports', runtime);
    console.log(`[DEBUG] Looking in directory: ${outputDir}`);

    if (!fs.existsSync(outputDir)) {
      console.log(`[DEBUG] Output directory does not exist`);
      return this.jsonResponse({
        error: 'getOutputFiles method not available and directory not found',
        runtime,
        testName,
        outputFiles: [],
        message: 'No output files found'
      }, 404);
    }

    const files = fs.readdirSync(outputDir);
    console.log(`[DEBUG] Found ${files.length} files in output directory:`, files);

    const searchPattern = testName.replace('/', '_').replace('.', '-');
    console.log(`[DEBUG] Looking for files containing: ${searchPattern}`);

    const testFiles = files.filter((file: string) =>
      file.includes(searchPattern)
    );

    console.log(`[DEBUG] Found ${testFiles.length} matching files:`, testFiles);

    const projectRoot = process.cwd();
    const relativePaths = testFiles.map((file: string) => {
      const absolutePath = path.join(outputDir, file);
      let relativePath = path.relative(projectRoot, absolutePath);
      relativePath = relativePath.split(path.sep).join('/');
      return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    });

    console.log(`[DEBUG] Returning ${relativePaths.length} output files:`, relativePaths);
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

    console.log(`[DEBUG] handleHttpGetTestResults: runtime=${runtime}, testName=${testName}`);

    const getTestResults = (this as any).getTestResults;
    if (typeof getTestResults !== 'function') {
      console.log(`[DEBUG] getTestResults method not available`);
      return this.jsonResponse({
        error: 'Test results functionality not available',
        testResults: [],
        message: 'Server does not support test results'
      }, 503);
    }

    // If runtime and testName are provided, return specific test results
    if (runtime && testName) {
      console.log(`[DEBUG] Looking for specific test results for ${runtime}/${testName}`);
      const testResults = getTestResults(runtime, testName);
      console.log(`[DEBUG] getTestResults returned:`, testResults);
      return this.jsonResponse({
        runtime,
        testName,
        testResults: testResults || [],
        message: 'Success'
      });
    }

    // If no parameters, we need to get all test results
    console.log(`[DEBUG] No parameters provided, returning all test results`);

    // Get all runtimes from configs
    const configs = this.configs;
    if (!configs || !configs.runtimes) {
      console.log(`[DEBUG] No runtimes configured`);
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
        console.log(`[DEBUG] Getting test results for ${runtime}/${testName}`);
        try {
          const testResults = getTestResults(runtime, testName);
          console.log(`[DEBUG] Results for ${runtime}/${testName}:`, testResults);
          if (testResults && Array.isArray(testResults)) {
            allTestResults.push(...testResults);
          }
        } catch (error) {
          console.error(`[DEBUG] Error getting test results for ${runtime}/${testName}:`, error);
        }
      }
    }

    console.log(`[DEBUG] Returning ${allTestResults.length} total test results`);
    return this.jsonResponse({
      testResults: allTestResults,
      message: 'Success (all test results)'
    });
  }

  private handleHttpGetCollatedAllFiles(): Response {
    console.log(`[DEBUG] handleHttpGetCollatedAllFiles called`);

    // Get all file types
    const docsTree = this.getCollatedDocumentationTree();
    const inputTree = this.getCollatedInputFilesTree();
    const resultsTree = this.getCollatedTestResultsTree();
    const reportsTree = this.getReportsTree();

    // Merge all trees
    const mergedTree = Server_HTTP_utils.mergeAllFileTrees([docsTree, inputTree, resultsTree, reportsTree]);

    console.log(`[DEBUG] Returning unified files tree`);
    return this.jsonResponse({
      tree: mergedTree,
      message: 'Success'
    });
  }

  private getCollatedDocumentationTree(): Record<string, any> {
    try {
      const response = this.handleHttpGetCollatedDocumentation();
      // Since handleHttpGetCollatedDocumentation returns a Response, we need to extract data differently
      // For now, return empty tree - the actual implementation would need to be refactored
      return {};
    } catch (error) {
      console.error(`[DEBUG] Error getting documentation tree:`, error);
      return {};
    }
  }

  private getCollatedInputFilesTree(): Record<string, any> {
    try {
      const response = this.handleHttpGetCollatedInputFiles();
      // Similar issue - need to refactor to return data directly
      return {};
    } catch (error) {
      console.error(`[DEBUG] Error getting input files tree:`, error);
      return {};
    }
  }

  private getCollatedTestResultsTree(): Record<string, any> {
    try {
      const response = this.handleHttpGetCollatedTestResults();
      // Similar issue - need to refactor to return data directly
      return {};
    } catch (error) {
      console.error(`[DEBUG] Error getting test results tree:`, error);
      return {};
    }
  }

  private getReportsTree(): Record<string, any> {
    const reportsDir = path.join(process.cwd(), 'testeranto', 'reports');
    return Server_HTTP_utils.buildFilesystemTree(reportsDir);
  }

  private buildFilesystemTree(dirPath: string): Record<string, any> {
    const tree: Record<string, any> = {};

    if (!fs.existsSync(dirPath)) {
      return tree;
    }

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (stat.isDirectory()) {
          tree[item] = {
            type: 'directory',
            children: this.buildFilesystemTree(fullPath)
          };
        } else {
          tree[item] = {
            type: 'file',
            path: relativePath,
            isJson: item.endsWith('.json'),
            isHtml: item.endsWith('.html'),
            isMd: item.endsWith('.md')
          };
        }
      }
    } catch (error) {
      console.error(`[DEBUG] Error building filesystem tree for ${dirPath}:`, error);
    }

    return tree;
  }

  private mergeAllFileTrees(trees: Record<string, any>[]): Record<string, any> {
    const merged: Record<string, any> = {};

    for (const tree of trees) {
      this.mergeFileTree(merged, tree);
    }

    return merged;
  }

  private mergeFileTree(target: Record<string, any>, source: Record<string, any>): void {
    for (const [key, sourceNode] of Object.entries(source)) {
      if (!target[key]) {
        target[key] = { ...sourceNode };
        if (sourceNode.children) {
          target[key].children = {};
        }
      } else if (sourceNode.type === 'directory' && target[key].type === 'directory') {
        // Merge children
        if (sourceNode.children) {
          if (!target[key].children) {
            target[key].children = {};
          }
          this.mergeFileTree(target[key].children, sourceNode.children);
        }
      }
      // If both are files, keep the first one (don't overwrite)
    }
  }

  private handleHttpGetCollatedTestResults(): Response {
    console.log(`[DEBUG] handleHttpGetCollatedTestResults called`);

    const getTestResults = (this as any).getTestResults;
    if (typeof getTestResults !== 'function') {
      console.log(`[DEBUG] getTestResults method not available`);
      return this.jsonResponse({
        error: 'Test results functionality not available',
        collatedTestResults: {},
        message: 'Server does not support test results'
      }, 503);
    }

    // Get all runtimes from configs
    const configs = this.configs;
    if (!configs || !configs.runtimes) {
      console.log(`[DEBUG] No runtimes configured`);
      return this.jsonResponse({
        collatedTestResults: {},
        message: 'No runtimes configured'
      });
    }

    const collatedTestResults: Record<string, any> = {};

    // For each runtime and test, call getTestResults
    for (const [runtimeKey, runtimeConfig] of Object.entries(configs.runtimes)) {
      const runtime = (runtimeConfig as any).runtime;
      const tests = (runtimeConfig as any).tests || [];

      if (!collatedTestResults[runtimeKey]) {
        collatedTestResults[runtimeKey] = {
          runtime: runtime,
          tests: {},
          files: []
        };
      }

      // Get all files for this configKey (runtimeKey is actually configKey)
      const allFiles = getTestResults(runtimeKey);
      console.log(`[DEBUG] Found ${allFiles.length} files for configKey ${runtimeKey}`);

      // Organize files by test
      const filesByTest: Record<string, any[]> = {};
      const allFilesList: any[] = [];

      for (const file of allFiles) {
        // Only include files from this configKey
        if (file.configKey === runtimeKey) {
          allFilesList.push({
            name: file.file,
            path: file.relativePath,
            isJson: file.isJson,
            size: file.size,
            modified: file.modified,
            testName: file.testName,
            result: file.result
          });

          // Group by test name
          const testName = file.testName || 'unknown';
          if (!filesByTest[testName]) {
            filesByTest[testName] = [];
          }
          filesByTest[testName].push(file);
        }
      }

      collatedTestResults[runtimeKey].files = allFilesList;

      // Process each test
      for (const testName of tests) {
        console.log(`[DEBUG] Getting test results for ${runtimeKey}/${testName}`);
        try {
          const testFiles = filesByTest[testName] || [];
          const testResults = testFiles.filter(file => file.isJson && file.result);

          console.log(`[DEBUG] Found ${testFiles.length} files, ${testResults.length} JSON results for ${runtimeKey}/${testName}`);

          collatedTestResults[runtimeKey].tests[testName] = {
            testName: testName,
            files: testFiles.map(file => ({
              name: file.file,
              path: file.relativePath,
              isJson: file.isJson,
              size: file.size,
              modified: file.modified
            })),
            results: testResults.map(file => file.result),
            count: testResults.length,
            fileCount: testFiles.length
          };
        } catch (error: any) {
          console.error(`[DEBUG] Error getting test results for ${runtimeKey}/${testName}:`, error);
          collatedTestResults[runtimeKey].tests[testName] = {
            testName: testName,
            files: [],
            results: [],
            count: 0,
            fileCount: 0,
            error: error.message
          };
        }
      }

      // Also include files that don't belong to any specific test
      const otherFiles = allFiles.filter((file: any) => {
        const fileTestName = file.testName || '';
        return file.configKey === runtimeKey && !tests.some((t: string) => fileTestName.includes(t) || t.includes(fileTestName));
      });

      if (otherFiles.length > 0) {
        collatedTestResults[runtimeKey].otherFiles = otherFiles.map((file: any) => ({
          name: file.file,
          path: file.relativePath,
          isJson: file.isJson,
          size: file.size,
          modified: file.modified,
          testName: file.testName
        }));
      }
    }

    console.log(`[DEBUG] Returning collated test results for ${Object.keys(collatedTestResults).length} runtimes`);
    return this.jsonResponse({
      collatedTestResults: collatedTestResults,
      message: 'Success'
    });
  }

  private handleHttpGetInputFiles(request: Request, url: URL): Response {
    const runtime = url.searchParams.get('runtime');
    const testName = url.searchParams.get('testName');

    console.log(`[DEBUG] handleHttpGetInputFiles: runtime="${runtime}", testName="${testName}"`);

    if (!runtime || !testName) {
      console.log(`[DEBUG] Missing runtime or testName parameters`);
      return this.jsonResponse({
        error: 'Missing runtime or testName query parameters'
      }, 400);
    }

    const getInputFiles = (this as any).getInputFiles;
    if (typeof getInputFiles !== 'function') {
      console.log(`[DEBUG] getInputFiles method not available`);
      throw new Error('getInputFiles does not exist on this instance');
    }

    console.log(`[DEBUG] Calling getInputFiles with runtime="${runtime}", testName="${testName}"`);
    const inputFiles = getInputFiles(runtime, testName);
    console.log(`[DEBUG] getInputFiles returned:`, inputFiles);

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
    console.log(`[DEBUG] handleHttpGetConfigs called`);

    if (!this.configs) {
      console.log(`[DEBUG] configs property not available`);
      return Server_HTTP_utils.jsonResponse({
        error: 'configs property not available',
        message: 'Server does not have configs'
      }, 503);
    }

    console.log(`[DEBUG] configs structure:`, {
      hasRuntimes: !!this.configs.runtimes,
      runtimeCount: this.configs.runtimes ? Object.keys(this.configs.runtimes).length : 0,
      runtimeKeys: this.configs.runtimes ? Object.keys(this.configs.runtimes) : []
    });

    return Server_HTTP_utils.jsonResponse({
      configs: this.configs,
      message: 'Success'
    });
  }

  private handleHttpGetDocumentation(): Response {
    console.log(`[DEBUG] handleHttpGetDocumentation called`);

    // Documentation files are now embedded in the HTML config
    // Return empty array for backward compatibility
    return this.jsonResponse({
      files: [],
      message: 'Documentation files are now embedded in HTML config',
      count: 0
    });
  }

  private handleHttpGetCollatedDocumentation(): Response {
    console.log(`[DEBUG] handleHttpGetCollatedDocumentation called`);

    // Documentation files are now embedded in the HTML config
    // Return empty for backward compatibility
    return this.jsonResponse({
      tree: {},
      files: [],
      message: 'Documentation files are now embedded in HTML config'
    });
  }

  private handleHttpGetCollatedInputFiles(): Response {
    console.log(`[DEBUG] handleHttpGetCollatedInputFiles called`);

    // Get configs first to know what runtimes and tests exist
    if (!this.configs) {
      console.log(`[DEBUG] configs property not available`);
      return this.jsonResponse({
        error: 'configs property not available',
        message: 'Server does not have configs'
      }, 503);
    }

    const collatedInputFiles: Record<string, any> = {};

    // For each runtime, fetch input files for each test
    const runtimes = this.configs.runtimes;
    console.log(`[DEBUG] Processing ${Object.keys(runtimes).length} runtimes`);

    // We'll collect promises for all the input file fetches
    const fetchPromises: Promise<void>[] = [];

    for (const [runtimeKey, runtimeConfig] of Object.entries(runtimes)) {
      const config = runtimeConfig as any;
      const runtime = config.runtime;
      const tests = config.tests || [];

      console.log(`[DEBUG] Processing runtime ${runtimeKey} (${runtime}) with ${tests.length} tests`);

      if (!collatedInputFiles[runtimeKey]) {
        collatedInputFiles[runtimeKey] = {
          runtime: runtime,
          tests: {},
          tree: {}
        };
      }

      for (const testName of tests) {
        fetchPromises.push(
          this.fetchInputFilesForTest(runtimeKey, testName)
            .then(inputFiles => {
              // Store test entry
              collatedInputFiles[runtimeKey].tests[testName] = {
                testName: testName,
                inputFiles: inputFiles,
                count: inputFiles.length
              };

              // Build tree structure for this test
              this.buildInputFilesTree(collatedInputFiles[runtimeKey].tree, testName, inputFiles);
            })
            .catch(error => {
              console.error(`[DEBUG] Failed to fetch input files for ${runtimeKey}/${testName}:`, error);
              collatedInputFiles[runtimeKey].tests[testName] = {
                testName: testName,
                inputFiles: [],
                count: 0,
                error: error.message
              };
              // Still build tree with empty files
              this.buildInputFilesTree(collatedInputFiles[runtimeKey].tree, testName, []);
            })
        );
      }
    }

    // Wait for all fetches to complete
    return Promise.all(fetchPromises)
      .then(() => {
        // After building all trees, we need to merge them into a single tree structure
        // that mirrors the filesystem layout
        const fsTree = this.buildFilesystemTree(collatedInputFiles);

        console.log(`[DEBUG] Collated input files:`, JSON.stringify(collatedInputFiles, null, 2));
        console.log(`[DEBUG] Filesystem tree:`, JSON.stringify(fsTree, null, 2));

        return this.jsonResponse({
          collatedInputFiles: collatedInputFiles,
          fsTree: fsTree,
          message: 'Success'
        });
      })
      .catch(error => {
        console.error(`[DEBUG] Error collating input files:`, error);
        return this.jsonResponse({
          error: 'Failed to collate input files',
          message: error.message
        }, 500);
      });
  }

  private buildInputFilesTree(tree: Record<string, any>, testName: string, inputFiles: string[]): void {
    // Add test entry to tree
    const testNode = {
      type: 'test',
      path: testName,
      inputFiles: inputFiles,
      count: inputFiles.length
    };

    // Split testName into parts (e.g., "src/java/test/java/com/example/calculator/CalculatorTest.java")
    const parts = testName.split('/').filter(part => part.length > 0);

    let currentNode = tree;

    // Navigate through the path, creating directories as needed
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!currentNode[part]) {
        if (isLast) {
          currentNode[part] = testNode;
        } else {
          currentNode[part] = {
            type: 'directory',
            children: {}
          };
        }
      } else if (isLast) {
        // If this is the last part and it already exists, it should be a test node
        // Update it with input files
        if (currentNode[part].type === 'test') {
          currentNode[part].inputFiles = inputFiles;
          currentNode[part].count = inputFiles.length;
        }
      }

      if (!isLast) {
        currentNode = currentNode[part].children;
      }
    }
  }

  private async fetchInputFilesForTest(runtimeKey: string, testName: string): Promise<string[]> {
    console.log(`[DEBUG] Fetching input files for ${runtimeKey}/${testName}`);

    const getInputFiles = (this as any).getInputFiles;
    if (typeof getInputFiles === 'function') {
      console.log(`[DEBUG] Using getInputFiles method`);
      const inputFiles = getInputFiles(runtimeKey, testName);
      console.log(`[DEBUG] getInputFiles returned ${inputFiles.length} files for ${runtimeKey}/${testName}`);
      return inputFiles;
    }

    // Fallback to HTTP fetch
    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const inputFiles = data.inputFiles || [];
      console.log(`[DEBUG] HTTP fetch returned ${inputFiles.length} files for ${runtimeKey}/${testName}`);
      return inputFiles;
    } catch (error) {
      console.error(`[DEBUG] HTTP fetch failed for ${runtimeKey}/${testName}:`, error);
      return [];
    }
  }

  private collateDocumentationFiles(files: string[]): Record<string, any> {
    const tree: Record<string, any> = {};

    for (const filePath of files) {
      // Normalize the path
      const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const parts = normalizedPath.split('/').filter(part => part.length > 0 && part !== '.');

      if (parts.length === 0) continue;

      let currentNode = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!currentNode[part]) {
          currentNode[part] = isLast ? {
            type: 'file',
            path: filePath
          } : {
            type: 'directory',
            children: {}
          };
        }

        if (!isLast) {
          currentNode = currentNode[part].children;
        }
      }
    }

    return tree;
  }

  private handleHttpGetHtmlReport(): Response {
    console.log(`[DEBUG] handleHttpGetHtmlReport called`);

    const workspaceRoot = process.cwd();
    console.log(`[DEBUG] Workspace root: ${workspaceRoot}`);
    
    const reportsDir = path.join(workspaceRoot, 'testeranto', 'reports');
    console.log(`[DEBUG] Reports directory: ${reportsDir}`);
    
    const reportPath = path.join(reportsDir, 'index.html');
    console.log(`[DEBUG] Report path: ${reportPath}`);

    // Check if the reports directory exists
    if (!fs.existsSync(reportsDir)) {
      console.log(`[DEBUG] Reports directory does not exist: ${reportsDir}`);
      return this.jsonResponse({
        error: 'HTML report directory not found',
        message: 'The reports directory has not been created yet. Run the server to generate it.',
        path: reportsDir
      }, 404);
    }

    // Check if the report exists
    if (!fs.existsSync(reportPath)) {
      console.log(`[DEBUG] HTML report file does not exist: ${reportPath}`);
      return this.jsonResponse({
        error: 'HTML report not found',
        message: 'The HTML report has not been generated yet. Run the server to generate it.',
        path: reportPath
      }, 404);
    }

    console.log(`[DEBUG] HTML report found at: ${reportPath}`);
    return this.jsonResponse({
      message: 'Stakeholder HTML report is available',
      path: reportPath,
      url: `/testeranto/reports/index.html`,
      timestamp: new Date().toISOString()
    });
  }

  private handleHttpGetStakeholderReport(): Response {
    console.log(`[DEBUG] handleHttpGetStakeholderReport called`);

    const workspaceRoot = process.cwd();
    const reportPath = path.join(workspaceRoot, 'testeranto', 'reports', 'index.html');
    
    if (!fs.existsSync(reportPath)) {
      console.log(`[DEBUG] Stakeholder report not found at: ${reportPath}`);
      return new Response('Stakeholder report not found', {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    try {
      const htmlContent = fs.readFileSync(reportPath, 'utf-8');
      console.log(`[DEBUG] Serving stakeholder report from: ${reportPath}`);
      return new Response(htmlContent, {
        status: 200,
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error: any) {
      console.error(`[DEBUG] Error reading stakeholder report: ${error.message}`);
      return new Response(`Error reading stakeholder report: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  private async handleHttpGetFeatureTree(): Promise<Response> {
    console.log(`[DEBUG] handleHttpGetFeatureTree called`);

    const server = this as any;
    if (typeof server.getFeatureTree === 'function') {
      try {
        const featureTree = await server.getFeatureTree();
        console.log(`[DEBUG] Feature tree generated successfully`);
        return this.jsonResponse({
          tree: featureTree,
          message: 'Success'
        });
      } catch (error: any) {
        console.error(`[DEBUG] Error generating feature tree: ${error.message}`);
        return this.jsonResponse({
          error: 'Failed to generate feature tree',
          message: error.message
        }, 500);
      }
    }

    console.log(`[DEBUG] getFeatureTree method not available`);
    return this.jsonResponse({
      error: 'Feature tree functionality not available',
      message: 'Server does not support feature tree generation'
    }, 503);
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
      return Server_HTTP_utils.handleOptions();
    }

    const routeHandlers: Record<string, () => Response> = {
      'processes': () => this.handleHttpGetProcesses(),
      'configs': () => this.handleHttpGetConfigs(),
      'documentation': () => this.handleHttpGetDocumentation(),
      'collated-documentation': () => this.handleHttpGetCollatedDocumentation(),
      'collated-inputfiles': () => this.handleHttpGetCollatedInputFiles(),
      'collated-testresults': () => this.handleHttpGetCollatedTestResults(),
      'collated-allfiles': () => this.handleHttpGetCollatedAllFiles(),
      'aider-processes': () => this.handleHttpGetAiderProcesses(),
      'outputfiles': () => this.handleHttpGetOutputFiles(request, url),
      'inputfiles': () => this.handleHttpGetInputFiles(request, url),
      'testresults': () => this.handleHttpGetTestResults(request, url),
      'html-report': () => this.handleHttpGetHtmlReport(),
      'stakeholder-report': () => this.handleHttpGetStakeholderReport(),
      'feature-tree': () => this.handleHttpGetFeatureTree(),
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
    
    // Special handling for the stakeholder report
    if (normalizedPath === '/' || normalizedPath === '/index.html') {
      const reportPath = path.join(projectRoot, 'testeranto', 'reports', 'index.html');
      if (fs.existsSync(reportPath)) {
        return this.serveFile(reportPath);
      }
    }
    
    // Also handle direct access to testeranto/reports/index.html
    if (normalizedPath === '/testeranto/reports/index.html' || normalizedPath === '/testeranto/reports/') {
      const reportPath = path.join(projectRoot, 'testeranto', 'reports', 'index.html');
      if (fs.existsSync(reportPath)) {
        return this.serveFile(reportPath);
      }
    }

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
        // Check if there's an index.html in the directory
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return this.serveFile(indexPath);
        }
        
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
        // Try to serve the stakeholder report as a fallback
        if (normalizedPath === '/' || normalizedPath === '/index.html' || 
            normalizedPath === '/testeranto/reports/index.html') {
          const reportPath = path.join(projectRoot, 'testeranto', 'reports', 'index.html');
          if (fs.existsSync(reportPath)) {
            return this.serveFile(reportPath);
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
