import fs, { existsSync, mkdirSync } from "fs";
import path, { join } from "path";
import chokidar from "chokidar";
import { Server_Docker } from "./Server_Docker";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import glob from "glob";


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
    
    // Add test.json files from the reports directory with their internal structure
    await this.addTestJsonFilesToTree(tree);
    
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
    let currentNode = tree;
    
    for (const part of parts) {
      if (currentNode.children && currentNode.children[part]) {
        currentNode = currentNode.children[part];
      } else {
        return null;
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

  private async addTestJsonFilesToTree(tree: any): Promise<void> {
    const reportsDir = join(process.cwd(), 'testeranto', 'reports');
    if (!existsSync(reportsDir)) {
      return;
    }

    // Walk through the reports directory to find all files
    const walk = async (dir: string, basePath: string = '') => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = basePath ? join(basePath, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          // Add directory to tree
          const treePath = `testeranto/reports/${relativePath}`;
          this.addFileToTree(tree, treePath, 'test-directory');
          await walk(fullPath, relativePath);
        } else if (entry.isFile()) {
          // Add file to tree
          const treePath = `testeranto/reports/${relativePath}`;
          let fileType = 'file';
          if (entry.name === 'tests.json') {
            fileType = 'test-results';
          } else if (entry.name.endsWith('.json')) {
            fileType = 'test-data';
          } else if (entry.name.endsWith('.html')) {
            fileType = 'html';
          } else if (entry.name.endsWith('.js')) {
            fileType = 'javascript';
          }
          
          this.addFileToTree(tree, treePath, fileType);
          
          // Load the test data for tests.json files and add their internal structure to the tree
          if (entry.name === 'tests.json') {
            const node = this.findNodeInTree(tree, treePath);
            if (node && node.type === 'file') {
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const testData = JSON.parse(content);
                node.testData = testData;
                
                // Add the internal structure of the test results as children
                await this.addTestResultStructureToNode(node, testData);
              } catch (error) {
                console.warn(`[Server] Could not read test results file ${fullPath}: ${error}`);
              }
            }
          }
        }
      }
    };

    await walk(reportsDir);
  }

  private async addTestResultStructureToNode(node: any, testData: any): Promise<void> {
    if (!node.children) {
      node.children = {};
    }
    
    // Add overall test summary
    node.children['summary'] = {
      type: 'test-summary',
      name: 'summary',
      path: node.path + '/summary',
      failed: testData.failed,
      fails: testData.fails,
      runTimeTests: testData.runTimeTests,
      features: testData.features || []
    };
    
    // Add test job if present
    if (testData.testJob) {
      // Add test job overview
      node.children['testJob'] = {
        type: 'test-job',
        name: 'testJob',
        path: node.path + '/testJob',
        name: testData.testJob.name,
        fails: testData.testJob.fails,
        failed: testData.testJob.failed,
        features: testData.testJob.features || []
      };
      
      // Add givens as children
      if (testData.testJob.givens && Array.isArray(testData.testJob.givens)) {
        node.children['givens'] = {
          type: 'directory',
          name: 'givens',
          path: node.path + '/givens',
          children: {}
        };
        
        for (let i = 0; i < testData.testJob.givens.length; i++) {
          const given = testData.testJob.givens[i];
          const givenKey = given.key || `given_${i}`;
          
          node.children['givens'].children[givenKey] = {
            type: 'test-given',
            name: givenKey,
            path: node.path + '/givens/' + givenKey,
            failed: given.failed,
            features: given.features || [],
            error: given.error,
            status: given.status,
            children: {}
          };
          
          // Add whens to the given
          if (given.whens && Array.isArray(given.whens)) {
            node.children['givens'].children[givenKey].children['whens'] = {
              type: 'directory',
              name: 'whens',
              path: node.path + '/givens/' + givenKey + '/whens',
              children: {}
            };
            
            for (let j = 0; j < given.whens.length; j++) {
              const when = given.whens[j];
              const whenKey = when.name || `when_${j}`;
              
              node.children['givens'].children[givenKey].children['whens'].children[whenKey] = {
                type: 'test-when',
                name: whenKey,
                path: node.path + '/givens/' + givenKey + '/whens/' + whenKey,
                status: when.status,
                error: when.error,
                artifacts: when.artifacts || []
              };
            }
          }
          
          // Add thens to the given
          if (given.thens && Array.isArray(given.thens)) {
            node.children['givens'].children[givenKey].children['thens'] = {
              type: 'directory',
              name: 'thens',
              path: node.path + '/givens/' + givenKey + '/thens',
              children: {}
            };
            
            for (let j = 0; j < given.thens.length; j++) {
              const then = given.thens[j];
              const thenKey = then.name || `then_${j}`;
              
              node.children['givens'].children[givenKey].children['thens'].children[thenKey] = {
                type: 'test-then',
                name: thenKey,
                path: node.path + '/givens/' + givenKey + '/thens/' + thenKey,
                status: then.status,
                error: then.error,
                artifacts: then.artifacts || []
              };
            }
          }
        }
      }
    }
    
    // Add features if present
    if (testData.features && Array.isArray(testData.features)) {
      node.children['features'] = {
        type: 'directory',
        name: 'features',
        path: node.path + '/features',
        children: {}
      };
      
      for (let i = 0; i < testData.features.length; i++) {
        const feature = testData.features[i];
        const featureKey = feature.replace(/[^a-zA-Z0-9]/g, '_') || `feature_${i}`;
        
        node.children['features'].children[featureKey] = {
          type: 'feature',
          name: feature,
          path: node.path + '/features/' + featureKey
        };
      }
    }
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
