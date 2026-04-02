
import fs from "fs";
import path from "path";
import type { ITesterantoConfig } from "../../../../Types";
import { getContentType } from "./../getContentType";
import { embedConfigInHtml } from "../../utils/embedConfigInHtml";

export const routeName = (req: any): string => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const urlPath = url.pathname;
  return urlPath.slice(3);
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

export const serveStaticFile = async (
  request: Request,
  url: URL,
  configs?: ITesterantoConfig,
): Promise<Response> => {
  const normalizedPath = decodeURIComponent(url.pathname);

  if (normalizedPath.includes("..")) {
    throw new Error("Forbidden: Directory traversal not allowed");
  }

  const projectRoot = process.cwd();

  // Stakeholder API routes are now handled in Server_HTTP.ts before reaching here
  // So we don't need to check for them here

  // Handle root and index.html
  if (normalizedPath === "/" || normalizedPath === "/index.html") {
    await generateAndWriteStakeholderHtml(configs);

    const reportPath = path.join(
      projectRoot,
      "testeranto",
      "reports",
      "index.html",
    );
    const htmlWithData = fs.readFileSync(reportPath, 'utf-8');
    return new Response(htmlWithData, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Handle reports index
  if (
    normalizedPath === "/testeranto/reports/index.html" ||
    normalizedPath === "/testeranto/reports/"
  ) {
    await generateAndWriteStakeholderHtml(configs);

    const reportPath = path.join(
      projectRoot,
      "testeranto",
      "reports",
      "index.html",
    );
    const htmlWithData = fs.readFileSync(reportPath, 'utf-8');
    return new Response(htmlWithData, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  const filePath = path.join(projectRoot, normalizedPath);
  return await serveFile(filePath);
};

export const serveFile = async (filePath: string): Promise<Response> => {
  try {
    const contentType = getContentType(filePath);
    const fileContent = await fs.promises.readFile(filePath);
    console.log(`[serveFile] Serving ${filePath} (${fileContent.length} bytes)`);
    return new Response(fileContent, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error(`[serveFile] Error serving ${filePath}:`, error);
    if (error.code === 'ENOENT') {
      return new Response(`File not found: ${filePath}`, {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response(`Error reading file: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

const generateAndWriteStakeholderHtml = async (
  configs: ITesterantoConfig,
): Promise<void> => {
  await embedConfigInHtml(configs);
};
