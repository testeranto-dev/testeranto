
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

  // IMPORTANT: The server writes graph-data.json to testeranto/reports/graph-data.json
  // for static mode. We need to serve it when requested.
  if (normalizedPath === "/graph-data.json" || normalizedPath === "/testeranto/reports/graph-data.json") {
    console.log(`[serveStaticFile] Serving graph-data.json from ${normalizedPath}`);
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, "testeranto", "reports", "graph-data.json");
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.log(`[serveStaticFile] graph-data.json not found at ${filePath}, generating it...`);
      // Generate graph data if it doesn't exist
      if (configs && (server as any).generateGraphData) {
        try {
          const graphData = (server as any).generateGraphData();
          // Ensure the directory exists
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          // Save the graph data
          fs.writeFileSync(filePath, JSON.stringify(graphData, null, 2), 'utf-8');
        } catch (error) {
          console.error(`[serveStaticFile] Error generating graph data:`, error);
          return new Response(`Graph data not available: ${error.message}`, {
            status: 404,
            headers: { "Content-Type": "text/plain" }
          });
        }
      } else {
        return new Response(`Graph data not available`, {
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }
    
    // Serve the file
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return new Response(fileContent, {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });
    } catch (error) {
      console.error(`[serveStaticFile] Error reading graph-data.json:`, error);
      return new Response(`Error reading graph data: ${error.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }

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
  const contentType = getContentType(filePath);
  const fileContent = await fs.promises.readFile(filePath);
  return new Response(fileContent, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
};

const generateAndWriteStakeholderHtml = async (
  configs: ITesterantoConfig,
): Promise<void> => {
  await embedConfigInHtml(configs);
};
