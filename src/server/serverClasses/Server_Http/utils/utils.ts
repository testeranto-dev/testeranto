
import fs from "fs";
import path from "path";
import type { ITestconfigV2 } from "../../../../Types";
import { collectAllTestResults as collectAllTestResultsOriginal } from "./collectAllTestResults";
import { generateCollatedFilesTree as generateCollatedFilesTreeOriginal } from "./generateCollatedFilesTree";
import { generateHtmlWithEmbeddedData as generateHtmlWithEmbeddedDataOriginal } from "./generateHtmlWithEmbeddedData";
import { getContentType } from "./getContentType";
import { handleOptions as handleOptionsOriginal } from "./handleOptions";
import { jsonResponse as jsonResponseOriginal } from "./jsonResponse";

// Route utilities
export const routeName = (req: any): string => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const urlPath = url.pathname;
  return urlPath.slice(3); // Remove '/~/'
};

export const decodedPath = (req: any): string => {
  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const decodedPath = decodeURIComponent(urlPath);
  return decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
};

export const matchRoute = (
  routeName: string,
  routes: Record<string, any>,
): { handler: any; params: Record<string, string> } | null => {
  if (routes && routes[routeName]) {
    return { handler: routes[routeName], params: {} };
  }

  for (const [pattern, handler] of Object.entries(routes)) {
    if (pattern.includes(":")) {
      const patternParts = pattern.split("/");
      const routeParts = routeName.split("/");
      const lastPatternPart = patternParts[patternParts.length - 1];
      const isLastParamWithExtension =
        lastPatternPart.includes(":") && lastPatternPart.includes(".xml");

      if (isLastParamWithExtension) {
        let matches = true;
        const params: Record<string, string> = {};

        for (let i = 0; i < patternParts.length - 1; i++) {
          const patternPart = patternParts[i];
          const routePart = routeParts[i];

          if (patternPart.startsWith(":")) {
            const paramName = patternPart.slice(1);
            params[paramName] = routePart;
          } else if (patternPart !== routePart) {
            matches = false;
            break;
          }
        }

        if (matches) {
          const lastParamName = lastPatternPart.slice(
            1,
            lastPatternPart.indexOf(".xml"),
          );
          const remainingParts = routeParts.slice(patternParts.length - 1);
          let paramValue = remainingParts.join("/");

          if (paramValue.endsWith(".xml")) {
            paramValue = paramValue.slice(0, -4);
          }
          params[lastParamName] = paramValue;

          return { handler, params };
        }
      } else {
        if (patternParts.length !== routeParts.length) {
          continue;
        }

        let matches = true;
        const params: Record<string, string> = {};

        for (let i = 0; i < patternParts.length; i++) {
          const patternPart = patternParts[i];
          const routePart = routeParts[i];

          if (patternPart.startsWith(":")) {
            const paramName = patternPart.slice(1);
            params[paramName] = routePart;
          } else if (patternPart !== routePart) {
            matches = false;
            break;
          }
        }

        if (matches) {
          return { handler, params };
        }
      }
    }
  }
  return null;
};

export const extractParams = (
  pattern: string,
  routeName: string,
): Record<string, string> | null => {
  const patternParts = pattern.split("/");
  const routeParts = routeName.split("/");

  if (patternParts.length !== routeParts.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const routePart = routeParts[i];

    if (patternPart.startsWith(":")) {
      const paramName = patternPart.slice(1);
      params[paramName] = routePart;
    } else if (patternPart !== routePart) {
      return null;
    }
  }
  return params;
};

// File type detection
export const getFileType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".html" || ext === ".htm") return "html";
  if (ext === ".json") return "json";
  if (ext === ".md") return "markdown";
  if (ext === ".xml") return "xml";
  if (ext === ".txt" || ext === ".log") return "text";
  if (ext === ".js" || ext === ".ts") return "script";
  if (ext === ".css") return "stylesheet";
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".gif" || ext === ".svg") return "image";
  return "unknown";
};

// Serve static file
export const serveStaticFile = async (
  request: Request,
  url: URL,
  configs?: ITestconfigV2,
): Promise<Response> => {
  const normalizedPath = decodeURIComponent(url.pathname);

  if (normalizedPath.includes("..")) {
    return new Response("Forbidden: Directory traversal not allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const projectRoot = process.cwd();

  if (normalizedPath === "/" || normalizedPath === "/index.html") {
    const reportPath = path.join(
      projectRoot,
      "testeranto",
      "reports",
      "index.html",
    );
    if (fs.existsSync(reportPath)) {
      const collatedFilesTree = configs ? await generateCollatedFilesTreeOriginal(configs) : {};
      const allTestResults = configs ? await collectAllTestResultsOriginal(configs) : {};
      const htmlWithData = await generateHtmlWithEmbeddedDataOriginal(
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
    const reportPath = path.join(
      projectRoot,
      "testeranto",
      "reports",
      "index.html",
    );
    if (fs.existsSync(reportPath)) {
      const collatedFilesTree = configs ? await generateCollatedFilesTreeOriginal(configs) : {};
      const allTestResults = configs ? await collectAllTestResultsOriginal(configs) : {};
      const htmlWithData = await generateHtmlWithEmbeddedDataOriginal(
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

  const filePath = path.join(projectRoot, normalizedPath);
  if (fs.existsSync(filePath)) {
    return await serveFile(filePath);
  } else {
    return new Response("File not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

// Tree utilities
export const addTestResultsFilesToTree = (
  treeRoot: Record<string, any>,
  reportsDir: string,
): void => {
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
          const fileType = getFileType(item);
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
};

// Wrapper functions
export const collectAllTestResults = async (
  configs: ITestconfigV2 | undefined,
): Promise<Record<string, any>> => {
  if (!configs) {
    return {};
  }
  return collectAllTestResultsOriginal(configs);
};

export const jsonResponse = (data: any, status = 200): Response => {
  return jsonResponseOriginal(data, status);
};

export const handleOptions = (): Response => {
  return handleOptionsOriginal();
};

// File system tree
export const buildFilesystemTree = (dirPath: string): Record<string, any> => {
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
          children: buildFilesystemTree(fullPath),
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
};

// Merge trees
export const mergeFileTree = (
  target: Record<string, any>,
  source: Record<string, any>,
): void => {
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
        mergeFileTree(target[key].children, sourceNode.children);
      }
    }
  }
};

export const mergeAllFileTrees = (trees: Record<string, any>[]): Record<string, any> => {
  const merged: Record<string, any> = {};

  for (const tree of trees) {
    mergeFileTree(merged, tree);
  }

  return merged;
};

// Documentation files
export const collateDocumentationFiles = (files: string[]): Record<string, any> => {
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
};

// Serve file
export const serveFile = async (filePath: string): Promise<Response> => {
  const contentType = getContentType(filePath);

  try {
    const fileContent = await fs.promises.readFile(filePath);
    return new Response(fileContent, {
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
};

// Path utilities
export const join = (...paths: string[]): string => {
  return path.join(...paths);
};

export const existsSync = (path: string): boolean => {
  return fs.existsSync(path);
};

export const resolve = (...paths: string[]): string => {
  return path.resolve(...paths);
};

export const stat = async (filePath: string): Promise<fs.Stats> => {
  return fs.promises.stat(filePath);
};

export const readdir = async (dirPath: string): Promise<string[]> => {
  return fs.promises.readdir(dirPath);
};

// Input files tree
export const buildInputFilesTree = (
  tree: Record<string, any>,
  testName: string,
  inputFiles: string[],
): void => {
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
};

// Fetch input files
export const fetchInputFilesForTest = async (
  getInputFiles: any,
  runtimeKey: string,
  testName: string,
): Promise<string[]> => {
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
    const inputFiles = (data as any).inputFiles || [];
    return inputFiles;
  } catch (error) {
    return [];
  }
};

// Generate HTML with embedded data
export const generateHtmlWithEmbeddedData = async (
  htmlPath: string,
  configs: any,
  collatedFilesTree: any,
  allTestResults: any = {},
): Promise<string> => {
  return generateHtmlWithEmbeddedDataOriginal(htmlPath, configs, collatedFilesTree, allTestResults);
};
