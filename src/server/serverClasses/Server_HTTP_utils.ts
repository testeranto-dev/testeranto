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
}
