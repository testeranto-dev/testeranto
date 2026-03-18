import fs from "fs";
import path from "path";

export class Server_HTTP_utils {
  static jsonResponse(data: any, status = 200): Response {
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

  static handleOptions(): Response {
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

  static mergeFileTree(target: Record<string, any>, source: Record<string, any>): void {
    for (const [key, sourceNode] of Object.entries(source)) {
      if (!target[key]) {
        target[key] = { ...sourceNode };
        if (sourceNode.children) {
          target[key].children = {};
        }
      } else if (sourceNode.type === 'directory' && target[key].type === 'directory') {
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

  static serveFile(filePath: string): Promise<Response> {
    const contentType = this.getContentType(filePath);
    
    try {
      const file = Bun.file(filePath);
      return Promise.resolve(new Response(file, {
        status: 200,
        headers: { "Content-Type": contentType },
      }));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return Promise.resolve(new Response(`File not found: ${filePath}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        }));
      } else {
        return Promise.resolve(new Response(`Server Error: ${error.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        }));
      }
    }
  }

  static getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript',
    };
    return contentTypes[ext] || 'application/octet-stream';
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

  static buildInputFilesTree(tree: Record<string, any>, testName: string, inputFiles: string[]): void {
    const testNode = {
      type: 'test',
      path: testName,
      inputFiles: inputFiles,
      count: inputFiles.length
    };

    const parts = testName.split('/').filter(part => part.length > 0);

    let currentNode = tree;

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

  static async fetchInputFilesForTest(getInputFiles: any, runtimeKey: string, testName: string): Promise<string[]> {
    if (typeof getInputFiles === 'function') {
      const inputFiles = getInputFiles(runtimeKey, testName);
      return inputFiles;
    }

    try {
      const response = await fetch(`http://localhost:3000/~/inputfiles?runtime=${encodeURIComponent(runtimeKey)}&testName=${encodeURIComponent(testName)}`);
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
    allTestResults: any = {}
  ): Promise<string> {
    try {
      const htmlContent = await fs.promises.readFile(htmlPath, 'utf-8');
      
      // Prepare the data to embed in the format expected by the stakeholder app
      const embeddedData = {
        configs,
        featureTree: collatedFilesTree,
        documentation: {
          files: [], // We can populate this if needed
          timestamp: Date.now()
        },
        testResults: {},
        errors: [],
        timestamp: new Date().toISOString(),
        workspaceRoot: process.cwd(),
        allTestResults: allTestResults
      };
      
      // Create a script tag with the embedded data as a global variable
      const scriptTag = `
        <script>
          window.TESTERANTO_EMBEDDED_DATA = ${JSON.stringify(embeddedData, null, 2)};
        </script>
      `;
      
      // Insert the script tag before the closing </head> tag
      // If no </head> tag, insert before </body> or at the end
      let modifiedHtml = htmlContent;
      
      if (htmlContent.includes('</head>')) {
        modifiedHtml = htmlContent.replace('</head>', `${scriptTag}\n</head>`);
      } else if (htmlContent.includes('</body>')) {
        modifiedHtml = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        modifiedHtml = htmlContent + scriptTag;
      }
      
      return modifiedHtml;
    } catch (error) {
      console.error('Error generating HTML with embedded data:', error);
      // Fallback to original HTML
      return await fs.promises.readFile(htmlPath, 'utf-8');
    }
  }
}
