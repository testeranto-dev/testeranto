import fs from "fs";
import path from "path";
import { glob } from "glob";
import type { ITestconfigV2 } from "../../../../Types";
import { getFileType } from "./getFileType";
import { getContentType } from "./getContentType";
import { extractFeaturesAndDocsFromTestResults } from "./extractFeaturesAndDocsFromTestResults";
import { generateCollatedFilesTree } from "./generateCollatedFilesTree";
import { generateHtmlWithEmbeddedData } from "./generateHtmlWithEmbeddedData";
import { collectAllTestResults } from "./collectAllTestResults";

export class Server_HTTP_utils {
  static async generateCollatedFilesTree(
    configs: ITestconfigV2,
  ): Promise<Record<string, any>> {
    return generateCollatedFilesTree(configs);
  }

  static async serveStaticFile(
    request: Request,
    url: URL,
    configs?: ITestconfigV2,
  ): Promise<Response> {
    const normalizedPath = decodeURIComponent(url.pathname);

    if (normalizedPath.includes("..")) {
      return new Response("Forbidden: Directory traversal not allowed", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const projectRoot = process.cwd();

    if (normalizedPath === "/" || normalizedPath === "/index.html") {
      const reportPath = Server_HTTP_utils.join(
        projectRoot,
        "testeranto",
        "reports",
        "index.html",
      );
      if (Server_HTTP_utils.existsSync(reportPath)) {
        // Generate collated files tree and test results, then embed in HTML
        const collatedFilesTree =
          await Server_HTTP_utils.generateCollatedFilesTree(configs);
        const allTestResults =
          await Server_HTTP_utils.collectAllTestResults(configs);
        const htmlWithData =
          await Server_HTTP_utils.generateHtmlWithEmbeddedData(
            reportPath,
            configs,
            collatedFilesTree,
            allTestResults,
          );
        return new Response(htmlWithData, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    if (
      normalizedPath === "/testeranto/reports/index.html" ||
      normalizedPath === "/testeranto/reports/"
    ) {
      const reportPath = Server_HTTP_utils.join(
        projectRoot,
        "testeranto",
        "reports",
        "index.html",
      );
      if (Server_HTTP_utils.existsSync(reportPath)) {
        // Generate collated files tree and test results, then embed in HTML
        const collatedFilesTree =
          await Server_HTTP_utils.generateCollatedFilesTree(configs);
        const allTestResults =
          await Server_HTTP_utils.collectAllTestResults(configs);
        const htmlWithData =
          await Server_HTTP_utils.generateHtmlWithEmbeddedData(
            reportPath,
            configs,
            collatedFilesTree,
            allTestResults,
          );
        return new Response(htmlWithData, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    // Default: serve static files
    const filePath = Server_HTTP_utils.join(projectRoot, normalizedPath);
    if (Server_HTTP_utils.existsSync(filePath)) {
      return await Server_HTTP_utils.serveFile(filePath);
    } else {
      return new Response("File not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  static addTestResultsFilesToTree(
    treeRoot: Record<string, any>,
    reportsDir: string,
  ): void {
    const addFilesToTree = (dir: string, relativePath: string = "") => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          const itemRelativePath = relativePath
            ? `${relativePath}/${item}`
            : item;

          if (stat.isDirectory()) {
            addFilesToTree(fullPath, itemRelativePath);
          } else {
            // Add ALL files, including logs
            const fileType = getFileType(item);

            // Add file to tree
            const parts = itemRelativePath
              .split("/")
              .filter((part) => part.length > 0);
            if (parts.length === 0) continue;

            let currentNode = treeRoot;

            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              const isLast = i === parts.length - 1;

              if (!currentNode[part]) {
                if (isLast) {
                  currentNode[part] = {
                    type: "file",
                    path: fullPath,
                    name: part,
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

              if (!isLast && currentNode[part].type === "directory") {
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

  static async collectAllTestResults(
    configs: ITestconfigV2,
  ): Promise<Record<string, any>> {
    return collectAllTestResults(configs);
  }

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
    const contentType = getContentType(filePath);

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
    return generateHtmlWithEmbeddedData(htmlPath, configs, collatedFilesTree, allTestResults);
  }

  private static parseYamlFrontmatter(yamlStr: string): Record<string, any> {
    try {
      const result: Record<string, any> = {};
      const lines = yamlStr.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const colonIndex = trimmed.indexOf(":");
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          let value = trimmed.substring(colonIndex + 1).trim();

          // Try to parse values
          if (value === "true") value = true;
          else if (value === "false") value = false;
          else if (value === "null") value = null;
          else if (!isNaN(Number(value)) && value !== "") value = Number(value);
          else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          } else if (value.startsWith("[") && value.endsWith("]")) {
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
      console.warn("Failed to parse YAML frontmatter:", error);
      return {};
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

  private static async readDocumentationFiles(
    files: string[],
  ): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};

    for (const file of files) {
      try {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = await fs.promises.readFile(fullPath, "utf-8");
          contents[file] = content;
        }
      } catch (error) {
        console.warn(`Could not read documentation file ${file}:`, error);
      }
    }

    return contents;
  }

  private static async extractFileContentsFromTree(
    tree: any,
  ): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};

    const traverse = async (node: any, currentPath: string = "") => {
      if (!node) return;

      if (node.type === "file" && node.path) {
        try {
          const fullPath = path.join(process.cwd(), node.path);
          if (fs.existsSync(fullPath)) {
            const content = await fs.promises.readFile(fullPath, "utf-8");
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
