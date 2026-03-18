import fs, { existsSync, mkdirSync } from "fs";
import path, { join } from "path";
import chokidar from "chokidar";
import { Server_Docker } from "./Server_Docker";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import glob from "glob";
import { Server_Utils } from "./Server_Utils";


// Note: HTML and TypeScript files are now created in embedConfigInHtml()
// to ensure they always have the latest embedded configuration

export class Server extends Server_Docker {
  private documentationWatcher: chokidar.FSWatcher | null = null;
  private documentationFiles: Set<string> = new Set();

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
  }

  private async embedConfigInHtml(): Promise<void> {
    try {
      const reportsDir = join(process.cwd(), "testeranto", "reports");
      
      // Always create directory if needed
      if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
      }
      
      // First, copy the TypeScript file for bundling
      const tsxPath = join(reportsDir, "index.tsx");
      const baseTsx = fs.readFileSync(join(__dirname, "index.tsx"), "utf-8");
      fs.writeFileSync(tsxPath, baseTsx);
      console.log(`[Server] Copied TypeScript file to ${tsxPath}`);
      
      // Get documentation files if glob pattern exists
      let documentationFiles: string[] = [];
      if (this.configs.documentationGlob) {
        documentationFiles = this.getDocumentationFilesFromGlob();
      }
      
      // Generate the feature tree
      const featureTree = await this.generateFeatureTree();
      
      // Create a sanitized version of configs without functions
      const sanitizedConfigs = {
        ...this.configs,
        // Remove the featureIngestor function since it can't be serialized
        featureIngestor: undefined,
      };

      // Embed config, documentation files, and feature tree in the HTML
      const configData = {
        configs: sanitizedConfigs,
        documentationFiles: documentationFiles,
        featureTree: featureTree
      };
      
      const configScript = `<script id="testeranto-config" type="application/json">
${JSON.stringify(configData, null, 2)}
</script>`;
      
      // Read the base HTML template
      const baseHtml = fs.readFileSync(join(__dirname, "index.html"), "utf-8");
      
      // Insert the config script before the closing </head> tag
      let htmlContent = baseHtml;
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${configScript}\n</head>`);
      } else {
        // Fallback: insert before the closing </body> tag
        htmlContent = htmlContent.replace('</body>', `${configScript}\n</body>`);
      }
      
      // Write the HTML file with embedded config
      const htmlPath = join(reportsDir, "index.html");
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`[Server] Created HTML report with embedded config, ${documentationFiles.length} documentation files, and feature tree at ${htmlPath}`);
      
    } catch (error) {
      console.error(`[Server] Failed to embed config in HTML:`, error);
      // Try to create a basic HTML file as fallback
      try {
        const reportsDir = join(process.cwd(), "testeranto", "reports");
        const htmlPath = join(reportsDir, "index.html");
        if (!existsSync(reportsDir)) {
          mkdirSync(reportsDir, { recursive: true });
        }
        const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Testeranto Report</title>
  <style>body { font-family: sans-serif; padding: 20px; }</style>
</head>
<body>
  <h1>Testeranto Report</h1>
  <p>Error: Could not load configuration. Please check server logs.</p>
  <script>
    console.error('Failed to load Testeranto report:', ${JSON.stringify(error.message)});
  </script>
</body>
</html>`;
        fs.writeFileSync(htmlPath, fallbackHtml);
      } catch (fallbackError) {
        console.error(`[Server] Failed to create fallback HTML:`, fallbackError);
      }
    }
  }

  private getDocumentationFilesFromGlob(): string[] {
    if (!this.configs.documentationGlob) {
      return [];
    }
    
    try {
      const globPattern = this.configs.documentationGlob;
      const cwd = process.cwd();
      
      // Normalize glob pattern: remove leading ./ if present
      const normalizedGlob = globPattern.replace(/^\.\//, '');
      
      // Find files matching the glob pattern
      const files = glob.sync(normalizedGlob, {
        cwd,
        ignore: ['**/node_modules/**', '**/.git/**'],
        nodir: true
      });
      
      // Convert to relative paths
      const relativeFiles = files.map(file => {
        // Ensure forward slashes for consistency
        return file.split(path.sep).join('/');
      });
      
      console.log(`[Server] Found ${relativeFiles.length} documentation files from glob: ${globPattern}`);
      return relativeFiles;
    } catch (error) {
      console.error(`[Server] Failed to get documentation files from glob:`, error);
      return [];
    }
  }

  async start(): Promise<void> {
    // First, ensure the HTML file exists with embedded config
    await this.embedConfigInHtml();
    
    // Log config structure for debugging
    console.log(`[Server] Config structure:`);
    if (this.configs && this.configs.runtimes) {
      for (const [configKey, runtimeConfig] of Object.entries(this.configs.runtimes)) {
        const config = runtimeConfig as any;
        console.log(`  ${configKey}:`);
        console.log(`    runtime: ${config.runtime}`);
        console.log(`    tests (${config.tests?.length || 0}):`);
        if (config.tests) {
          config.tests.forEach((test: string, i: number) => {
            console.log(`      ${i}: "${test}"`);
          });
        }
      }
    }
    
    // Then start the parent server
    await super.start();
    
    if (this.configs.documentationGlob) {
      console.log(`[Server] Documentation glob pattern: ${this.configs.documentationGlob}`);
    } else {
      console.log('[Server] No documentationGlob configured in configs');
    }
  }

  private async generateStaticDataFile(): Promise<void> {
    const reportsDir = join(process.cwd(), "testeranto", "reports");

    // Collect all necessary data
    const data = {
      documentation: await this.getDocumentationData(),
      testResults: await this.getTestResultsData(),
      configs: this.getConfigsData(),
      timestamp: new Date().toISOString(),
      workspaceRoot: process.cwd(),
      // Generate the comprehensive feature tree
      featureTree: await this.generateFeatureTree()
    };

    // Write to static file
    const dataPath = join(reportsDir, "data.json");
    await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2));
    console.log(`[Server] Static data file written to ${dataPath}`);
  }

  private async generateFeatureTree(): Promise<any> {
    const tree: any = {
      type: 'directory',
      name: 'root',
      path: '.',
      children: {}
    };

    // Get all documentation files
    const documentation = await this.getDocumentationData();
    const docFiles = documentation.files || [];
    
    // Process documentation files into the tree
    for (const filePath of docFiles) {
      this.addFileToTree(tree, filePath, 'documentation');
      // Load content for documentation files
      const node = this.findNodeInTree(tree, filePath);
      if (node && node.type === 'file') {
        try {
          const fullPath = join(process.cwd(), filePath);
          if (existsSync(fullPath)) {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            node.content = content;
          }
        } catch (error) {
          console.warn(`[Server] Could not read documentation file ${filePath}: ${error}`);
        }
      }
    }
    
    // Add source files from the project structure
    await this.addSourceFilesToTree(tree);
    
    // Add test results to their corresponding source files
    await this.addTestResultsToSourceFiles(tree);
    
    return tree;
  }

  private addFileToTree(tree: any, filePath: string, type: string): void {
    const parts = filePath.split('/').filter(part => part.length > 0);
    let currentNode = tree.children;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      if (!currentNode[part]) {
        if (isLast) {
          currentNode[part] = {
            type: 'file',
            name: part,
            path: filePath,
            fileType: type,
            content: null
          };
        } else {
          currentNode[part] = {
            type: 'directory',
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            children: {}
          };
        }
      } else if (isLast && currentNode[part].type === 'file') {
        // Update existing file
        currentNode[part].fileType = type;
      }
      
      if (!isLast) {
        if (currentNode[part].type === 'directory') {
          currentNode = currentNode[part].children;
        } else {
          // Convert file to directory if needed
          const temp = currentNode[part];
          currentNode[part] = {
            type: 'directory',
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            children: {}
          };
          currentNode = currentNode[part].children;
        }
      }
    }
  }

  private async processTestResultIntoTree(tree: any, testKey: string, testResult: any): Promise<void> {
    // Extract the test path from the key (format: runtime/testName)
    const [runtime, testName] = testKey.split('/');
    
    // Create a path for the test in the tree
    const testPath = `testeranto/reports/${runtime}/${testName}`;
    this.addFileToTree(tree, testPath, 'test-directory');
    
    // Add the tests.json file
    const testsJsonPath = `${testPath}/tests.json`;
    this.addFileToTree(tree, testsJsonPath, 'test-results');
    
    // Find the node for tests.json
    const testsJsonNode = this.findNodeInTree(tree, testsJsonPath);
    if (testsJsonNode) {
      // Process the test result data
      testsJsonNode.testData = testResult;
      
      // Also add test result files to the tree
      if (testResult.artifacts && Array.isArray(testResult.artifacts)) {
        for (const artifact of testResult.artifacts) {
          if (artifact.path) {
            const artifactPath = `${testPath}/${artifact.path}`;
            this.addFileToTree(tree, artifactPath, 'test-artifact');
          }
        }
      }
      
      // Extract features and their associated steps
      if (testResult.testJob && testResult.testJob.givens) {
        const featuresMap = new Map<string, any>();
        
        for (const given of testResult.testJob.givens) {
          if (given.features) {
            for (const feature of given.features) {
              if (!featuresMap.has(feature)) {
                featuresMap.set(feature, {
                  type: 'feature',
                  name: feature,
                  path: feature,
                  // Check if feature is a URL to a local file
                  isUrl: this.isLocalFileUrl(feature),
                  givens: [],
                  whens: [],
                  thens: []
                });
              }
              
              const featureNode = featuresMap.get(feature);
              
              // Add the given
              featureNode.givens.push({
                key: given.key,
                status: !given.failed,
                error: given.error
              });
              
              // Add whens
              if (given.whens) {
                for (const when of given.whens) {
                  featureNode.whens.push({
                    name: when.name,
                    status: when.status,
                    error: when.error
                  });
                }
              }
              
              // Add thens
              if (given.thens) {
                for (const then of given.thens) {
                  featureNode.thens.push({
                    name: then.name,
                    status: then.status,
                    error: then.error
                  });
                }
              }
            }
          }
        }
        
        // Add features to the tree
        for (const [featureName, featureData] of featuresMap) {
          // If feature is a URL to a local file, add it to the tree
          if (featureData.isUrl) {
            const filePath = this.extractLocalFilePath(featureName);
            if (filePath) {
              this.addFileToTree(tree, filePath, 'documentation');
              
              // Try to load the file content
              try {
                const fullPath = join(process.cwd(), filePath);
                if (existsSync(fullPath)) {
                  const content = await fs.promises.readFile(fullPath, 'utf-8');
                  const fileNode = this.findNodeInTree(tree, filePath);
                  if (fileNode) {
                    fileNode.content = content;
                  }
                }
              } catch (error) {
                console.warn(`[Server] Could not read documentation file ${filePath}: ${error}`);
              }
            }
          }
          
          // Add feature node under tests.json
          if (!testsJsonNode.children) {
            testsJsonNode.children = {};
          }
          const featureKey = featureName.replace(/[^a-zA-Z0-9]/g, '_');
          testsJsonNode.children[featureKey] = featureData;
        }
      }
    }
  }

  private findNodeInTree(tree: any, path: string): any | null {
    const parts = path.split('/').filter(part => part.length > 0);
    
    // Start from the root
    let currentNode = tree;
    
    for (const part of parts) {
      // Check if current node has children
      if (!currentNode.children) {
        return null;
      }
      
      // Look for the part in children
      if (currentNode.children[part]) {
        currentNode = currentNode.children[part];
      } else {
        // Try to find a case-insensitive match or partial match
        const foundKey = Object.keys(currentNode.children).find(key => 
          key.toLowerCase() === part.toLowerCase() || 
          key.includes(part) || 
          part.includes(key)
        );
        
        if (foundKey) {
          currentNode = currentNode.children[foundKey];
        } else {
          return null;
        }
      }
    }
    
    return currentNode;
  }

  private isLocalFileUrl(feature: string): boolean {
    // Check if feature looks like a local file path or URL
    return feature.startsWith('./') || 
           feature.startsWith('/') || 
           feature.includes('/') && 
           !feature.startsWith('http://') && 
           !feature.startsWith('https://');
  }

  private extractLocalFilePath(feature: string): string | null {
    // Remove any URL scheme or leading ./
    let path = feature.replace(/^\.\//, '');
    
    // Remove any anchor or query parts
    path = path.split('#')[0].split('?')[0];
    
    // Check if it looks like a file path with an extension
    if (path.includes('.') && !path.includes(' ')) {
      return path;
    }
    
    return null;
  }

  private async getDocumentationData(): Promise<any> {
    // First, try to get documentation files from the glob pattern
    const docFiles = this.getDocumentationFilesFromGlob();
    
    // Also check the old documentation.json file for backward compatibility
    const docPath = join(process.cwd(), 'testeranto', 'documentation.json');
    let oldDocFiles: string[] = [];
    
    if (existsSync(docPath)) {
      try {
        const content = await fs.promises.readFile(docPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.files && Array.isArray(parsed.files)) {
          oldDocFiles = parsed.files;
        }
      } catch (error) {
        console.error(`[Server] Failed to read documentation.json file: ${error}`);
      }
    }
    
    // Merge both sources, removing duplicates
    const allFiles = [...new Set([...docFiles, ...oldDocFiles])];
    
    // Sort files for consistent display
    allFiles.sort();
    
    return { files: allFiles };
  }

  private async addSourceFilesToTree(tree: any): Promise<void> {
    // Get all test entrypoints from configs
    const testEntrypoints = this.getTestEntrypoints();
    
    // Add each test entrypoint to the tree
    for (const entrypoint of testEntrypoints) {
      this.addFileToTree(tree, entrypoint, 'test-source');
      
      // Don't load source file content for stakeholder app
      // Just mark it as a test source file
      const node = this.findNodeInTree(tree, entrypoint);
      if (node && node.type === 'file') {
        // Clear any content that might have been loaded
        node.content = null;
      }
    }
  }

  private getTestEntrypoints(): string[] {
    const entrypoints: string[] = [];
    
    if (!this.configs || !this.configs.runtimes) {
      return entrypoints;
    }
    
    // Collect all test paths from the configuration
    for (const [configKey, runtimeConfig] of Object.entries(this.configs.runtimes)) {
      const config = runtimeConfig as any;
      const tests = config.tests || [];
      
      for (const testPath of tests) {
        // The test path in config is typically the entrypoint
        if (testPath && typeof testPath === 'string') {
          entrypoints.push(testPath);
        }
      }
    }
    
    return [...new Set(entrypoints)]; // Remove duplicates
  }

  private async addTestResultsToSourceFiles(tree: any): Promise<void> {
    // Get all test results from the reports directory
    const testResults = await this.collectTestResults();
    console.log(`[Server] Processing ${Object.keys(testResults).length} test results`);
    
    // For each test result, find its source file and attach the results
    for (const [testKey, testResult] of Object.entries(testResults)) {
      console.log(`[Server] Processing test result for key: ${testKey}`);
      
      // Find which source file this test corresponds to
      const sourceFile = this.findSourceFileForTest(testKey);
      
      if (sourceFile) {
        console.log(`[Server] Found source file ${sourceFile} for test ${testKey}`);
        
        // Find the node for the source file in the tree
        const sourceNode = this.findNodeInTree(tree, sourceFile);
        if (sourceNode && sourceNode.type === 'file') {
          console.log(`[Server] Found source node for ${sourceFile}`);
          
          // Ensure the source node has children
          if (!sourceNode.children) {
            sourceNode.children = {};
          }
          
          // Create a unique key for this test result based on the testKey
          // Use the configKey and test name to make it more readable
          const parts = testKey.split('/');
          const configKey = parts[0];
          const testName = parts.slice(1).join('/');
          const testResultKey = `${configKey}_${testName.replace(/\//g, '_').replace(/\./g, '-')}`;
          
          // Check if test results already exist for this key
          if (!sourceNode.children[testResultKey]) {
            // Create a test results node
            const testResultsNode = {
              type: 'test-results',
              name: testResultKey,
              path: sourceFile + '/' + testResultKey,
              testData: testResult,
              children: {}
            };
            
            // Add the internal structure of the test results
            await this.addTestResultStructureToNode(testResultsNode, testResult);
            
            sourceNode.children[testResultKey] = testResultsNode;
            console.log(`[Server] Added test results for ${testKey} to source file ${sourceFile}`);
          } else {
            // Update existing test results
            sourceNode.children[testResultKey].testData = testResult;
            // Rebuild the structure
            sourceNode.children[testResultKey].children = {};
            await this.addTestResultStructureToNode(sourceNode.children[testResultKey], testResult);
            console.log(`[Server] Updated test results for ${testKey} in source file ${sourceFile}`);
          }
        } else {
          console.warn(`[Server] Source node not found or not a file for: ${sourceFile}`);
          // If the source file node doesn't exist, we should add it to the tree
          if (!sourceNode) {
            console.log(`[Server] Adding missing source file to tree: ${sourceFile}`);
            this.addFileToTree(tree, sourceFile, 'test-source');
            // Try again to attach test results
            const newSourceNode = this.findNodeInTree(tree, sourceFile);
            if (newSourceNode && newSourceNode.type === 'file') {
              if (!newSourceNode.children) {
                newSourceNode.children = {};
              }
              const parts = testKey.split('/');
              const configKey = parts[0];
              const testName = parts.slice(1).join('/');
              const testResultKey = `${configKey}_${testName.replace(/\//g, '_').replace(/\./g, '-')}`;
              const testResultsNode = {
                type: 'test-results',
                name: testResultKey,
                path: sourceFile + '/' + testResultKey,
                testData: testResult,
                children: {}
              };
              await this.addTestResultStructureToNode(testResultsNode, testResult);
              newSourceNode.children[testResultKey] = testResultsNode;
              console.log(`[Server] Added source file and test results for ${testKey}`);
            }
          }
        }
      } else {
        console.warn(`[Server] Could not find source file for test: ${testKey}`);
        // Even if we can't find the source file, we can still add the test results to the tree
        // under a special section
        const testPath = `testeranto/test-results/${testKey}`;
        this.addFileToTree(tree, testPath, 'test-results');
        const testNode = this.findNodeInTree(tree, testPath);
        if (testNode && testNode.type === 'file') {
          testNode.testData = testResult;
          console.log(`[Server] Added orphan test results for ${testKey} to special section`);
        }
      }
    }
    
    console.log(`[Server] Finished processing test results`);
  }

  private async collectTestResults(): Promise<Record<string, any>> {
    const testResults: Record<string, any> = {};
    const reportsDir = join(process.cwd(), 'testeranto', 'reports');
    
    console.log(`[Server] collectTestResults: looking in ${reportsDir}`);
    
    if (!existsSync(reportsDir)) {
      console.log(`[Server] Reports directory does not exist: ${reportsDir}`);
      return testResults;
    }

    // Walk through the reports directory to find all tests.json files
    const walk = async (dir: string, basePath: string = ''): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        console.log(`[Server] Walking ${dir}, found ${entries.length} entries`);
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          const relativePath = basePath ? join(basePath, entry.name) : entry.name;
          
          if (entry.isDirectory()) {
            console.log(`[Server] Entering directory: ${entry.name}`);
            await walk(fullPath, relativePath);
          } else if (entry.isFile() && entry.name === 'tests.json') {
            console.log(`[Server] Found tests.json at: ${relativePath}`);
            try {
              const content = await fs.promises.readFile(fullPath, 'utf-8');
              const testData = JSON.parse(content);
              
              // The directory structure can help us identify which test this belongs to
              // Typically: testeranto/reports/{configKey}/{testName}/tests.json
              // Where testName is the test entrypoint path
              const pathParts = relativePath.split('/');
              console.log(`[Server] Path parts for ${relativePath}:`, pathParts);
              
              if (pathParts.length >= 3) {
                // The structure is: reports/{configKey}/{testName}/tests.json
                const configKey = pathParts[0]; // First part after reports
                // The testName is everything between configKey and tests.json
                const testNameParts = pathParts.slice(1, -1); // Remove configKey and tests.json
                const testName = testNameParts.join('/');
                const key = `${configKey}/${testName}`;
                testResults[key] = testData;
                console.log(`[Server] Mapped to key: ${key} (configKey: ${configKey}, testName: ${testName})`);
              } else {
                console.warn(`[Server] Unexpected path structure for tests.json: ${relativePath} (${pathParts.length} parts)`);
              }
            } catch (error) {
              console.warn(`[Server] Could not read test results file ${fullPath}: ${error}`);
            }
          }
        }
      } catch (error) {
        console.warn(`[Server] Error walking directory ${dir}: ${error}`);
      }
    };

    // Start walking from the reports directory
    await walk(reportsDir);
    console.log(`[Server] Collected ${Object.keys(testResults).length} test results`);
    
    // Log all collected test results for debugging
    for (const [key, value] of Object.entries(testResults)) {
      console.log(`[Server] Test result key: ${key}, has testJob: ${!!value.testJob}`);
    }
    
    return testResults;
  }

  private findSourceFileForTest(testKey: string): string | null {
    console.log(`[Server] findSourceFileForTest called with: "${testKey}"`);
    
    // First, let's see what the testKey looks like
    // It should be in format: configKey/testPath
    const parts = testKey.split('/');
    if (parts.length < 2) {
      console.log(`[Server] testKey doesn't have enough parts: ${parts.length}`);
      return null;
    }
    
    const configKey = parts[0];
    const testPath = parts.slice(1).join('/');
    
    console.log(`[Server] Parsed configKey: "${configKey}", testPath: "${testPath}"`);
    
    // Check if config exists
    if (!this.configs?.runtimes?.[configKey]) {
      console.log(`[Server] Config key "${configKey}" not found in runtimes`);
      console.log(`[Server] Available configs:`, Object.keys(this.configs?.runtimes || {}));
      return null;
    }
    
    const runtimeConfig = this.configs.runtimes[configKey] as any;
    const tests = runtimeConfig.tests || [];
    
    console.log(`[Server] Looking for testPath "${testPath}" in ${tests.length} tests:`);
    tests.forEach((t: string, i: number) => console.log(`  ${i}: "${t}"`));
    
    // The testPath might be something like "src/ts/Calculator.test.node.ts/tests.json"
    // But in config, it's just "src/ts/Calculator.test.node.ts"
    // So we need to remove "/tests.json" if present
    const cleanTestPath = testPath.replace(/\/tests\.json$/, '');
    console.log(`[Server] Clean testPath (without /tests.json): "${cleanTestPath}"`);
    
    // Try exact match first
    for (const testEntry of tests) {
      if (testEntry === cleanTestPath) {
        console.log(`[Server] Found exact match: "${testEntry}"`);
        return testEntry;
      }
    }
    
    // Try to match the base name
    const cleanTestPathBase = cleanTestPath.split('/').pop();
    console.log(`[Server] Base name: "${cleanTestPathBase}"`);
    
    for (const testEntry of tests) {
      const testEntryBase = testEntry.split('/').pop();
      if (testEntryBase === cleanTestPathBase) {
        console.log(`[Server] Found match by base name: "${testEntry}" (base: "${testEntryBase}")`);
        return testEntry;
      }
    }
    
    // Try Server_Utils as a fallback
    const result = Server_Utils.findSourceFileForTest(testKey, this.configs);
    console.log(`[Server] Server_Utils result: ${result}`);
    
    return result;
  }


  private async addTestResultStructureToNode(node: any, testData: any): Promise<void> {
    await Server_Utils.addTestResultStructureToNode(node, testData);
  }

  private async getTestResultsData(): Promise<any> {
    const resultsDir = join(process.cwd(), 'testeranto', 'reports');
    if (!existsSync(resultsDir)) {
      return {};
    }

    const testResults: Record<string, any> = {};

    // Look for all JSON files in the reports directory
    const files = await fs.promises.readdir(resultsDir);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'data.json') {
        const filePath = join(resultsDir, file);
        try {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          // Use the filename without extension as the key
          const key = file.replace('.json', '');
          testResults[key] = data;
        } catch (error) {
          console.error(`[Server] Failed to read test results file ${file}: ${error}`);
        }
      }
    }

    return testResults;
  }

  private getConfigsData(): any {
    // Return a simplified version of configs for the stakeholder app
    const simplifiedConfigs: any = {};

    if (this.configs && this.configs.runtimes) {
      for (const [key, config] of Object.entries(this.configs.runtimes)) {
        const runtimeConfig = config as any;
        simplifiedConfigs[key] = {
          runtime: runtimeConfig.runtime,
          tests: runtimeConfig.tests || [],
          dockerfile: runtimeConfig.dockerfile,
          // Don't include sensitive or unnecessary information
        };
      }
    }

    return {
      runtimes: simplifiedConfigs,
      documentationGlob: this.configs.documentationGlob,
      stakeholderReactModule: this.configs.stakeholderReactModule
    };
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  // Add a method to get the feature tree
  public async getFeatureTree(): Promise<any> {
    return await this.generateFeatureTree();
  }
}
