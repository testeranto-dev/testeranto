import fs from "fs";
import path from "path";

export class Server_HTTP_utils {
  static jsonResponse(data: any, status = 200): Response {
    const responseData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  static handleOptions(): Response {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  static buildFilesystemTree(dirPath: string): Record<string, any> {
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
            type: "directory",
            children: this.buildFilesystemTree(fullPath),
          };
        } else {
          tree[item] = {
            type: "file",
            path: relativePath,
            isJson: item.endsWith(".json"),
            isHtml: item.endsWith(".html"),
            isMd: item.endsWith(".md"),
          };
        }
      }
    } catch (error) {
      console.error(
        `[DEBUG] Error building filesystem tree for ${dirPath}:`,
        error,
      );
    }

    return tree;
  }

  static mergeFileTree(
    target: Record<string, any>,
    source: Record<string, any>,
  ): void {
    for (const [key, sourceNode] of Object.entries(source)) {
      if (!target[key]) {
        target[key] = { ...sourceNode };
        if (sourceNode.children) {
          target[key].children = {};
        }
      } else if (
        sourceNode.type === "directory" &&
        target[key].type === "directory"
      ) {
        if (sourceNode.children) {
          if (!target[key].children) {
            target[key].children = {};
          }
          this.mergeFileTree(target[key].children, sourceNode.children);
        }
      }
    }
  }

  static mergeAllFileTrees(trees: Record<string, any>[]): Record<string, any> {
    const merged: Record<string, any> = {};

    for (const tree of trees) {
      this.mergeFileTree(merged, tree);
    }

    return merged;
  }

  static collateDocumentationFiles(files: string[]): Record<string, any> {
    const tree: Record<string, any> = {};

    for (const filePath of files) {
      const normalizedPath = filePath.startsWith("/")
        ? filePath.substring(1)
        : filePath;
      const parts = normalizedPath
        .split("/")
        .filter((part) => part.length > 0 && part !== ".");

      if (parts.length === 0) continue;

      let currentNode = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!currentNode[part]) {
          currentNode[part] = isLast
            ? {
              type: "file",
              path: filePath,
            }
            : {
              type: "directory",
              children: {},
            };
        }

        if (!isLast) {
          currentNode = currentNode[part].children;
        }
      }
    }

    return tree;
  }

  static serveFile(filePath: string): Promise<Response> {
    const contentType = this.getContentType(filePath);

    try {
      const file = Bun.file(filePath);
      return Promise.resolve(
        new Response(file, {
          status: 200,
          headers: { "Content-Type": contentType },
        }),
      );
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return Promise.resolve(
          new Response(`File not found: ${filePath}`, {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          }),
        );
      } else {
        return Promise.resolve(
          new Response(`Server Error: ${error.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain" },
          }),
        );
      }
    }
  }

  static getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".html": "text/html",
      ".htm": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".ts": "application/typescript",
      ".tsx": "application/typescript",
    };
    return contentTypes[ext] || "application/octet-stream";
  }

  static join(...paths: string[]): string {
    return path.join(...paths);
  }

  static existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  static resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  static async stat(filePath: string): Promise<fs.Stats> {
    return fs.promises.stat(filePath);
  }

  static async readdir(dirPath: string): Promise<string[]> {
    return fs.promises.readdir(dirPath);
  }

  static buildInputFilesTree(
    tree: Record<string, any>,
    testName: string,
    inputFiles: string[],
  ): void {
    const testNode = {
      type: "test",
      path: testName,
      inputFiles: inputFiles,
      count: inputFiles.length,
    };

    const parts = testName.split("/").filter((part) => part.length > 0);

    let currentNode = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!currentNode[part]) {
        if (isLast) {
          currentNode[part] = testNode;
        } else {
          currentNode[part] = {
            type: "directory",
            children: {},
          };
        }
      } else if (isLast) {
        if (currentNode[part].type === "test") {
          currentNode[part].inputFiles = inputFiles;
          currentNode[part].count = inputFiles.length;
        }
      }

      if (!isLast) {
        currentNode = currentNode[part].children;
      }
    }
  }

  static async fetchInputFilesForTest(
    getInputFiles: any,
    runtimeKey: string,
    testName: string,
  ): Promise<string[]> {
    if (typeof getInputFiles === "function") {
      const inputFiles = getInputFiles(runtimeKey, testName);
      return inputFiles;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const inputFiles = data.inputFiles || [];
      return inputFiles;
    } catch (error) {
      return [];
    }
  }

  static async generateHtmlWithEmbeddedData(
    htmlPath: string,
    configs: any,
    collatedFilesTree: any,
    allTestResults: any = {},
  ): Promise<string> {
    try {
      const htmlContent = await fs.promises.readFile(htmlPath, "utf-8");

      // Extract features and documentation files from all test results
      const { features, documentationFiles, bddStatus, featureGraph } =
        await this.extractFeaturesAndDocsFromTestResults(allTestResults);

      // Read contents of documentation files
      const documentationWithContent = await this.readDocumentationFiles(documentationFiles);

      // Prepare the data to embed in the format expected by the stakeholder app
      const embeddedData = {
        configs,
        // Use the collated files tree which includes source files, documentation, etc.
        featureTree: collatedFilesTree,
        documentation: {
          files: documentationFiles,
          timestamp: Date.now(),
          contents: documentationWithContent,
        },
        features: features,
        bddStatus: bddStatus,
        testResults: {},
        errors: [],
        timestamp: new Date().toISOString(),
        workspaceRoot: process.cwd(),
        allTestResults: allTestResults,
        // Add file contents for files in the tree
        fileContents: await this.extractFileContentsFromTree(collatedFilesTree),
        // Add feature graph for visualization
        featureGraph: featureGraph,
        // Add viz configuration
        vizConfig: {
          projection: {
            xAttribute: 'status',
            yAttribute: 'points',
            xType: 'categorical',
            yType: 'continuous',
            layout: 'grid'
          },
          style: {
            nodeSize: (node: any) => {
              if (node.attributes.points) return Math.max(10, node.attributes.points * 5);
              return 10;
            },
            nodeColor: (node: any) => {
              const status = node.attributes.status;
              if (status === 'done') return '#4caf50';
              if (status === 'doing') return '#ff9800';
              if (status === 'todo') return '#f44336';
              return '#9e9e9e';
            },
            nodeShape: 'circle',
            labels: {
              show: true,
              attribute: 'name',
              fontSize: 12
            }
          }
        }
      };

      // Convert embedded data to a JSON string
      const jsonString = JSON.stringify(embeddedData);
      // Encode to base64 to avoid any HTML/JS escaping issues
      const base64String = Buffer.from(jsonString, 'utf8').toString('base64');
      
      // Create a script tag that decodes the base64 string
      const scriptTag = `<script>
window.TESTERANTO_EMBEDDED_DATA = JSON.parse(atob('${base64String}'));
</script>`;

      // Insert the script tag before the closing </head> tag
      // If no </head> tag, insert before </body> or at the end
      let modifiedHtml = htmlContent;

      if (htmlContent.includes("</head>")) {
        modifiedHtml = htmlContent.replace("</head>", `${scriptTag}\n</head>`);
      } else if (htmlContent.includes("</body>")) {
        modifiedHtml = htmlContent.replace(`</body>`, `${scriptTag}\n</body>`);
      } else {
        modifiedHtml = htmlContent + scriptTag;
      }

      return modifiedHtml;
    } catch (error) {
      console.error("Error generating HTML with embedded data:", error);
      // Fallback to original HTML
      return await fs.promises.readFile(htmlPath, "utf-8");
    }
  }

  private static async extractFeaturesAndDocsFromTestResults(
    allTestResults: any,
  ): Promise<{
    features: Array<{
      testKey: string;
      feature: string;
      isDocumentation: boolean;
      path?: string;
      frontmatter?: Record<string, any>;
      content?: string;
    }>;
    documentationFiles: string[];
    bddStatus: Record<string, { status: string; color: string }>;
    featureGraph?: any;
  }> {
    const features: Array<{
      testKey: string;
      feature: string;
      isDocumentation: boolean;
      path?: string;
      frontmatter?: Record<string, any>;
      content?: string;
    }> = [];
    const documentationFiles: string[] = [];
    const bddStatus: Record<string, { status: string; color: string }> = {};
    const featureNodes: any[] = [];
    const featureEdges: any[] = [];

    // Process each test result
    for (const [runtimeKey, tests] of Object.entries(allTestResults)) {
      for (const [testName, testData] of Object.entries(tests as any)) {
        const testKey = `${runtimeKey}/${testName}`;

        // Extract features from test data
        if (testData && typeof testData === "object") {
          // Get features from various locations
          let testFeatures: string[] = [];
          if (testData.features && Array.isArray(testData.features)) {
            testFeatures = testData.features;
          } else if (testData.testJob && testData.testJob.givens) {
            const allFeatures = new Set<string>();
            for (const given of testData.testJob.givens) {
              if (given.features && Array.isArray(given.features)) {
                for (const feature of given.features) {
                  allFeatures.add(feature);
                }
              }
            }
            testFeatures = Array.from(allFeatures);
          }

          // Process each feature
          for (const feature of testFeatures) {
            // Check if feature is a documentation file reference
            const docExtensions = [
              ".md",
              ".txt",
              ".rst",
              ".adoc",
              ".asciidoc",
              ".markdown",
              ".mdown",
            ];
            const isDocByExtension = docExtensions.some((ext) =>
              feature.toLowerCase().endsWith(ext),
            );
            const looksLikePath =
              feature.includes("/") ||
              feature.includes("\\") ||
              feature.startsWith("./") ||
              feature.startsWith("/") ||
              feature.includes(".");

            if (isDocByExtension || looksLikePath) {
              // Normalize the path
              let normalizedPath = feature;
              if (normalizedPath.startsWith("./")) {
                normalizedPath = normalizedPath.substring(2);
              }
              if (normalizedPath.startsWith("/")) {
                normalizedPath = normalizedPath.substring(1);
              }
              normalizedPath = normalizedPath.replace(/\\/g, "/");

              // Try to read and parse markdown file
              let frontmatter: Record<string, any> = {};
              let content: string | undefined;
              
              try {
                const fullPath = path.join(process.cwd(), normalizedPath);
                if (fs.existsSync(fullPath)) {
                  const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
                  content = fileContent;
                  
                  // Parse markdown frontmatter
                  const match = fileContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
                  if (match) {
                    const [, frontmatterStr] = match;
                    frontmatter = this.parseYamlFrontmatter(frontmatterStr);
                  }
                  
                  // Create feature node for graph
                  const nodeId = `feature:${normalizedPath}`;
                  featureNodes.push({
                    id: nodeId,
                    attributes: {
                      ...frontmatter,
                      _path: normalizedPath,
                      _type: 'feature',
                      _testKey: testKey,
                      _feature: feature
                    }
                  });
                  
                  // Add edges for dependencies
                  if (frontmatter.dependsUpon) {
                    const dependencies = Array.isArray(frontmatter.dependsUpon) 
                      ? frontmatter.dependsUpon 
                      : [frontmatter.dependsUpon];
                    
                    for (const dep of dependencies) {
                      let depPath = dep;
                      if (depPath.startsWith('./')) {
                        depPath = depPath.substring(2);
                      }
                      if (depPath.startsWith('/')) {
                        depPath = depPath.substring(1);
                      }
                      depPath = depPath.replace(/\\/g, '/');
                      
                      const depNodeId = `feature:${depPath}`;
                      featureEdges.push({
                        source: depNodeId,
                        target: nodeId,
                        attributes: {
                          type: 'dependsUpon'
                        }
                      });
                    }
                  }
                }
              } catch (error) {
                console.warn(`Could not read or parse feature file ${normalizedPath}:`, error);
              }

              features.push({
                testKey,
                feature,
                isDocumentation: true,
                path: normalizedPath,
                frontmatter,
                content
              });

              // Add to documentation files if not already present
              if (!documentationFiles.includes(normalizedPath)) {
                documentationFiles.push(normalizedPath);
              }
            } else {
              // Plain string feature
              features.push({
                testKey,
                feature,
                isDocumentation: false,
              });
              
              // Create node for plain feature
              const nodeId = `feature:plain:${feature.replace(/[^a-zA-Z0-9]/g, '_')}`;
              featureNodes.push({
                id: nodeId,
                attributes: {
                  _type: 'plain_feature',
                  _testKey: testKey,
                  _feature: feature,
                  name: feature
                }
              });
            }
          }

          // Get BDD status
          // Look for BDD log exit code in the test directory
          const bddExitCode = await this.getBddExitCodeForTest(
            runtimeKey,
            testName,
          );
          bddStatus[testKey] = bddExitCode;
        }
      }
    }

    // Create feature graph
    const featureGraph = {
      nodes: featureNodes,
      edges: featureEdges.length > 0 ? featureEdges : undefined
    };

    return { features, documentationFiles, bddStatus, featureGraph };
  }

  private static parseYamlFrontmatter(yamlStr: string): Record<string, any> {
    try {
      const result: Record<string, any> = {};
      const lines = yamlStr.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          let value = trimmed.substring(colonIndex + 1).trim();
          
          // Try to parse values
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value === 'null') value = null;
          else if (!isNaN(Number(value)) && value !== '') value = Number(value);
          else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          } else if (value.startsWith('[') && value.endsWith(']')) {
            // Simple array parsing
            try {
              value = JSON.parse(value);
            } catch {
              // Keep as string
            }
          }
          
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error);
      return {};
    }
  }

  private static async getBddExitCodeForTest(
    runtimeKey: string,
    testName: string,
  ): Promise<{ status: string; color: string }> {
    // Look for BDD log exit code file
    const reportsDir = path.join(process.cwd(), "testeranto", "reports");
    const testDir = path.join(reportsDir, runtimeKey);

    if (!fs.existsSync(testDir)) {
      return { status: "unknown", color: "gray" };
    }

    // Look for exit code files
    let exitCodeFiles: string[] = [];
    try {
      exitCodeFiles = fs
        .readdirSync(testDir)
        .filter((f) => f.includes("bdd") && f.endsWith(".exitcode"));
    } catch (error) {
      return { status: "unknown", color: "gray" };
    }

    if (exitCodeFiles.length === 0) {
      return { status: "unknown", color: "gray" };
    }

    // Read the first BDD exit code file
    const exitCodeFile = path.join(testDir, exitCodeFiles[0]);
    try {
      const content = fs.readFileSync(exitCodeFile, "utf-8").trim();
      const code = content || "unknown";

      // Determine color based on exit code
      let color = "gray";
      let status = code;
      if (code !== "unknown") {
        const num = parseInt(code, 10);
        if (!isNaN(num)) {
          if (num === 0) {
            color = "green";
            status = "passed";
          } else if (num > 0) {
            color = "yellow";
            status = "failed";
          } else {
            color = "red";
            status = "error";
          }
        }
      }
      return { status, color };
    } catch (error) {
      return { status: "unknown", color: "gray" };
    }
  }

  private static buildStakeholderTree(
    features: Array<{
      testKey: string;
      feature: string;
      isDocumentation: boolean;
      path?: string;
    }>,
    documentationFiles: string[],
    bddStatus: Record<string, { status: string; color: string }>,
  ): any {
    const tree: any = {
      type: "directory",
      name: "root",
      path: ".",
      children: {},
    };

    // Add documentation files to tree
    for (const docFile of documentationFiles) {
      this.addFileToTree(tree, docFile, "documentation");
    }

    // Group features by test
    const featuresByTest: Record<
      string,
      Array<{ feature: string; isDocumentation: boolean; path?: string }>
    > = {};
    for (const feat of features) {
      if (!featuresByTest[feat.testKey]) {
        featuresByTest[feat.testKey] = [];
      }
      featuresByTest[feat.testKey].push(feat);
    }

    // Add test nodes with features
    for (const [testKey, testFeatures] of Object.entries(featuresByTest)) {
      const [runtimeKey, testName] = testKey.split("/");
      const testNodePath = `tests/${testKey}`;

      // Create test directory
      this.addDirectoryToTree(tree, testNodePath);

      // Find or create the test node
      const testNode = this.findNodeInTree(tree, testNodePath);
      if (testNode) {
        // Add BDD status
        const status = bddStatus[testKey] || {
          status: "unknown",
          color: "gray",
        };
        testNode.bddStatus = status;

        // Add features section
        if (!testNode.children) {
          testNode.children = {};
        }

        // Add regular features
        const regularFeatures = testFeatures.filter((f) => !f.isDocumentation);
        if (regularFeatures.length > 0) {
          testNode.children["features"] = {
            type: "directory",
            name: "Features",
            path: `${testNodePath}/features`,
            children: {},
          };

          for (const feat of regularFeatures) {
            const featureKey = `feature:${feat.feature}`.replace(
              /[^a-zA-Z0-9]/g,
              "_",
            );
            testNode.children["features"].children[featureKey] = {
              type: "feature",
              name: feat.feature,
              path: `${testNodePath}/features/${featureKey}`,
              feature: feat.feature,
              clickable: false,
              status: "unknown",
            };
          }
        }

        // Add documentation features (already in tree from documentationFiles)
        // We can add links to them if needed
      }
    }

    return tree;
  }

  private static addFileToTree(
    tree: any,
    filePath: string,
    fileType: string,
  ): void {
    const parts = filePath.split("/").filter((part) => part.length > 0);
    let currentNode = tree.children;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!currentNode[part]) {
        if (isLast) {
          currentNode[part] = {
            type: "file",
            name: part,
            path: filePath,
            fileType: fileType,
          };
        } else {
          currentNode[part] = {
            type: "directory",
            name: part,
            path: parts.slice(0, i + 1).join("/"),
            children: {},
          };
        }
      }

      if (!isLast) {
        if (currentNode[part].type === "directory") {
          currentNode = currentNode[part].children;
        } else {
          // Convert file to directory if needed
          const temp = currentNode[part];
          currentNode[part] = {
            type: "directory",
            name: part,
            path: parts.slice(0, i + 1).join("/"),
            children: {},
          };
          currentNode = currentNode[part].children;
        }
      }
    }
  }

  private static addDirectoryToTree(tree: any, dirPath: string): void {
    const parts = dirPath.split("/").filter((part) => part.length > 0);
    let currentNode = tree.children;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!currentNode[part]) {
        currentNode[part] = {
          type: "directory",
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: {},
        };
      }

      if (!isLast) {
        if (currentNode[part].type === "directory") {
          currentNode = currentNode[part].children;
        } else {
          // Convert file to directory if needed
          const temp = currentNode[part];
          currentNode[part] = {
            type: "directory",
            name: part,
            path: parts.slice(0, i + 1).join("/"),
            children: {},
          };
          currentNode = currentNode[part].children;
        }
      }
    }
  }

  private static async readDocumentationFiles(files: string[]): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};
    
    for (const file of files) {
      try {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          contents[file] = content;
        }
      } catch (error) {
        console.warn(`Could not read documentation file ${file}:`, error);
      }
    }
    
    return contents;
  }

  private static async extractFileContentsFromTree(tree: any): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};
    
    const traverse = async (node: any, currentPath: string = '') => {
      if (!node) return;
      
      if (node.type === 'file' && node.path) {
        try {
          const fullPath = path.join(process.cwd(), node.path);
          if (fs.existsSync(fullPath)) {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
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

  private static findNodeInTree(tree: any, path: string): any | null {
    const parts = path.split("/").filter((part) => part.length > 0);

    let currentNode = tree;

    for (const part of parts) {
      if (!currentNode.children) {
        return null;
      }

      if (currentNode.children[part]) {
        currentNode = currentNode.children[part];
      } else {
        return null;
      }
    }

    return currentNode;
  }
}
